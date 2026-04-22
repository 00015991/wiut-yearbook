/**
 * WIUT Graduation Yearbook — Database Seed Script
 *
 * Seeds demo data: super admin, graduation year, courses, sample students.
 * Idempotent — safe to run multiple times.
 *
 * Usage:
 *   npm run seed
 *
 * Requires these env vars (from .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'node:path'

config({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing env: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// -----------------------------------------------------------------------------
// Seed data
// -----------------------------------------------------------------------------

const SUPER_ADMIN = {
  email: 'superadmin@wiut.uz',
  password: 'maxmud7517500.',
  full_name: 'Platform Super Admin',
}

const DEMO_ADMIN = {
  email: 'admin2026@wiut.uz',
  password: 'bobur812_812',
  full_name: 'Class of 2026 Admin',
}

const YEAR = {
  year_label: 2026,
  title: 'Class of 2026',
  slug: '2026',
  status: 'active' as const,
  // No deadline yet — admins can set one later from the year settings page.
  submission_deadline: null as string | null,
  is_visible: true,
}

// Keep `slug` stable across renames so existing student rows (and any
// admin bookmarks) keep resolving. Only the display `name` is updated
// when a course is renamed — see the cleanup step in main() for removal
// of old slugs we no longer offer.
const COURSES = [
  { slug: 'business', name: 'Business Administration', description: 'Faculty of Business' },
  { slug: 'economics', name: 'Economics and Finance', description: 'Faculty of Business' },
  { slug: 'computing', name: 'Business Information Technologies', description: 'Faculty of Business' },
  { slug: 'commercial-law', name: 'Commercial Law', description: 'Faculty of Law' },
  { slug: 'international-business', name: 'Finance', description: 'Faculty of Business' },
]

const DEMO_STUDENTS = [
  { full_name: 'Dilnoza Karimova', email: 'dilnoza.k@student.wiut.uz', course: 'business' },
  { full_name: 'Bobur Aliyev', email: 'bobur.a@student.wiut.uz', course: 'computing' },
  { full_name: 'Malika Saidova', email: 'malika.s@student.wiut.uz', course: 'economics' },
  { full_name: 'Rustam Yusupov', email: 'rustam.y@student.wiut.uz', course: 'commercial-law' },
  { full_name: 'Nodira Tashkentova', email: 'nodira.t@student.wiut.uz', course: 'international-business' },
  { full_name: 'Aziz Rakhimov', email: 'aziz.r@student.wiut.uz', course: 'computing' },
  { full_name: 'Kamila Nurbekova', email: 'kamila.n@student.wiut.uz', course: 'business' },
  { full_name: 'Sherzod Abdullayev', email: 'sherzod.a@student.wiut.uz', course: 'economics' },
]

const SUPERLATIVES = [
  { title: 'Most Likely to Succeed', description: 'Will be running a Fortune 500 company in 10 years' },
  { title: 'Best Smile', description: 'Could light up any lecture hall' },
  { title: 'Class Clown', description: 'Made us laugh through every exam week' },
  { title: 'Future Nobel Laureate', description: 'Most likely to change the world with their research' },
  { title: 'Best Dressed', description: 'Never had a bad outfit day' },
  { title: 'Most Likely to Travel the World', description: 'Has more passport stamps than exam certificates' },
]

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/** Slugify a name: lowercase, replace non-alphanumeric with dash, trim dashes. */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Normalize a name for search: lowercase, collapse spaces. */
function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, ' ')
}

async function createAuthUser(email: string, password: string, fullName: string) {
  const { data: existing } = await supabase.auth.admin.listUsers()
  const found = existing?.users.find((u) => u.email === email)
  if (found) {
    // Update password + metadata so the script is idempotent even if creds changed
    const { error: updateErr } = await supabase.auth.admin.updateUserById(found.id, {
      password,
      user_metadata: { full_name: fullName },
    })
    if (updateErr) throw updateErr
    console.log(`  ↳ updated existing auth user: ${email}`)
    return found.id
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (error) throw error
  console.log(`  ↳ created auth user: ${email}`)
  return data.user!.id
}

async function upsertAppUser(
  id: string,
  email: string,
  role: 'super_admin' | 'admin' | 'student',
) {
  const { error } = await supabase
    .from('app_users')
    .upsert({ id, email, role, is_active: true }, { onConflict: 'id' })
  if (error) throw error
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

async function main() {
  console.log('🌱 WIUT Yearbook — Seeding database\n')

  // 1. Super admin
  console.log('👑 Creating super admin...')
  const superAdminId = await createAuthUser(
    SUPER_ADMIN.email,
    SUPER_ADMIN.password,
    SUPER_ADMIN.full_name,
  )
  await upsertAppUser(superAdminId, SUPER_ADMIN.email, 'super_admin')

  // 2. Graduation year
  console.log('\n🎓 Creating graduation year...')
  const { data: year, error: yearErr } = await supabase
    .from('graduation_years')
    .upsert({ ...YEAR, created_by: superAdminId }, { onConflict: 'slug' })
    .select()
    .single()
  if (yearErr) throw yearErr
  console.log(`  ↳ ${year.title} (${year.slug})`)

  // 3. Courses
  console.log('\n📚 Creating courses...')
  const courseRows = COURSES.map((c, i) => ({
    graduation_year_id: year.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    display_order: i,
    is_active: true,
  }))
  const { data: courses, error: coursesErr } = await supabase
    .from('courses')
    .upsert(courseRows, { onConflict: 'graduation_year_id,slug' })
    .select()
  if (coursesErr) throw coursesErr
  console.log(`  ↳ ${courses.length} courses created`)
  const courseMap = new Map(courses.map((c) => [c.slug, c.id]))

  // 4. Demo year admin
  console.log('\n🛡  Creating demo year admin...')
  const adminId = await createAuthUser(DEMO_ADMIN.email, DEMO_ADMIN.password, DEMO_ADMIN.full_name)
  await upsertAppUser(adminId, DEMO_ADMIN.email, 'admin')

  // admin_scopes has no unique constraint — check before insert
  const { data: existingScope } = await supabase
    .from('admin_scopes')
    .select('id')
    .eq('user_id', adminId)
    .eq('graduation_year_id', year.id)
    .maybeSingle()
  if (!existingScope) {
    const { error: scopeErr } = await supabase
      .from('admin_scopes')
      .insert({
        user_id: adminId,
        graduation_year_id: year.id,
        can_manage_students: true,
        can_manage_courses: true,
        can_manage_staff: true,
        can_moderate: true,
      })
    if (scopeErr) throw scopeErr
    console.log(`  ↳ admin scope granted for ${year.title}`)
  } else {
    console.log(`  ↳ admin scope already exists`)
  }

  // 5. Demo students (pre-seeded — they'll activate via invitation)
  console.log('\n👥 Pre-seeding students...')
  const studentRows = DEMO_STUDENTS.map((s) => ({
    graduation_year_id: year.id,
    course_id: courseMap.get(s.course)!,
    full_name: s.full_name,
    full_name_normalized: normalize(s.full_name),
    slug: slugify(s.full_name),
    wiut_email: s.email,
    approval_status: 'not_requested' as const,
  }))
  const { data: students, error: studentsErr } = await supabase
    .from('students')
    .upsert(studentRows, { onConflict: 'graduation_year_id,wiut_email' })
    .select()
  if (studentsErr) throw studentsErr
  console.log(`  ↳ ${students.length} students pre-seeded`)

  // 6. Superlative categories (no unique constraint — check before insert)
  console.log('\n🏆 Creating superlative categories...')
  const { data: existingCategories } = await supabase
    .from('superlative_categories')
    .select('title')
    .eq('graduation_year_id', year.id)
  const existingTitles = new Set((existingCategories ?? []).map((c) => c.title))

  const newCategories = SUPERLATIVES.filter((s) => !existingTitles.has(s.title)).map((s, i) => ({
    graduation_year_id: year.id,
    title: s.title,
    description: s.description,
    display_order: i,
    voting_status: 'open' as const,
  }))

  if (newCategories.length > 0) {
    const { error: superErr } = await supabase
      .from('superlative_categories')
      .insert(newCategories)
    if (superErr) throw superErr
  }
  console.log(`  ↳ ${newCategories.length} new, ${existingTitles.size} already existed`)

  // 7. Summary
  console.log('\n✅ Seed complete!\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  Super Admin Login:')
  console.log(`    Email:    ${SUPER_ADMIN.email}`)
  console.log(`    Password: ${SUPER_ADMIN.password}`)
  console.log('')
  console.log('  Year Admin Login:')
  console.log(`    Email:    ${DEMO_ADMIN.email}`)
  console.log(`    Password: ${DEMO_ADMIN.password}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n⚠️  Change these passwords immediately after first login.\n')
}

main().catch((err) => {
  console.error('\n❌ Seed failed:', err)
  process.exit(1)
})
