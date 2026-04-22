import { createClient, createAdminClient } from '@/lib/supabase/server';
import type {
  Student,
  StudentWithProfile,
  GraduationYear,
  Course,
  StaffProfile,
  StudentPhoto,
  SuperlativeCategory,
  AccessRequest,
  ModerationLog,
  AuditLog,
} from '@/types';

// ============================================================================
// User / Auth Queries
// ============================================================================

export async function getCurrentUserWithRole() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: appUser } = await supabase
    .from('app_users')
    .select('*')
    .eq('id', user.id)
    .single();

  return appUser;
}

// ============================================================================
// Graduation Year Queries
// ============================================================================

export async function getGraduationYears() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('graduation_years')
    .select('*')
    .order('year_label', { ascending: false });
  return (data || []) as GraduationYear[];
}

export async function getGraduationYearBySlug(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('graduation_years')
    .select('*')
    .eq('slug', slug)
    .single();
  return data as GraduationYear | null;
}

export async function getActiveGraduationYear() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('graduation_years')
    .select('*')
    .eq('status', 'active')
    .order('year_label', { ascending: false })
    .limit(1)
    .single();
  return data as GraduationYear | null;
}

// ============================================================================
// Course Queries
// ============================================================================

export async function getCoursesByYear(yearId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('courses')
    .select('*')
    .eq('graduation_year_id', yearId)
    .eq('is_active', true)
    .order('display_order');
  return (data || []) as Course[];
}

export async function getCourseBySlug(yearId: string, slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('courses')
    .select('*')
    .eq('graduation_year_id', yearId)
    .eq('slug', slug)
    .single();
  return data as Course | null;
}

// ============================================================================
// Student Queries
// ============================================================================

export async function getVisibleStudentsByYear(yearId: string) {
  // Admin client: the (private) route group is auth-gated by layout, and
  // `student_photos` has no SELECT policy for the user-session client, which
  // meant the portrait join silently returned nothing and every card fell
  // back to the initials avatar.
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      profile:student_profiles(*),
      course:courses(*),
      portrait:student_photos(*)
    `)
    .eq('graduation_year_id', yearId)
    .eq('approval_status', 'active')
    .eq('student_photos.category', 'portrait')
    .eq('student_photos.moderation_status', 'approved')
    .eq('student_photos.is_deleted', false)
    .order('full_name');

  if (error) {
    console.error('[getVisibleStudentsByYear] failed:', error.message);
    return [];
  }

  // Supabase models `student_profiles` and `student_photos` as to-many
  // relations, so the joined columns come back as arrays even when only one
  // row matches. The `StudentWithProfile` type contract is single-object-or-
  // null, so we reshape here rather than making every caller do the same
  // index-then-null-coalesce dance (and get it wrong — see the missing
  // portraits bug on /year/[year]/students).
  const reshaped = (data || []).map((row) => {
    const r = row as unknown as {
      profile?: unknown[] | unknown | null;
      portrait?: unknown[] | unknown | null;
      course?: unknown[] | unknown | null;
    };
    return {
      ...row,
      profile: Array.isArray(r.profile) ? (r.profile[0] ?? null) : (r.profile ?? null),
      portrait: Array.isArray(r.portrait) ? (r.portrait[0] ?? null) : (r.portrait ?? null),
      course: Array.isArray(r.course) ? (r.course[0] ?? null) : (r.course ?? null),
    };
  });

  return reshaped as unknown as StudentWithProfile[];
}

export async function getStudentBySlug(yearId: string, slug: string) {
  // Admin client — same reasoning as getVisibleStudentsByYear. The
  // (private) layout has already gated on authentication.
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      profile:student_profiles(*),
      course:courses(*)
    `)
    .eq('graduation_year_id', yearId)
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('[getStudentBySlug] failed:', error.message);
    return null;
  }
  if (!data) return null;

  // Normalize the to-many joins down to a single object or null to match
  // the `StudentWithProfile` type contract.
  const r = data as unknown as {
    profile?: unknown[] | unknown | null;
    course?: unknown[] | unknown | null;
  };
  const normalized = {
    ...data,
    profile: Array.isArray(r.profile) ? (r.profile[0] ?? null) : (r.profile ?? null),
    course: Array.isArray(r.course) ? (r.course[0] ?? null) : (r.course ?? null),
  };

  return normalized as unknown as StudentWithProfile;
}

export async function getStudentPhotos(studentId: string) {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('student_photos')
    .select('*')
    .eq('student_id', studentId)
    .eq('is_deleted', false)
    .eq('moderation_status', 'approved')
    .order('category')
    .order('sort_order');
  if (error) {
    console.error('[getStudentPhotos] failed:', error.message);
    return [];
  }
  return (data || []) as StudentPhoto[];
}

export async function getStudentDashboard(studentId: string) {
  const supabase = await createClient();

  const [
    { data: student },
    { data: profile },
    { data: photos },
  ] = await Promise.all([
    supabase
      .from('students')
      .select('*, course:courses(*)')
      .eq('id', studentId)
      .single(),
    supabase
      .from('student_profiles')
      .select('*')
      .eq('student_id', studentId)
      .single(),
    supabase
      .from('student_photos')
      .select('*')
      .eq('student_id', studentId)
      .eq('is_deleted', false)
      .order('category')
      .order('sort_order'),
  ]);

  return {
    student: student as Student | null,
    profile,
    photos: (photos || []) as StudentPhoto[],
  };
}

export async function getStudentsCountByYear(yearId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from('students')
    .select('id', { count: 'exact', head: true })
    .eq('graduation_year_id', yearId)
    .eq('approval_status', 'active');
  return count || 0;
}

// ============================================================================
// Gallery Queries
// ============================================================================

export async function getApprovedGalleryPhotos(yearId: string, options?: {
  category?: string;
  courseId?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = await createClient();
  let query = supabase
    .from('student_photos')
    .select('*, student:students(full_name, slug)')
    .eq('graduation_year_id', yearId)
    .eq('moderation_status', 'approved')
    .eq('is_deleted', false);

  if (options?.category) {
    query = query.eq('category', options.category);
  }
  if (options?.courseId) {
    query = query.eq('course_id', options.courseId);
  }

  query = query.order('uploaded_at', { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 24) - 1);
  }

  const { data } = await query;
  return data || [];
}

// ============================================================================
// Staff Queries
// ============================================================================

export async function getStaffByYear(yearId: string) {
  // `staff_profiles` has RLS on with no select policies, so the user-session
  // client returns empty for everyone. The query is scoped to `is_visible`
  // rows for a specific year, which is what every authenticated user is
  // meant to see anyway — using the admin client here just restores the
  // intended read behavior without widening what's returned.
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from('staff_profiles')
    .select('*')
    .eq('graduation_year_id', yearId)
    .eq('is_visible', true)
    .order('display_order');
  return (data || []) as StaffProfile[];
}

// ============================================================================
// Yearbook Messages (Signing Wall)
// ============================================================================

export async function getMessagesForStudent(studentId: string, yearId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('yearbook_messages')
    .select('*, sender:students!sender_student_id(full_name, slug)')
    .eq('recipient_student_id', studentId)
    .eq('graduation_year_id', yearId)
    .eq('is_visible', true)
    .eq('moderation_status', 'approved')
    .order('created_at', { ascending: false });
  return data || [];
}

export async function getMessagesSentByStudent(studentId: string, yearId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from('yearbook_messages')
    .select('id', { count: 'exact', head: true })
    .eq('sender_student_id', studentId)
    .eq('graduation_year_id', yearId);
  return count || 0;
}

// ============================================================================
// Superlatives
// ============================================================================

export async function getSuperlativesByYear(yearId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('superlative_categories')
    .select('*')
    .eq('graduation_year_id', yearId)
    .order('display_order');
  return (data || []) as SuperlativeCategory[];
}

export async function getSuperlativeResults(categoryId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('superlative_votes')
    .select('nominee_student_id, student:students!nominee_student_id(full_name, slug)')
    .eq('category_id', categoryId);

  // Count votes per nominee
  const voteCounts: Record<string, { count: number; name: string; slug: string }> = {};
  for (const vote of data || []) {
    const id = vote.nominee_student_id;
    if (!voteCounts[id]) {
      const student = vote.student as unknown as { full_name: string; slug: string };
      voteCounts[id] = { count: 0, name: student.full_name, slug: student.slug };
    }
    voteCounts[id].count++;
  }

  return Object.entries(voteCounts)
    .map(([id, info]) => ({ studentId: id, ...info }))
    .sort((a, b) => b.count - a.count);
}

// ============================================================================
// Admin Queries
// ============================================================================

export async function getAdminDashboardMetrics(yearId: string) {
  const supabase = await createClient();

  const [students, pendingRequests, pendingPhotos, approvedPhotos] = await Promise.all([
    supabase
      .from('students')
      .select('approval_status', { count: 'exact' })
      .eq('graduation_year_id', yearId),
    supabase
      .from('access_requests')
      .select('id', { count: 'exact', head: true })
      .eq('graduation_year_id', yearId)
      .eq('request_status', 'pending'),
    supabase
      .from('student_photos')
      .select('id', { count: 'exact', head: true })
      .eq('graduation_year_id', yearId)
      .eq('moderation_status', 'pending')
      .eq('is_deleted', false),
    supabase
      .from('student_photos')
      .select('id', { count: 'exact', head: true })
      .eq('graduation_year_id', yearId)
      .eq('moderation_status', 'approved')
      .eq('is_deleted', false),
  ]);

  const totalStudents = students.data?.length || 0;
  const activeStudents = students.data?.filter(
    (s) => s.approval_status === 'active'
  ).length || 0;

  return {
    totalStudents,
    activeStudents,
    pendingRequests: pendingRequests.count || 0,
    pendingPhotos: pendingPhotos.count || 0,
    approvedPhotos: approvedPhotos.count || 0,
  };
}

export async function getAccessRequests(yearId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('access_requests')
    .select('*')
    .eq('graduation_year_id', yearId)
    .order('created_at', { ascending: false });
  return (data || []) as AccessRequest[];
}

// Moderation queues & logs use the admin client because the page-level role
// gate (`requireRole('admin', 'super_admin')`) is the real security boundary
// and there are no admin-scoped RLS policies on `student_photos` or
// `moderation_logs` — the user-session client would return empty lists.
//
// A `null` yearId means "across all years" — i.e. the super-admin view.
export async function getModerationQueue(
  yearId: string | null,
  filters?: {
    category?: string;
    status?: string;
  },
) {
  const supabase = await createAdminClient();
  let query = supabase
    .from('student_photos')
    .select(
      '*, student:students(full_name, slug, course:courses(name)), year:graduation_years(year_label, slug)',
    )
    .eq('is_deleted', false);

  if (yearId) {
    query = query.eq('graduation_year_id', yearId);
  }
  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.status) {
    query = query.eq('moderation_status', filters.status);
  } else {
    query = query.eq('moderation_status', 'pending');
  }

  query = query.order('uploaded_at', { ascending: false });

  const { data, error } = await query;
  if (error) {
    console.error('[getModerationQueue] failed:', error.message);
    return [];
  }
  return data || [];
}

// Profiles awaiting admin review. `null` yearId returns all years (super-admin).
export async function getProfileModerationQueue(yearId: string | null) {
  const supabase = await createAdminClient();
  const query = supabase
    .from('student_profiles')
    .select(
      'student_id, profile_status, submitted_at, quote, quote_prompt, work_future_plan, favorite_song, favorite_memory, student:students(id, full_name, slug, graduation_year_id, course:courses(name), year:graduation_years(year_label, slug))',
    )
    .eq('profile_status', 'pending')
    .order('submitted_at', { ascending: false });

  const { data, error } = await query;
  if (error) {
    console.error('[getProfileModerationQueue] failed:', error.message);
    return [];
  }

  if (!yearId) return data || [];
  // Year scoping has to happen in app code because the year lives on the
  // joined `students` row, not on `student_profiles`.
  return (data || []).filter((row) => {
    const s = row.student as unknown as { graduation_year_id?: string } | null;
    return s?.graduation_year_id === yearId;
  });
}

export async function getModerationLogs(yearId: string | null, limit = 50) {
  void yearId; // Logs aren't currently year-scoped in the schema; accept the
  // param for future use without silently dropping it.
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('moderation_logs')
    .select('*, actor:app_users(email)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('[getModerationLogs] failed:', error.message);
    return [];
  }
  return (data || []) as ModerationLog[];
}

export async function getAuditLogs(limit = 100) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('audit_logs')
    .select('*, actor:app_users(email)')
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data || []) as AuditLog[];
}

// ============================================================================
// Class Statistics
// ============================================================================

export async function getClassStatistics(yearId: string) {
  const supabase = await createClient();

  const [
    { data: students },
    { data: profiles },
    { count: totalPhotos },
    { data: courses },
    { count: messageCount },
  ] = await Promise.all([
    supabase
      .from('students')
      .select('id, course_id, profile_completion_pct, approval_status')
      .eq('graduation_year_id', yearId)
      .eq('approval_status', 'active'),
    supabase
      .from('student_profiles')
      .select('quote, favorite_song, work_future_plan, student:students!inner(graduation_year_id)')
      .eq('students.graduation_year_id', yearId),
    supabase
      .from('student_photos')
      .select('id', { count: 'exact', head: true })
      .eq('graduation_year_id', yearId)
      .eq('moderation_status', 'approved')
      .eq('is_deleted', false),
    supabase
      .from('courses')
      .select('id, name')
      .eq('graduation_year_id', yearId)
      .eq('is_active', true),
    supabase
      .from('yearbook_messages')
      .select('id', { count: 'exact', head: true })
      .eq('graduation_year_id', yearId),
  ]);

  const totalStudents = students?.length || 0;
  const avgCompletion = totalStudents > 0
    ? Math.round((students?.reduce((acc, s) => acc + s.profile_completion_pct, 0) || 0) / totalStudents)
    : 0;

  // Course breakdown
  const courseBreakdown = (courses || []).map((course) => ({
    name: course.name,
    count: students?.filter((s) => s.course_id === course.id).length || 0,
  }));

  // Collect songs
  const songs = (profiles || [])
    .filter((p) => p.favorite_song)
    .map((p) => p.favorite_song as string);

  return {
    totalStudents,
    avgCompletion,
    totalPhotos: totalPhotos || 0,
    totalMessages: messageCount || 0,
    courseBreakdown,
    songs,
  };
}
