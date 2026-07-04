import type { CitizenStats } from '../../hooks/useCitizenDashboard'

type Props = {
  stats: CitizenStats
  isLoading?: boolean
}

export function CitizenKpiStrip({ stats, isLoading }: Props) {
  const cards = [
    {
      id: 'open',
      label: 'Open complaints',
      value: stats.open,
      sub: stats.open === 0 ? 'Nothing pending' : 'Awaiting resolution',
      gradient: 'from-blue-500 to-indigo-600',
      icon: <OpenIcon />,
    },
    {
      id: 'progress',
      label: 'In progress',
      value: stats.inProgress,
      sub: 'Under review or active',
      gradient: 'from-amber-500 to-orange-500',
      icon: <ProgressIcon />,
    },
    {
      id: 'resolved',
      label: 'Resolved',
      value: stats.resolved,
      sub: 'Successfully closed',
      gradient: 'from-emerald-500 to-teal-600',
      icon: <ResolvedIcon />,
    },
    {
      id: 'community',
      label: 'Community signal',
      value: stats.maxClusterCount > 1 ? stats.maxClusterCount : '—',
      sub:
        stats.maxClusterCount > 1
          ? 'Similar reports in your ward'
          : 'Across your submissions',
      gradient: 'from-violet-500 to-purple-600',
      icon: <PeopleIcon />,
    },
  ]

  return (
    <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-4 ${isLoading ? 'animate-pulse opacity-70' : ''}`}>
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
          </div>
          <p className="relative mt-4 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-muted">{card.label}</p>
          <p className="relative mt-1 text-2xl font-extrabold tracking-tight text-ink">{card.value}</p>
          <p className="relative mt-1 text-xs font-semibold text-muted">{card.sub}</p>
        </article>
      ))}
    </div>
  )
}

function OpenIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 9v4m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 5c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ProgressIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ResolvedIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
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
