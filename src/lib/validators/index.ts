import { z } from 'zod';

// ============================================================================
// Auth & Access
// ============================================================================

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const accessRequestSchema = z.object({
  fullName: z.string().min(2, 'Name is too short').max(120),
  wiutEmail: z.string().email().refine(
    (email) => email.endsWith('@wiut.uz') || email.endsWith('@students.wiut.uz'),
    'Please use your WIUT email address'
  ),
  studentIdCode: z.string().min(3).max(50).optional(),
  graduationYearId: z.string().uuid(),
  courseNameRaw: z.string().min(2).max(150).optional(),
});

export const activateInviteSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

// ============================================================================
// Student Profile
// ============================================================================

export const studentProfileSchema = z.object({
  quote: z.string().min(1, 'Please add a quote').max(250),
  quotePrompt: z.string().max(200).optional().nullable(),
  workFuturePlan: z.string().max(250).optional().nullable(),
  favoriteSong: z.string().max(200).optional().nullable(),
  favoriteSongUrl: z.string().url().optional().or(z.literal('')).nullable(),
  favoriteMemory: z.string().max(500).optional().nullable(),
  instagramUrl: z.string().max(200).optional().or(z.literal('')).nullable(),
  linkedinUrl: z.string().url().optional().or(z.literal('')).nullable(),
  facebookUrl: z.string().url().optional().or(z.literal('')).nullable(),
  telegramUsername: z.string().max(100).optional().or(z.literal('')).nullable(),
});

// ============================================================================
// Yearbook Messages (Signing Wall)
// ============================================================================

export const yearbookMessageSchema = z.object({
  recipientStudentId: z.string().uuid(),
  content: z.string().min(1, 'Message cannot be empty').max(300, 'Message must be 300 characters or less'),
});

// ============================================================================
// Superlatives
// ============================================================================

export const superlativeVoteSchema = z.object({
  categoryId: z.string().uuid(),
  nomineeStudentId: z.string().uuid(),
});

export const superlativeCategorySchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().max(250).optional().nullable(),
  votingOpensAt: z.string().optional().nullable(),
  votingClosesAt: z.string().optional().nullable(),
});

// ============================================================================
// Staff
// ============================================================================

export const staffProfileSchema = z.object({
  fullName: z.string().min(2).max(120),
  roleTitle: z.string().min(2).max(100),
  department: z.string().max(100).optional().nullable(),
  shortMessage: z.string().max(300).optional().nullable(),
});

export const staffThankYouSchema = z.object({
  staffProfileId: z.string().uuid(),
  message: z.string().min(1).max(150, 'Message must be 150 characters or less'),
});

// ============================================================================
// Admin — Year & Course Management
// ============================================================================

export const graduationYearSchema = z.object({
  yearLabel: z.number().int().min(2020).max(2050),
  title: z.string().min(2).max(200),
  submissionDeadline: z.string().optional().nullable(),
  editingLockAt: z.string().optional().nullable(),
});

export const courseSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(1000).optional().nullable(),
  displayOrder: z.number().int().min(0).optional(),
});

// ============================================================================
// Admin — CSV Upload (Pre-seeded activation)
// ============================================================================

export const csvStudentRowSchema = z.object({
  full_name: z.string().min(2).max(120),
  wiut_email: z.string().email(),
  student_id: z.string().optional(),
  course: z.string().min(2).max(200),
  graduation_year: z.number().int(),
});

// ============================================================================
// Photo Upload
// ============================================================================

export const photoUploadSchema = z.object({
  category: z.enum(['portrait', 'general', 'course', 'childhood']),
  caption: z.string().max(200).optional(),
  manualOrientation: z.enum(['portrait', 'landscape']).optional(),
});

// ============================================================================
// Type exports from schemas
// ============================================================================

export type LoginInput = z.infer<typeof loginSchema>;
export type AccessRequestInput = z.infer<typeof accessRequestSchema>;
export type ActivateInviteInput = z.infer<typeof activateInviteSchema>;
export type StudentProfileInput = z.infer<typeof studentProfileSchema>;
export type YearbookMessageInput = z.infer<typeof yearbookMessageSchema>;
export type SuperlativeVoteInput = z.infer<typeof superlativeVoteSchema>;
export type StaffThankYouInput = z.infer<typeof staffThankYouSchema>;
export type GraduationYearInput = z.infer<typeof graduationYearSchema>;
export type CourseInput = z.infer<typeof courseSchema>;
export type PhotoUploadInput = z.infer<typeof photoUploadSchema>;
