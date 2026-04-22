-- ============================================================================
-- Migration 00003: Add missing RLS policies
-- ============================================================================
--
-- Four tables in 00001 have RLS enabled but no policies, which means every
-- query through the user-session client silently returns zero rows — even
-- for super admins. The service role bypasses RLS, so the seed script and
-- server actions that use the admin client worked fine, which is why the
-- gaps went unnoticed until the Manage Admins page tried to display scopes.
--
-- Tables fixed:
--   * app_users      — no INSERT/UPDATE/DELETE, so even super admins couldn't
--                      write (service role bypasses, but the gap was real).
--   * admin_scopes   — no policies at all → "No year assigned" ghost state
--                      on /super-admin/admins.
--   * invitations    — no policies at all → admins can create invites via
--                      service-role actions but can't read the history.
--   * staff_profiles — no read/write policies → the Staff tab rendered empty
--                      for every role in the user-session client.
--
-- Idempotent: `drop policy if exists` before each `create policy`, so the
-- file is safe to re-run.
-- ============================================================================

-- ---- app_users: super admins manage all; users update own row ----
drop policy if exists "Super admins manage app_users" on app_users;
create policy "Super admins manage app_users" on app_users
  for all
  using (get_user_role() = 'super_admin')
  with check (get_user_role() = 'super_admin');

drop policy if exists "Users update own row" on app_users;
create policy "Users update own row" on app_users
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---- admin_scopes ----
drop policy if exists "Super admins manage admin_scopes" on admin_scopes;
create policy "Super admins manage admin_scopes" on admin_scopes
  for all
  using (get_user_role() = 'super_admin')
  with check (get_user_role() = 'super_admin');

drop policy if exists "Admins read own scopes" on admin_scopes;
create policy "Admins read own scopes" on admin_scopes
  for select
  using (user_id = auth.uid());

-- ---- invitations ----
drop policy if exists "Super admins manage invitations" on invitations;
create policy "Super admins manage invitations" on invitations
  for all
  using (get_user_role() = 'super_admin')
  with check (get_user_role() = 'super_admin');

drop policy if exists "Admins read scoped invitations" on invitations;
create policy "Admins read scoped invitations" on invitations
  for select
  using (
    get_user_role() = 'admin'
    and exists (
      select 1
      from students s
      join admin_scopes a on a.graduation_year_id = s.graduation_year_id
      where s.id = invitations.student_id
        and a.user_id = auth.uid()
    )
  );

-- ---- staff_profiles ----
drop policy if exists "Authenticated users read visible staff" on staff_profiles;
create policy "Authenticated users read visible staff" on staff_profiles
  for select
  using (auth.uid() is not null and is_visible = true);

drop policy if exists "Admins manage scoped staff" on staff_profiles;
create policy "Admins manage scoped staff" on staff_profiles
  for all
  using (
    exists (
      select 1 from admin_scopes
      where admin_scopes.user_id = auth.uid()
        and admin_scopes.graduation_year_id = staff_profiles.graduation_year_id
    )
  )
  with check (
    exists (
      select 1 from admin_scopes
      where admin_scopes.user_id = auth.uid()
        and admin_scopes.graduation_year_id = staff_profiles.graduation_year_id
    )
  );

drop policy if exists "Super admins manage staff" on staff_profiles;
create policy "Super admins manage staff" on staff_profiles
  for all
  using (get_user_role() = 'super_admin')
  with check (get_user_role() = 'super_admin');
