import type { WardRow } from '../../data/demoDashboard'

type Props = {
  rows: WardRow[]
}

export function WardComparisonTable({ rows }: Props) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <h2 className="text-lg font-extrabold">Ward comparison</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs font-bold uppercase tracking-wide text-muted">
              <th className="pb-3 pr-4">Ward</th>
              <th className="pb-3 pr-4">Open clusters</th>
              <th className="pb-3 pr-4">Overdue</th>
              <th className="pb-3">Alerts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-b border-line/60" key={row.wardId}>
                <td className="py-3 pr-4 font-bold">{row.wardName}</td>
                <td className="py-3 pr-4">{row.openClusters}</td>
                <td className="py-3 pr-4">{row.overdueCommitments}</td>
                <td className="py-3 text-muted">
                  {row.infraAlerts.length > 0 ? row.infraAlerts.join(', ') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
