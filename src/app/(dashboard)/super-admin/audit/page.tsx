import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { PageShell, PageContainer, SectionHeading } from '@/components/shared/page-shell'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/utils'

async function getAuditLogs(page: number = 1, limit: number = 50) {
  const supabase = await createClient()
  const offset = (page - 1) * limit

  const { data, error, count } = await supabase
    .from('audit_logs')
    .select(`
      *,
      actor:app_users!audit_logs_actor_id_fkey(email, role),
      year:graduation_years(name, slug)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return { logs: data ?? [], total: count ?? 0 }
}

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-emerald-100 text-emerald-800',
  update: 'bg-blue-100 text-blue-800',
  delete: 'bg-red-100 text-red-800',
  approve: 'bg-green-100 text-green-800',
  reject: 'bg-orange-100 text-orange-800',
  lock: 'bg-purple-100 text-purple-800',
  unlock: 'bg-yellow-100 text-yellow-800',
  suspend: 'bg-red-100 text-red-800',
  invite: 'bg-sky-100 text-sky-800',
  login: 'bg-gray-100 text-gray-800',
}

function getActionColor(action: string) {
  const base = action.toLowerCase().split('_')[0]
  return ACTION_COLORS[base] ?? 'bg-gray-100 text-gray-700'
}

function formatAction(action: string) {
  return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default async function SuperAdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; actor?: string; action?: string; entity?: string }>
}) {
  await requireRole('super_admin')

  const params = await searchParams
  const page = Number(params.page ?? 1)
  const { logs, total } = await getAuditLogs(page)
  const totalPages = Math.ceil(total / 50)

  return (
    <PageShell>
      <PageContainer>
        <SectionHeading
          title="Audit Log"
          subtitle="Complete history of all administrative actions across the platform."
        />

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-warm-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-night">{total.toLocaleString()}</p>
            <p className="text-sm text-warm-gray-500 mt-1">Total Events</p>
          </div>
          <div className="bg-white rounded-xl border border-warm-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-night">{page}</p>
            <p className="text-sm text-warm-gray-500 mt-1">Current Page</p>
          </div>
          <div className="bg-white rounded-xl border border-warm-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-night">{totalPages}</p>
            <p className="text-sm text-warm-gray-500 mt-1">Total Pages</p>
          </div>
        </div>

        {/* Log table */}
        <div className="bg-white rounded-xl border border-warm-gray-200 overflow-hidden">
          {logs.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-warm-gray-400 text-sm">No audit events recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-warm-gray-100 bg-warm-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-warm-gray-600">Time</th>
                    <th className="text-left px-4 py-3 font-medium text-warm-gray-600">Actor</th>
                    <th className="text-left px-4 py-3 font-medium text-warm-gray-600">Action</th>
                    <th className="text-left px-4 py-3 font-medium text-warm-gray-600">Entity</th>
                    <th className="text-left px-4 py-3 font-medium text-warm-gray-600">Year</th>
                    <th className="text-left px-4 py-3 font-medium text-warm-gray-600">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-gray-100">
                  {logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-warm-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-warm-gray-500 whitespace-nowrap">
                        {formatRelativeTime(log.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-night truncate max-w-[180px]">
                            {log.actor?.email ?? 'System'}
                          </p>
                          {log.actor?.role && (
                            <p className="text-xs text-warm-gray-400 capitalize">{log.actor.role.replace('_', ' ')}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                          {formatAction(log.action)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-warm-gray-600">
                        <span className="capitalize">{log.entity_type?.replace(/_/g, ' ') ?? '—'}</span>
                        {log.entity_id && (
                          <span className="ml-1 text-warm-gray-400 font-mono text-xs">
                            #{String(log.entity_id).slice(0, 8)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-warm-gray-500 text-xs">
                        {log.year?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 max-w-[220px]">
                        {log.metadata && Object.keys(log.metadata).length > 0 ? (
                          <details className="cursor-pointer">
                            <summary className="text-xs text-burgundy hover:underline">
                              View details
                            </summary>
                            <pre className="mt-1 text-xs bg-warm-gray-50 rounded p-2 overflow-x-auto max-h-32 text-warm-gray-600">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          <span className="text-warm-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-warm-gray-500">
              Showing {((page - 1) * 50) + 1}–{Math.min(page * 50, total)} of {total.toLocaleString()} events
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <a
                  href={`?page=${page - 1}`}
                  className="px-3 py-1.5 text-sm border border-warm-gray-200 rounded-lg hover:bg-warm-gray-50 text-night transition-colors"
                >
                  ← Previous
                </a>
              )}
              {page < totalPages && (
                <a
                  href={`?page=${page + 1}`}
                  className="px-3 py-1.5 text-sm border border-warm-gray-200 rounded-lg hover:bg-warm-gray-50 text-night transition-colors"
                >
                  Next →
                </a>
              )}
            </div>
          </div>
        )}
      </PageContainer>
    </PageShell>
  )
}
