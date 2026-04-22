'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserWithRole } from '@/lib/auth';
import { studentProfileSchema, yearbookMessageSchema } from '@/lib/validators';
import { calculateProfileCompletion, isMessageFlagged } from '@/lib/utils';
import { MESSAGE_LIMITS } from '@/types';
import { revalidatePath } from 'next/cache';

export async function saveStudentProfile(formData: FormData) {
  const user = await getUserWithRole();
  if (!user || user.role !== 'student' || !user.studentId) {
    return { error: 'Unauthorized' };
  }

  const parsed = studentProfileSchema.safeParse({
    quote: formData.get('quote'),
    quotePrompt: formData.get('quotePrompt') || null,
    workFuturePlan: formData.get('workFuturePlan') || null,
    favoriteSong: formData.get('favoriteSong') || null,
    favoriteSongUrl: formData.get('favoriteSongUrl') || null,
    favoriteMemory: formData.get('favoriteMemory') || null,
    instagramUrl: formData.get('instagramUrl') || null,
    linkedinUrl: formData.get('linkedinUrl') || null,
    facebookUrl: formData.get('facebookUrl') || null,
    telegramUsername: formData.get('telegramUsername') || null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('student_profiles')
    .update({
      quote: parsed.data.quote,
      quote_prompt: parsed.data.quotePrompt,
      work_future_plan: parsed.data.workFuturePlan,
      favorite_song: parsed.data.favoriteSong,
      favorite_song_url: parsed.data.favoriteSongUrl,
      favorite_memory: parsed.data.favoriteMemory,
      instagram_url: parsed.data.instagramUrl,
      linkedin_url: parsed.data.linkedinUrl,
      facebook_url: parsed.data.facebookUrl,
      telegram_username: parsed.data.telegramUsername,
    })
    .eq('student_id', user.studentId);

  if (error) {
    return { error: 'Failed to save profile.' };
  }

  // Update completion percentage — best-effort, failing here shouldn't
  // block the user from continuing to edit their profile.
  const { data: photos } = await supabase
    .from('student_photos')
    .select('id')
    .eq('student_id', user.studentId)
    .eq('category', 'portrait')
    .eq('is_deleted', false)
    .limit(1);

  const completion = calculateProfileCompletion(
    {
      quote: parsed.data.quote,
      work_future_plan: parsed.data.workFuturePlan,
      favorite_song: parsed.data.favoriteSong,
      favorite_memory: parsed.data.favoriteMemory,
      instagram_url: parsed.data.instagramUrl,
      linkedin_url: parsed.data.linkedinUrl,
    },
    (photos?.length || 0) > 0
  );

  const { error: completionErr } = await supabase
    .from('students')
    .update({ profile_completion_pct: completion })
    .eq('id', user.studentId);

  if (completionErr) {
    console.warn('[saveStudentProfile] completion update failed:', completionErr.message);
  }

  revalidatePath('/student/profile');
  return { success: true };
}

export async function submitStudentProfile() {
  const user = await getUserWithRole();
  if (!user || user.role !== 'student' || !user.studentId) {
    return { error: 'Unauthorized' };
  }

  const supabase = await createClient();

  // Check that profile has minimum required fields — maybeSingle because
  // a student without a profile row yet is an expected early-state case.
  const { data: profile } = await supabase
    .from('student_profiles')
    .select('quote')
    .eq('student_id', user.studentId)
    .maybeSingle();

  if (!profile?.quote) {
    return { error: 'Please add a quote before submitting.' };
  }

  // Check portrait exists
  const { data: portrait } = await supabase
    .from('student_photos')
    .select('id')
    .eq('student_id', user.studentId)
    .eq('category', 'portrait')
    .eq('is_deleted', false)
    .limit(1);

  if (!portrait?.length) {
    return { error: 'Please upload a portrait photo before submitting.' };
  }

  // Flip profile to pending
  const { error: profileErr } = await supabase
    .from('student_profiles')
    .update({
      profile_status: 'pending',
      submitted_at: new Date().toISOString(),
    })
    .eq('student_id', user.studentId);

  if (profileErr) {
    return { error: 'Failed to submit profile.' };
  }

  // Promote any draft photos to pending for moderation. Failure here means
  // photos won't enter the moderation queue — surface to the caller.
  const { error: photosErr } = await supabase
    .from('student_photos')
    .update({ moderation_status: 'pending' })
    .eq('student_id', user.studentId)
    .eq('moderation_status', 'draft')
    .eq('is_deleted', false);

  if (photosErr) {
    return { error: 'Profile submitted, but failed to queue photos for review.' };
  }

  revalidatePath('/student/status');
  return { success: true };
}

export async function sendYearbookMessage(formData: FormData) {
  const user = await getUserWithRole();
  if (!user || user.role !== 'student' || !user.studentId || !user.yearId) {
    return { error: 'Unauthorized' };
  }

  const parsed = yearbookMessageSchema.safeParse({
    recipientStudentId: formData.get('recipientStudentId'),
    content: formData.get('content'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  if (parsed.data.recipientStudentId === user.studentId) {
    return { error: 'You cannot send a message to yourself.' };
  }

  const supabase = await createClient();

  // Check sender limit
  const { count: sentCount } = await supabase
    .from('yearbook_messages')
    .select('id', { count: 'exact', head: true })
    .eq('sender_student_id', user.studentId)
    .eq('graduation_year_id', user.yearId);

  if ((sentCount || 0) >= MESSAGE_LIMITS.maxPerSender) {
    return { error: `You can send a maximum of ${MESSAGE_LIMITS.maxPerSender} messages.` };
  }

  // Check recipient limit
  const { count: receivedCount } = await supabase
    .from('yearbook_messages')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_student_id', parsed.data.recipientStudentId)
    .eq('graduation_year_id', user.yearId);

  if ((receivedCount || 0) >= MESSAGE_LIMITS.maxPerRecipient) {
    return { error: 'This student has reached their maximum number of messages.' };
  }

  const flagged = isMessageFlagged(parsed.data.content);

  const { error } = await supabase.from('yearbook_messages').insert({
    sender_student_id: user.studentId,
    recipient_student_id: parsed.data.recipientStudentId,
    graduation_year_id: user.yearId,
    content: parsed.data.content,
    is_flagged: flagged,
    moderation_status: flagged ? 'pending' : 'approved',
  });

  if (error) {
    return { error: 'Failed to send message.' };
  }

  // Next 16: dynamic-segment patterns require the 'page' type argument.
  revalidatePath('/year/[year]/students/[slug]', 'page');
  return { success: true };
}

export async function toggleMessageVisibility(messageId: string) {
  const user = await getUserWithRole();
  if (!user || !user.studentId) {
    return { error: 'Unauthorized' };
  }

  const supabase = await createClient();

  const { data: message } = await supabase
    .from('yearbook_messages')
    .select('is_visible')
    .eq('id', messageId)
    .eq('recipient_student_id', user.studentId)
    .maybeSingle();

  if (!message) {
    return { error: 'Message not found.' };
  }

  const { error: updateErr } = await supabase
    .from('yearbook_messages')
    .update({ is_visible: !message.is_visible })
    .eq('id', messageId);

  if (updateErr) {
    return { error: 'Failed to update message visibility.' };
  }

  revalidatePath('/student/messages');
  return { success: true };
}
