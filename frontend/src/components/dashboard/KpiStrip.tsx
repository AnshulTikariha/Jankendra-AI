import type { DashboardKpis } from '../../data/demoDashboard'

type Props = {
  kpis: DashboardKpis
  showCitizenMetric?: boolean
}

export function KpiStrip({ kpis, showCitizenMetric }: Props) {
  const cards = [
    { label: 'Open complaints', value: kpis.openComplaints, sub: `+${kpis.openComplaintsTrend}% this week` },
    { label: 'Overdue commitments', value: kpis.overdueCommitments, sub: `${kpis.activeCommitments} active`, alert: kpis.overdueCommitments > 0 },
    { label: 'Resolved this week', value: kpis.resolvedThisWeek, sub: `${kpis.onTimeRatePct}% on time` },
    { label: 'Hot ward', value: kpis.hotWard.name, sub: 'Highest open weight' },
    ...(showCitizenMetric
      ? [{ label: 'Citizen complaints (7d)', value: kpis.citizenComplaintsWeek, sub: 'Self-reported issues' }]
      : []),
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          className={`rounded-2xl border bg-white p-4 shadow-sm ${
            card.alert ? 'border-red-200 bg-red-50/50' : 'border-line'
          }`}
          key={card.label}
        >
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">{card.label}</p>
          <p className="mt-2 text-2xl font-extrabold text-ink">{card.value}</p>
          <p className="mt-1 text-xs font-semibold text-muted">{card.sub}</p>
        </article>
      ))}
    </div>
  )
}
