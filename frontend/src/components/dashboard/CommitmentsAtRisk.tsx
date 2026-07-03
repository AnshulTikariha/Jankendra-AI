import type { CommitmentAtRisk } from '../../data/demoDashboard'

type Props = {
  items: CommitmentAtRisk[]
}

export function CommitmentsAtRisk({ items }: Props) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <h2 className="text-lg font-extrabold">Commitments at risk</h2>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li className="rounded-xl border border-red-100 bg-red-50/40 p-4" key={item.id}>
            <p className="text-xs font-bold text-red-700">{item.weightTier} · {item.daysOverdue}d overdue</p>
            <p className="mt-1 font-bold">{item.title}</p>
            <p className="mt-1 text-xs text-muted">{item.wardName} · due {item.deadline}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
