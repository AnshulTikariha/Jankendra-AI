import type { RecentActivity } from '../../types/dashboard'
import type { UserRole } from '../../types/auth'
import { getRoleTheme } from '../../theme/roleThemes'
import { parseComplaintSummary } from '../../lib/raiseComplaintFormat'
import {
  getComplaintSeverity,
  severityBadgeStyles,
  severityCardStyles,
  severityLabels,
} from '../../lib/complaintSeverity'

type Props = {
  items: RecentActivity[]
  role: UserRole
}

const typeConfig: Record<RecentActivity['type'], { label: string; color: string; dot: string }> = {
  citizen_complaint: { label: 'Citizen complaint', color: 'bg-cyan-100 text-cyan-800', dot: 'bg-cyan-500' },
  staff_complaint: { label: 'Staff logged', color: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
  meeting: { label: 'Meeting upload', color: 'bg-violet-100 text-violet-800', dot: 'bg-violet-500' },
  commitment: { label: 'Commitment', color: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
}

const isComplaint = (type: RecentActivity['type']) =>
  type === 'citizen_complaint' || type === 'staff_complaint'

export function RecentActivityList({ items, role }: Props) {
  const theme = getRoleTheme(role)

  return (
    <section className="flex flex-col self-start overflow-hidden rounded-3xl border border-line/80 bg-white shadow-md shadow-slate-200/50">
      <div className={`border-b border-line/80 bg-gradient-to-r ${theme.sectionHeaderBg} px-5 py-4 sm:px-6`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className={`text-xs font-bold uppercase tracking-[0.16em] ${theme.sectionEyebrow}`}>Activity feed</p>
            <h2 className="mt-1 text-xl font-extrabold">Recent activity</h2>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {items.length} events
          </span>
        </div>
      </div>

      <div className="max-h-[32rem] overflow-y-auto">
        {items.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm font-semibold text-muted">No recent activity yet.</p>
        ) : (
          <ul className="relative p-4 sm:p-5">
            <div aria-hidden="true" className={`absolute bottom-5 left-[1.65rem] top-5 w-0.5 bg-gradient-to-b ${theme.timelineGradient} sm:left-[1.9rem]`} />

            {items.map((item) => {
              const config = typeConfig[item.type]
              const severity = isComplaint(item.type) ? getComplaintSeverity(item.summary) : null
              const summaryText = isComplaint(item.type) ? parseComplaintSummary(item.summary) || item.summary : item.summary

              return (
                <li className="relative flex gap-4 pb-5 last:pb-0" key={item.id}>
                  <div className={`relative z-10 mt-1 size-3.5 shrink-0 rounded-full ring-4 ring-white ${severity ? '' : config.dot} ${
                    severity === 'critical' ? 'bg-rose-500'
                      : severity === 'high' ? 'bg-orange-400'
                      : severity === 'medium' ? 'bg-amber-400'
                      : severity === 'low' ? 'bg-emerald-400'
                      : ''
                  }`} />
                  <div className={`min-w-0 flex-1 rounded-2xl border border-line/70 p-4 transition hover:shadow-sm ${
                    severity ? severityCardStyles[severity] : 'bg-slate-50/50 hover:bg-white'
                  }`}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide ${config.color}`}>
                          {config.label}
                        </span>
                        {severity && (
                          <span className={`rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide ${severityBadgeStyles[severity]}`}>
                            {severityLabels[severity]}
                          </span>
                        )}
                      </div>
                      <time className="text-xs font-semibold text-muted">
                        {new Date(item.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </time>
                    </div>
                    <p className="mt-2 line-clamp-2 font-bold text-ink">{summaryText}</p>
                    <p className="mt-1 text-xs font-semibold text-muted">{item.wardName}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
