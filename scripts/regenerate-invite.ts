/**
 * Regenerate an activation link for a student.
 *
 * We only store the hash of the invitation token, so the plaintext link is
 * irrecoverable once an admin loses it. This script mints a brand-new token
 * for a given email and prints the activation URL. The old invitation row
 * stays in the table until it expires naturally (7 days) — it's harmless
 * because the new token hashes to a different value.
 *
 * Usage:
 *   npx tsx scripts/regenerate-invite.ts <student-email>
 *   npx tsx scripts/regenerate-invite.ts bbekmurodov@students.wiut.uz
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'node:path'
import { createHash, randomBytes } from 'node:crypto'

config({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing env: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required')
  process.exit(1)
}

const email = process.argv[2]
if (!email) {
  console.error('❌ Usage: npx tsx scripts/regenerate-invite.ts <student-email>')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  const { data: student, error } = await supabase
    .from('students')
    .select('id, full_name, wiut_email, approval_status')
    .eq('wiut_email', email)
    .maybeSingle()

  if (error) throw error
  if (!student) {
    console.error(`❌ No student found with email ${email}`)
    process.exit(1)
  }

  if (student.approval_status === 'active') {
    console.error(`❌ ${student.full_name} has already activated their account.`)
    process.exit(1)
  }

  const token = randomBytes(32).toString('hex')
  const hash = createHash('sha256').update(token).digest('hex')

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const { error: invErr } = await supabase.from('invitations').insert({
    student_id: student.id,
    token_hash: hash,
    expires_at: expiresAt.toISOString(),
  })
  if (invErr) throw invErr

  // Make sure the student is flagged invited even if the original click
  // raced and the row was never updated.
  if (student.approval_status !== 'invited') {
    await supabase
      .from('students')
      .update({ approval_status: 'invited', invited_at: new Date().toISOString() })
      .eq('id', student.id)
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`  Fresh activation link for ${student.full_name}`)
  console.log(`  ${student.wiut_email}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`\n${APP_URL}/activate?token=${token}\n`)
  console.log(`  Expires: ${expiresAt.toLocaleString()}`)
  console.log('  Single-use. Send it to the student; they set their password and are in.\n')
}

main().catch((err) => {
  console.error('\n❌ Failed:', err)
  process.exit(1)
})
