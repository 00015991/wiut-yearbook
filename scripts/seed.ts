/**
 * WIUT Graduation Yearbook — Database Seed Script
 *
 * Seeds demo data: super admin, graduation year, courses, sample students.
 *
 * Usage:
 *   npx tsx scripts/seed.ts
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
  password: 'ChangeMe2026!',
  full_name: 'Platform Super Admin',
}

const DEMO_ADMIN = {
  email: 'admin2026@wiut.uz',
  password: 'ChangeMe2026!',
  full_name: 'Class of 2026 Admin',
}

const YEAR = {
  slug: '2026',
  name: 'Class of 2026',
  graduation_date: '2026-06-15',
  status: 'active' as const,
  profile_deadline: '2026-05-01T00:00:00Z',
  voting_status: 'open' as const,
}

const COURSES = [
  { slug: 'business', name: 'Business Administration', faculty: 'Business' },
  { slug: 'economics', name: 'Economics and Finance', faculty: 'Business' },
  { slug: 'computing', name: 'Computer Science', faculty: 'Science' },
  { slug: 'commercial-law', name: 'Commercial Law', faculty: 'Law' },
  { slug: 'international-business', name: 'International Business', faculty: 'Business' },
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

async function createAuthUser(email: string, password: string, fullName: string) {
  // Check if user already exists
  const { data: existing } = await supabase.auth.admin.listUsers()
  const found = existing?.users.find(u => u.email === email)
  if (found) {
    console.log(`  ↳ auth user already exists: ${email}`)
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

async function upsertAppUser(id: string, email: string, role: 'super_admin' | 'admin' | 'student', fullName: string) {
  const { error } = await supabase
    .from('app_users')
    .upsert({ id, email, role, full_name: fullName, status: 'active' }, { onConflict: 'id' })
  if (error) throw error
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

async function main() {
  console.log('🌱 WIUT Yearbook — Seeding database\n')

  // 1. Super admin
  console.log('👑 Creating super admin...')
  const superAdminId = await createAuthUser(SUPER_ADMIN.email, SUPER_ADMIN.password, SUPER_ADMIN.full_name)
  await upsertAppUser(superAdminId, SUPER_ADMIN.email, 'super_admin', SUPER_ADMIN.full_name)

  // 2. Graduation year
  console.log('\n🎓 Creating graduation year...')
  const { data: year, error: yearErr } = await supabase
    .from('graduation_years')
    .upsert({ ...YEAR, created_by: superAdminId }, { onConflict: 'slug' })
    .select()
    .single()
  if (yearErr) throw yearErr
  console.log(`  ↳ ${year.name} (${year.slug})`)

  // 3. Courses
  console.log('\n📚 Creating courses...')
  const courseRows = COURSES.map(c => ({ ...c, year_id: year.id }))
  const { data: courses, error: coursesErr } = await supabase
    .from('courses')
    .upsert(courseRows, { onConflict: 'year_id,slug' })
    .select()
  if (coursesErr) throw coursesErr
  console.log(`  ↳ ${courses.length} courses created`)
  const courseMap = new Map(courses.map(c => [c.slug, c.id]))

  // 4. Demo admin
  console.log('\n🛡  Creating demo admin...')
  const adminId = await createAuthUser(DEMO_ADMIN.email, DEMO_ADMIN.password, DEMO_ADMIN.full_name)
  await upsertAppUser(adminId, DEMO_ADMIN.email, 'admin', DEMO_ADMIN.full_name)

  await supabase
    .from('admin_scopes')
    .upsert({ user_id: adminId, year_id: year.id, granted_by: superAdminId }, { onConflict: 'user_id,year_id' })

  // 5. Pre-seeded students (no auth yet — they activate via invitation)
  console.log('\n👥 Pre-seeding students...')
  const studentRows = DEMO_STUDENTS.map(s => ({
    year_id: year.id,
    course_id: courseMap.get(s.course)!,
    full_name: s.full_name,
    email: s.email,
    profile_status: 'draft' as const,
  }))
  const { data: students, error: studentsErr } = await supabase
    .from('students')
    .upsert(studentRows, { onConflict: 'year_id,email' })
    .select()
  if (studentsErr) throw studentsErr
  console.log(`  ↳ ${students.length} students pre-seeded`)

  // 6. Superlative categories
  console.log('\n🏆 Creating superlative categories...')
  const superlativeRows = SUPERLATIVES.map(s => ({
    year_id: year.id,
    title: s.title,
    description: s.description,
    status: 'open' as const,
    created_by: superAdminId,
  }))
  const { error: superErr } = await supabase
    .from('superlative_categories')
    .upsert(superlativeRows, { onConflict: 'year_id,title' })
  if (superErr) throw superErr
  console.log(`  ↳ ${SUPERLATIVES.length} categories created`)

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

main().catch(err => {
  console.error('\n❌ Seed failed:', err)
  process.exit(1)
})
