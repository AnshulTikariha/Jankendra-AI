import type { PriorityItem } from '../../data/demoDashboard'

type Props = {
  items: PriorityItem[]
  title: string
  actionable?: boolean
}

export function PriorityList({ items, title, actionable }: Props) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <h2 className="text-lg font-extrabold">{title}</h2>
      <ul className="mt-4 space-y-3">
        {items.map((item, index) => (
          <li className="rounded-xl border border-line p-4" key={item.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-muted">#{index + 1} · {item.wardName}</p>
                <p className="mt-1 font-bold">{item.title}</p>
                {item.source && (
                  <span className="mt-2 inline-block rounded-full bg-soft-blue px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-primary">
                    {item.source === 'citizen' ? 'Citizen reported' : 'Staff logged'}
                  </span>
                )}
              </div>
              <span className="shrink-0 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-extrabold text-white">
                W{item.weight}
              </span>
            </div>
            {actionable && (
              <div className="mt-3 flex gap-2">
                <button className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white" type="button">Complete</button>
                <button className="rounded-full border border-line px-3 py-1.5 text-xs font-bold text-muted" type="button">Extend</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
