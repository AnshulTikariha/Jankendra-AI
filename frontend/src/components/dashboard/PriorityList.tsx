import type { PriorityItem } from '../../data/demoDashboard'

type Props = {
  items: PriorityItem[]
  title: string
  actionable?: boolean
}

const typeStyles = {
  complaint: { label: 'Complaint', bg: 'bg-blue-100 text-blue-700', bar: 'bg-blue-500' },
  commitment: { label: 'Commitment', bg: 'bg-violet-100 text-violet-700', bar: 'bg-violet-500' },
  development: { label: 'Development', bg: 'bg-amber-100 text-amber-800', bar: 'bg-amber-500' },
} as const

export function PriorityList({ items, title, actionable }: Props) {
  const maxWeight = Math.max(...items.map((i) => i.weight))

  return (
    <section className="overflow-hidden rounded-3xl border border-line/80 bg-white shadow-md shadow-slate-200/50">
      <div className="border-b border-line/80 bg-gradient-to-r from-slate-50 to-white px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Priority queue</p>
            <h2 className="mt-1 text-xl font-extrabold text-ink">{title}</h2>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            {items.length} items
          </span>
        </div>
      </div>

      <ul className="divide-y divide-line/60 p-3 sm:p-4">
        {items.map((item, index) => {
          const style = typeStyles[item.type]
          const weightPct = Math.round((item.weight / maxWeight) * 100)

          return (
            <li className="rounded-2xl p-3 transition hover:bg-slate-50/80 sm:p-4" key={item.id}>
              <div className="flex items-start gap-4">
                <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 text-sm font-extrabold text-white shadow-md">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide ${style.bg}`}>
                      {style.label}
                    </span>
                    <span className="text-xs font-semibold text-muted">{item.wardName}</span>
                    {item.source && (
                      <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[0.65rem] font-bold text-cyan-700">
                        {item.source === 'citizen' ? 'Citizen' : 'Staff'}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 font-bold leading-snug text-ink">{item.title}</p>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${weightPct}%` }} />
                    </div>
                    <span className="shrink-0 rounded-xl bg-slate-900 px-2.5 py-1 text-xs font-extrabold text-white">
                      W{item.weight}
                    </span>
                  </div>

                  {actionable && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button className="rounded-full bg-gradient-to-r from-primary to-primary-light px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-primary/20" type="button">
                        Complete
                      </button>
                      <button className="rounded-full border border-line bg-white px-4 py-1.5 text-xs font-bold text-muted transition hover:border-primary-light hover:text-primary" type="button">
                        Extend
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
