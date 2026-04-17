-- ============================================================================
-- WIUT Graduation Book — Full Database Schema
-- Includes all improvements from the Deep Product Review
-- ============================================================================

-- Enable necessary extensions
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. App Users (maps to Supabase auth.users)
-- ============================================================================
create table app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null check (role in ('super_admin', 'admin', 'student')),
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 2. Graduation Years
-- ============================================================================
create table graduation_years (
  id uuid primary key default gen_random_uuid(),
  year_label integer not null unique,
  title text not null,
  slug text not null unique,
  status text not null check (status in ('draft', 'active', 'archived')) default 'draft',
  submission_deadline timestamptz,
  editing_lock_at timestamptz,
  is_visible boolean not null default true,
  created_by uuid references app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 3. Courses
-- ============================================================================
create table courses (
  id uuid primary key default gen_random_uuid(),
  graduation_year_id uuid not null references graduation_years(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  cover_photo_path text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (graduation_year_id, slug)
);

-- ============================================================================
-- 4. Students
-- ============================================================================
create table students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references app_users(id) on delete set null,
  graduation_year_id uuid not null references graduation_years(id) on delete cascade,
  course_id uuid references courses(id) on delete set null,
  full_name text not null,
  full_name_normalized text not null,
  slug text not null,
  wiut_email text not null,
  student_id_code text,
  approval_status text not null check (
    approval_status in ('not_requested', 'requested', 'approved', 'rejected', 'invited', 'active')
  ) default 'not_requested',
  profile_completion_pct integer not null default 0,
  invited_at timestamptz,
  joined_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (graduation_year_id, wiut_email),
  unique (graduation_year_id, slug)
);

create index idx_students_year_status on students(graduation_year_id, approval_status);

-- ============================================================================
-- 5. Student Profiles
-- ============================================================================
create table student_profiles (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null unique references students(id) on delete cascade,
  quote text not null default '',
  quote_prompt text,
  work_future_plan text,
  favorite_song text,
  favorite_song_url text,
  favorite_memory text,
  instagram_url text,
  linkedin_url text,
  facebook_url text,
  telegram_username text,
  profile_status text not null check (
    profile_status in ('draft', 'pending', 'approved', 'rejected', 'hidden')
  ) default 'draft',
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 6. Student Photos
-- ============================================================================
create table student_photos (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  graduation_year_id uuid not null references graduation_years(id) on delete cascade,
  course_id uuid references courses(id) on delete set null,
  category text not null check (category in ('portrait', 'general', 'course', 'childhood')),
  -- Originals are NOT stored by default (saves ~90% of storage).
  -- Left nullable so a future archival workflow can optionally populate it.
  storage_original_path text,
  storage_display_path text not null,
  storage_thumb_path text not null,
  mime_type text,
  file_size integer,
  width integer,
  height integer,
  orientation text check (orientation in ('portrait', 'landscape')),
  crop_x numeric,
  crop_y numeric,
  crop_scale numeric,
  focal_x numeric,
  focal_y numeric,
  caption text,
  sort_order integer not null default 0,
  processing_status text not null check (
    processing_status in ('uploading', 'processing', 'ready', 'failed')
  ) default 'uploading',
  moderation_status text not null check (
    moderation_status in ('draft', 'pending', 'approved', 'rejected', 'hidden', 'removed')
  ) default 'draft',
  rejection_reason text,
  approved_by uuid references app_users(id),
  approved_at timestamptz,
  uploaded_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_deleted boolean not null default false
);

-- Critical indexes for performance
create index idx_photos_year_cat_status on student_photos(graduation_year_id, category, moderation_status) where is_deleted = false;
create index idx_photos_student_cat on student_photos(student_id, category) where is_deleted = false;

-- ============================================================================
-- 7. Staff Profiles
-- ============================================================================
create table staff_profiles (
  id uuid primary key default gen_random_uuid(),
  graduation_year_id uuid not null references graduation_years(id) on delete cascade,
  full_name text not null,
  role_title text not null,
  department text,
  short_message text,
  portrait_original_path text,
  portrait_display_path text,
  portrait_thumb_path text,
  is_visible boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 8. Access Requests
-- ============================================================================
create table access_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  wiut_email text not null,
  student_id_code text,
  graduation_year_id uuid references graduation_years(id) on delete set null,
  course_name_raw text,
  document_path text,
  request_status text not null check (
    request_status in ('pending', 'approved', 'rejected')
  ) default 'pending',
  reviewed_by uuid references app_users(id),
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_requests_year_status on access_requests(graduation_year_id, request_status);

-- ============================================================================
-- 9. Invitations
-- ============================================================================
create table invitations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  sent_by uuid references app_users(id),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 10. Admin Scopes
-- ============================================================================
create table admin_scopes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  graduation_year_id uuid references graduation_years(id) on delete cascade,
  can_manage_students boolean not null default true,
  can_manage_courses boolean not null default true,
  can_manage_staff boolean not null default true,
  can_moderate boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 11. Moderation Logs
-- ============================================================================
create table moderation_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references app_users(id),
  target_type text not null,
  target_id uuid not null,
  action text not null,
  old_status text,
  new_status text,
  reason text,
  created_at timestamptz not null default now()
);

create index idx_modlogs_created on moderation_logs(created_at desc);

-- ============================================================================
-- 12. Audit Logs
-- ============================================================================
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references app_users(id),
  action_type text not null,
  entity_type text not null,
  entity_id uuid,
  details_json jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 13. Yearbook Messages (Signing Wall) — NEW from Deep Review
-- ============================================================================
create table yearbook_messages (
  id uuid primary key default gen_random_uuid(),
  sender_student_id uuid not null references students(id) on delete cascade,
  recipient_student_id uuid not null references students(id) on delete cascade,
  graduation_year_id uuid not null references graduation_years(id) on delete cascade,
  content text not null check (char_length(content) <= 300),
  is_visible boolean not null default true,
  is_flagged boolean not null default false,
  moderation_status text not null check (
    moderation_status in ('draft', 'pending', 'approved', 'rejected', 'hidden', 'removed')
  ) default 'approved',
  created_at timestamptz not null default now()
);

create index idx_messages_recipient on yearbook_messages(recipient_student_id, graduation_year_id);
create index idx_messages_sender on yearbook_messages(sender_student_id, graduation_year_id);

-- ============================================================================
-- 14. Superlative Categories — NEW from Deep Review
-- ============================================================================
create table superlative_categories (
  id uuid primary key default gen_random_uuid(),
  graduation_year_id uuid not null references graduation_years(id) on delete cascade,
  title text not null,
  description text,
  display_order integer not null default 0,
  voting_status text not null check (
    voting_status in ('draft', 'open', 'closed', 'revealed')
  ) default 'draft',
  voting_opens_at timestamptz,
  voting_closes_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 15. Superlative Votes — NEW from Deep Review
-- ============================================================================
create table superlative_votes (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references superlative_categories(id) on delete cascade,
  voter_student_id uuid not null references students(id) on delete cascade,
  nominee_student_id uuid not null references students(id) on delete cascade,
  graduation_year_id uuid not null references graduation_years(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (category_id, voter_student_id)
);

-- ============================================================================
-- 16. Staff Thank-You Messages — NEW from Deep Review
-- ============================================================================
create table staff_thank_yous (
  id uuid primary key default gen_random_uuid(),
  staff_profile_id uuid not null references staff_profiles(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  graduation_year_id uuid not null references graduation_years(id) on delete cascade,
  message text not null check (char_length(message) <= 150),
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Row-Level Security Policies
-- ============================================================================

alter table app_users enable row level security;
alter table graduation_years enable row level security;
alter table courses enable row level security;
alter table students enable row level security;
alter table student_profiles enable row level security;
alter table student_photos enable row level security;
alter table staff_profiles enable row level security;
alter table access_requests enable row level security;
alter table invitations enable row level security;
alter table admin_scopes enable row level security;
alter table moderation_logs enable row level security;
alter table audit_logs enable row level security;
alter table yearbook_messages enable row level security;
alter table superlative_categories enable row level security;
alter table superlative_votes enable row level security;
alter table staff_thank_yous enable row level security;

-- Helper function to get current user's role
create or replace function get_user_role()
returns text as $$
  select role from app_users where id = auth.uid();
$$ language sql security definer stable;

-- Helper function to get current user's student id
create or replace function get_student_id()
returns uuid as $$
  select id from students where user_id = auth.uid() limit 1;
$$ language sql security definer stable;

-- Helper function to get current user's graduation year
create or replace function get_student_year_id()
returns uuid as $$
  select graduation_year_id from students where user_id = auth.uid() limit 1;
$$ language sql security definer stable;

-- ---- app_users policies ----
create policy "Users can read own row" on app_users
  for select using (id = auth.uid());
create policy "Super admins can read all users" on app_users
  for select using (get_user_role() = 'super_admin');

-- ---- graduation_years policies ----
create policy "Anyone authenticated can read visible years" on graduation_years
  for select using (auth.uid() is not null and is_visible = true);
create policy "Super admin full access to years" on graduation_years
  for all using (get_user_role() = 'super_admin');

-- ---- courses policies ----
create policy "Authenticated users can read active courses" on courses
  for select using (auth.uid() is not null and is_active = true);
create policy "Super admin full access to courses" on courses
  for all using (get_user_role() = 'super_admin');

-- ---- students policies ----
create policy "Students can read own row" on students
  for select using (user_id = auth.uid());
create policy "Students can read active classmates in their year" on students
  for select using (
    graduation_year_id = get_student_year_id()
    and approval_status = 'active'
  );
create policy "Admins can read students in scoped year" on students
  for select using (
    exists (
      select 1 from admin_scopes
      where admin_scopes.user_id = auth.uid()
      and admin_scopes.graduation_year_id = students.graduation_year_id
    )
  );
create policy "Super admin full access to students" on students
  for all using (get_user_role() = 'super_admin');

-- ---- student_profiles policies ----
create policy "Student can read and update own profile" on student_profiles
  for all using (
    student_id = get_student_id()
  );
create policy "Students can read approved profiles in their year" on student_profiles
  for select using (
    profile_status = 'approved'
    and exists (
      select 1 from students s
      where s.id = student_profiles.student_id
      and s.graduation_year_id = get_student_year_id()
    )
  );
create policy "Super admin full access to profiles" on student_profiles
  for all using (get_user_role() = 'super_admin');

-- ---- student_photos policies ----
create policy "Students can read own photos" on student_photos
  for select using (student_id = get_student_id());
create policy "Students can read approved photos in their year" on student_photos
  for select using (
    moderation_status = 'approved'
    and is_deleted = false
    and graduation_year_id = get_student_year_id()
  );
create policy "Students can insert own photos" on student_photos
  for insert with check (student_id = get_student_id());
create policy "Students can update own photos" on student_photos
  for update using (student_id = get_student_id());
create policy "Super admin full access to photos" on student_photos
  for all using (get_user_role() = 'super_admin');

-- ---- yearbook_messages policies ----
create policy "Students can read messages in their year" on yearbook_messages
  for select using (
    graduation_year_id = get_student_year_id()
    and is_visible = true
    and moderation_status = 'approved'
  );
create policy "Students can read own sent messages" on yearbook_messages
  for select using (sender_student_id = get_student_id());
create policy "Students can insert messages" on yearbook_messages
  for insert with check (sender_student_id = get_student_id());
create policy "Recipients can toggle visibility" on yearbook_messages
  for update using (recipient_student_id = get_student_id());

-- ---- access_requests policies ----
create policy "Admins and super admins can read requests" on access_requests
  for select using (
    get_user_role() in ('admin', 'super_admin')
  );
create policy "Super admin full access to requests" on access_requests
  for all using (get_user_role() = 'super_admin');

-- ---- moderation_logs & audit_logs ----
create policy "Admins can read moderation logs" on moderation_logs
  for select using (get_user_role() in ('admin', 'super_admin'));
create policy "Super admin can read audit logs" on audit_logs
  for select using (get_user_role() in ('admin', 'super_admin'));

-- ---- superlatives ----
create policy "Students can read revealed superlatives" on superlative_categories
  for select using (
    auth.uid() is not null
    and (voting_status in ('open', 'revealed') or get_user_role() in ('admin', 'super_admin'))
  );
create policy "Students can vote" on superlative_votes
  for insert with check (voter_student_id = get_student_id());
create policy "Students can read own votes" on superlative_votes
  for select using (voter_student_id = get_student_id());

-- ============================================================================
-- Updated_at trigger function
-- ============================================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply to all tables with updated_at
create trigger set_updated_at before update on app_users for each row execute function update_updated_at();
create trigger set_updated_at before update on graduation_years for each row execute function update_updated_at();
create trigger set_updated_at before update on courses for each row execute function update_updated_at();
create trigger set_updated_at before update on students for each row execute function update_updated_at();
create trigger set_updated_at before update on student_profiles for each row execute function update_updated_at();
create trigger set_updated_at before update on student_photos for each row execute function update_updated_at();
create trigger set_updated_at before update on staff_profiles for each row execute function update_updated_at();
create trigger set_updated_at before update on access_requests for each row execute function update_updated_at();
