import type { RecentActivity } from '../../data/demoDashboard'

type Props = {
  items: RecentActivity[]
}

const typeLabels: Record<RecentActivity['type'], string> = {
  citizen_complaint: 'Citizen complaint',
  staff_complaint: 'Staff logged',
  meeting: 'Meeting upload',
  commitment: 'Commitment',
}

export function RecentActivityList({ items }: Props) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <h2 className="text-lg font-extrabold">Recent activity</h2>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li className="flex items-start justify-between gap-3 rounded-xl border border-line p-4" key={item.id}>
            <div>
              <p className="text-xs font-bold text-primary">{typeLabels[item.type]}</p>
              <p className="mt-1 font-semibold">{item.summary}</p>
              <p className="mt-1 text-xs text-muted">{item.wardName}</p>
            </div>
            <time className="shrink-0 text-xs text-muted">
              {new Date(item.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </time>
          </li>
        ))}
      </ul>
    </section>
  )
}
