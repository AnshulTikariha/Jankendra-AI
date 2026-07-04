import type { WardRow } from '../../types/dashboard'
import { getRoleTheme } from '../../theme/roleThemes'

type Props = {
  rows: WardRow[]
}

const alertColors: Record<string, string> = {
  Drainage: 'bg-cyan-100 text-cyan-800',
  Water: 'bg-blue-100 text-blue-800',
  Roads: 'bg-amber-100 text-amber-800',
  Electricity: 'bg-violet-100 text-violet-800',
}

export function WardComparisonTable({ rows }: Props) {
  const maxClusters = Math.max(...rows.map((r) => r.openClusters))
  const theme = getRoleTheme('leader')

  return (
    <section className="overflow-hidden rounded-3xl border border-line/80 bg-white shadow-md shadow-slate-200/50">
      <div className={`border-b border-line/80 bg-gradient-to-r ${theme.sectionHeaderBg} px-5 py-4 sm:px-6`}>
        <p className={`text-xs font-bold uppercase tracking-[0.16em] ${theme.sectionEyebrow}`}>Constituency map</p>
        <h2 className="mt-1 text-xl font-extrabold">Ward comparison</h2>
      </div>

      <div className="space-y-3 p-4 sm:p-5">
        {rows.map((row, index) => {
          const clusterPct = Math.round((row.openClusters / maxClusters) * 100)
          const isHot = index === 0

          return (
            <article
              className={`rounded-2xl border p-4 transition ${
                isHot ? `border-violet-200 bg-gradient-to-r ${theme.sectionHeaderBg} shadow-sm` : 'border-line/80 bg-slate-50/40'
              }`}
              key={row.wardId}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`grid size-10 place-items-center rounded-xl text-sm font-extrabold text-white shadow-md ${
                    isHot ? `bg-gradient-to-br ${theme.sidebarRoleAvatar}` : 'bg-gradient-to-br from-slate-600 to-slate-800'
                  }`}>
                    {row.wardId}
                  </div>
                  <div>
                    <p className="font-extrabold text-ink">{row.wardName}</p>
                    {isHot && (
                      <span className={`text-[0.65rem] font-bold uppercase tracking-wide ${theme.sectionEyebrow}`}>Highest pressure</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-4 text-center">
                  <Metric label="Clusters" value={row.openClusters} />
                  <Metric label="Overdue" value={row.overdueCommitments} alert={row.overdueCommitments > 0} />
                </div>
              </div>

              <div className="mt-3">
                <div className="mb-1 flex justify-between text-[0.65rem] font-bold uppercase tracking-wide text-muted">
                  <span>Open cluster intensity</span>
                  <span>{clusterPct}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full ${isHot ? `bg-gradient-to-r ${theme.primaryBtn}` : 'bg-gradient-to-r from-slate-400 to-slate-600'}`}
                    style={{ width: `${clusterPct}%` }}
                  />
                </div>
              </div>

              {row.infraAlerts.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {row.infraAlerts.map((alert) => (
                    <span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-bold ${alertColors[alert] ?? 'bg-slate-100 text-slate-700'}`} key={alert}>
                      {alert}
                    </span>
                  ))}
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

function Metric({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <div>
      <p className="text-[0.65rem] font-bold uppercase tracking-wide text-muted">{label}</p>
      <p className={`text-lg font-extrabold ${alert ? 'text-rose-600' : 'text-ink'}`}>{value}</p>
    </div>
  )
}
