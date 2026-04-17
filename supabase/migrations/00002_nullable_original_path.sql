-- ============================================================================
-- Migration 00002: Make storage_original_path nullable
-- ============================================================================
--
-- The upload pipeline no longer stores the original uploaded file — it only
-- stores the `display` (1600px WebP) and `thumb` (400px WebP) variants,
-- which are indistinguishable from the source on any normal screen and cut
-- per-photo storage by ~90%.
--
-- If you've ALREADY run 00001 on a live project, apply this migration to
-- relax the NOT NULL constraint. Otherwise, 00001 already has the column
-- declared nullable and this file is a no-op.
-- ============================================================================

alter table public.student_photos
  alter column storage_original_path drop not null;
