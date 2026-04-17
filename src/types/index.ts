// ============================================================================
// WIUT Graduation Book — Core Type Definitions
// ============================================================================

export type AppRole = 'super_admin' | 'admin' | 'student';

export type PhotoCategory = 'portrait' | 'general' | 'course' | 'childhood';

export type ModerationStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'hidden'
  | 'removed';

export type ProcessingStatus = 'uploading' | 'processing' | 'ready' | 'failed';

export type Orientation = 'portrait' | 'landscape';

export type ApprovalStatus =
  | 'not_requested'
  | 'requested'
  | 'approved'
  | 'rejected'
  | 'invited'
  | 'active';

export type YearStatus = 'draft' | 'active' | 'archived';

export type ProfileStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'hidden';

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export type VotingStatus = 'draft' | 'open' | 'closed' | 'revealed';

// ============================================================================
// Database Row Types
// ============================================================================

export interface AppUser {
  id: string;
  email: string;
  role: AppRole;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GraduationYear {
  id: string;
  year_label: number;
  title: string;
  slug: string;
  status: YearStatus;
  submission_deadline: string | null;
  editing_lock_at: string | null;
  is_visible: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  graduation_year_id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_photo_path: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  user_id: string | null;
  graduation_year_id: string;
  course_id: string | null;
  full_name: string;
  full_name_normalized: string;
  slug: string;
  wiut_email: string;
  student_id_code: string | null;
  approval_status: ApprovalStatus;
  profile_completion_pct: number;
  invited_at: string | null;
  joined_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentProfile {
  id: string;
  student_id: string;
  quote: string;
  quote_prompt: string | null;
  work_future_plan: string | null;
  favorite_song: string | null;
  favorite_song_url: string | null;
  favorite_memory: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  facebook_url: string | null;
  telegram_username: string | null;
  profile_status: ProfileStatus;
  submitted_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentPhoto {
  id: string;
  student_id: string;
  graduation_year_id: string;
  course_id: string | null;
  category: PhotoCategory;
  /** Null by default — originals are not stored to save space. Kept nullable for future archival workflow. */
  storage_original_path: string | null;
  storage_display_path: string;
  storage_thumb_path: string;
  mime_type: string | null;
  file_size: number | null;
  width: number | null;
  height: number | null;
  orientation: Orientation | null;
  crop_x: number | null;
  crop_y: number | null;
  crop_scale: number | null;
  focal_x: number | null;
  focal_y: number | null;
  caption: string | null;
  sort_order: number;
  processing_status: ProcessingStatus;
  moderation_status: ModerationStatus;
  rejection_reason: string | null;
  approved_by: string | null;
  approved_at: string | null;
  uploaded_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface StaffProfile {
  id: string;
  graduation_year_id: string;
  full_name: string;
  role_title: string;
  department: string | null;
  short_message: string | null;
  portrait_original_path: string | null;
  portrait_display_path: string | null;
  portrait_thumb_path: string | null;
  is_visible: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface AccessRequest {
  id: string;
  full_name: string;
  wiut_email: string;
  student_id_code: string | null;
  graduation_year_id: string | null;
  course_name_raw: string | null;
  document_path: string | null;
  request_status: RequestStatus;
  reviewed_by: string | null;
  review_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invitation {
  id: string;
  student_id: string;
  token_hash: string;
  expires_at: string;
  used_at: string | null;
  sent_by: string | null;
  created_at: string;
}

export interface AdminScope {
  id: string;
  user_id: string;
  graduation_year_id: string | null;
  can_manage_students: boolean;
  can_manage_courses: boolean;
  can_manage_staff: boolean;
  can_moderate: boolean;
  created_at: string;
}

export interface ModerationLog {
  id: string;
  actor_user_id: string | null;
  target_type: string;
  target_id: string;
  action: string;
  old_status: string | null;
  new_status: string | null;
  reason: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_user_id: string | null;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  details_json: Record<string, unknown> | null;
  created_at: string;
}

// ============================================================================
// New features from Deep Review
// ============================================================================

export interface YearbookMessage {
  id: string;
  sender_student_id: string;
  recipient_student_id: string;
  graduation_year_id: string;
  content: string;
  is_visible: boolean;
  is_flagged: boolean;
  moderation_status: ModerationStatus;
  created_at: string;
}

export interface SuperlativeCategory {
  id: string;
  graduation_year_id: string;
  title: string;
  description: string | null;
  display_order: number;
  voting_status: VotingStatus;
  voting_opens_at: string | null;
  voting_closes_at: string | null;
  created_at: string;
}

export interface SuperlativeVote {
  id: string;
  category_id: string;
  voter_student_id: string;
  nominee_student_id: string;
  graduation_year_id: string;
  created_at: string;
}

export interface StaffThankYou {
  id: string;
  staff_profile_id: string;
  student_id: string;
  graduation_year_id: string;
  message: string;
  is_featured: boolean;
  created_at: string;
}

// ============================================================================
// Composite / View Types
// ============================================================================

export interface StudentWithProfile extends Student {
  profile: StudentProfile | null;
  portrait: StudentPhoto | null;
  course: Course | null;
}

export interface StudentProfilePage extends StudentWithProfile {
  photos: StudentPhoto[];
  messages_received: (YearbookMessage & { sender_name: string })[];
  superlative_wins: (SuperlativeCategory & { vote_count: number })[];
}

export interface PermissionContext {
  userId: string;
  role: AppRole;
  yearId?: string;
  studentId?: string;
}

export interface PhotoUploadInput {
  studentId: string;
  graduationYearId: string;
  category: PhotoCategory;
  file: File;
  manualOrientation?: Orientation;
  crop?: {
    x: number;
    y: number;
    scale: number;
    focalX?: number;
    focalY?: number;
  };
}

// Photo count limits per student
export const PHOTO_LIMITS: Record<PhotoCategory, number> = {
  portrait: 1,
  general: 5,
  course: 3,
  childhood: 1,
};

// Message limits
export const MESSAGE_LIMITS = {
  maxPerRecipient: 30,
  maxPerSender: 20,
  maxLength: 300,
} as const;

export const STAFF_THANKYOU_MAX_LENGTH = 150;
