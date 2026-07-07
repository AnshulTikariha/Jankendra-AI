import type { DashboardKpis } from '../../types/dashboard'

type Props = {
  kpis: DashboardKpis
  showCitizenMetric?: boolean
}

type KpiCard = {
  id: string
  label: string
  value: string | number
  sub: string
  gradient: string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
}

export function KpiStrip({ kpis, showCitizenMetric }: Props) {
  const cards: KpiCard[] = [
    {
      id: 'complaints',
      label: 'Open complaints',
      value: kpis.openComplaints,
      sub: `${kpis.openComplaintsTrend >= 0 ? '+' : ''}${kpis.openComplaintsTrend}% vs last week`,
      gradient: 'from-blue-500 to-indigo-600',
      trend: kpis.openComplaintsTrend > 0 ? 'up' : kpis.openComplaintsTrend < 0 ? 'down' : 'neutral',
      icon: <ComplaintIcon />,
    },
    {
      id: 'overdue',
      label: 'Overdue commitments',
      value: kpis.overdueCommitments,
      sub: `${kpis.activeCommitments} active total`,
      gradient: 'from-rose-500 to-orange-500',
      trend: kpis.overdueCommitments > 0 ? 'up' : 'neutral',
      icon: <AlertIcon />,
    },
    {
      id: 'resolved',
      label: 'Resolved this week',
      value: kpis.resolvedThisWeek,
      sub: `${kpis.onTimeRatePct}% on-time rate`,
      gradient: 'from-emerald-500 to-teal-600',
      icon: <CheckIcon />,
    },
    {
      id: 'hot-ward',
      label: 'Hot ward',
      value: kpis.hotWard.name,
      sub: 'Highest open weight',
      gradient: 'from-violet-500 to-purple-600',
      icon: <MapIcon />,
    },
  ]

  if (showCitizenMetric) {
    cards.push({
      id: 'citizen',
      label: 'Citizen reports (7d)',
      value: kpis.citizenComplaintsWeek,
      sub: 'Self-reported issues',
      gradient: 'from-cyan-500 to-blue-500',
      icon: <PeopleIcon />,
    })
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
      {cards.map((card) => (
        <article
          className="group relative overflow-hidden rounded-2xl border border-white/60 bg-white p-4 shadow-md shadow-slate-200/60 transition hover:-translate-y-0.5 hover:shadow-lg"
          key={card.id}
        >
          <div className={`absolute -right-4 -top-4 size-20 rounded-full bg-gradient-to-br ${card.gradient} opacity-15 blur-xl transition group-hover:opacity-25`} />
          <div className="relative flex items-start justify-between gap-3">
            <div className={`grid size-11 place-items-center rounded-2xl bg-gradient-to-br ${card.gradient} text-white shadow-lg`}>
              {card.icon}
            </div>
            {card.trend && (
              <span
                className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold ${
                  card.trend === 'up'
                    ? 'bg-rose-100 text-rose-700'
                    : card.trend === 'down'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-600'
                }`}
              >
                {card.trend === 'up' ? '↑' : card.trend === 'down' ? '↓' : '•'}
              </span>
            )}
          </div>
          <p className="relative mt-4 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-muted">{card.label}</p>
          <p className="relative mt-1 text-2xl font-extrabold tracking-tight text-ink">{card.value}</p>
          <p className="relative mt-1 text-xs font-semibold text-muted">{card.sub}</p>
        </article>
      ))}
    </div>
  )
}

function ComplaintIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 9v4m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 5c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4m0 4h.01" strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MapIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M9 18l-6-3V6l6 3 6-3 6 3v9l-6-3-6 3z" strokeLinejoin="round" />
      <path d="M9 5v12M15 2v12" />
    </svg>
  )
}

function PeopleIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="10" r="2.5" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M14 20c0-2.2 1.8-4 4-4" strokeLinecap="round" />
    </svg>
  )
}
