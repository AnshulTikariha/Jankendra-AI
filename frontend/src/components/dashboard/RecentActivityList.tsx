import type { RecentActivity } from '../../data/demoDashboard'

type Props = {
  items: RecentActivity[]
}

const typeConfig: Record<RecentActivity['type'], { label: string; color: string; dot: string }> = {
  citizen_complaint: { label: 'Citizen complaint', color: 'bg-cyan-100 text-cyan-800', dot: 'bg-cyan-500' },
  staff_complaint: { label: 'Staff logged', color: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
  meeting: { label: 'Meeting upload', color: 'bg-violet-100 text-violet-800', dot: 'bg-violet-500' },
  commitment: { label: 'Commitment', color: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
}

export function RecentActivityList({ items }: Props) {
  return (
    <section className="overflow-hidden rounded-3xl border border-line/80 bg-white shadow-md shadow-slate-200/50">
      <div className="border-b border-line/80 bg-gradient-to-r from-slate-50 to-white px-5 py-4 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Activity feed</p>
        <h2 className="mt-1 text-xl font-extrabold">Recent activity</h2>
      </div>

      <ul className="relative p-4 sm:p-5">
        <div aria-hidden="true" className="absolute bottom-5 left-[1.65rem] top-5 w-0.5 bg-gradient-to-b from-primary/30 via-accent/30 to-transparent sm:left-[1.9rem]" />

        {items.map((item) => {
          const config = typeConfig[item.type]
          return (
            <li className="relative flex gap-4 pb-5 last:pb-0" key={item.id}>
              <div className={`relative z-10 mt-1 size-3.5 shrink-0 rounded-full ring-4 ring-white ${config.dot}`} />
              <div className="min-w-0 flex-1 rounded-2xl border border-line/70 bg-slate-50/50 p-4 transition hover:bg-white hover:shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide ${config.color}`}>
                    {config.label}
                  </span>
                  <time className="text-xs font-semibold text-muted">
                    {new Date(item.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </time>
                </div>
                <p className="mt-2 font-bold text-ink">{item.summary}</p>
                <p className="mt-1 text-xs font-semibold text-muted">{item.wardName}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
