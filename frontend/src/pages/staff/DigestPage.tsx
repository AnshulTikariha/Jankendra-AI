import { ApiError } from '../../api/errors'
import { PageError, PageHeader, PageLoading } from '../../components/staff/PageStates'
import { useDigest } from '../../hooks/useStaffApi'

export function DigestPage() {
  const { data, isLoading, isError, error, refetch } = useDigest()

  if (isLoading) return <PageLoading message="Loading weekly digest…" />

  if (isError || !data) {
    const message = error instanceof ApiError ? error.message : 'Something went wrong.'
    return <PageError message={message} onRetry={() => void refetch()} />
  }

  const cards = [
    { label: 'Complaints opened', value: data.totals.complaintsOpened },
    { label: 'Active commitments', value: data.totals.activeCommitments },
    { label: 'Overdue commitments', value: data.totals.overdueCommitments },
    { label: 'Completed', value: data.totals.completedCommitments },
    { label: 'Open clusters', value: data.totals.openClusters },
    { label: 'Critical infra alerts', value: data.totals.criticalInfraAlerts },
  ]

  return (
    <section className="space-y-6">
      <PageHeader
        description={`${data.periodStart} → ${data.periodEnd} · ${data.constituencyName}`}
        eyebrow="Weekly digest"
        title="Governance numbers"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <article className="rounded-2xl border border-line/80 bg-white p-5 shadow-sm" key={card.label}>
            <p className="text-xs font-bold uppercase tracking-wide text-muted">{card.label}</p>
            <p className="mt-2 text-3xl font-extrabold text-ink">{card.value}</p>
          </article>
        ))}
      </div>

      <div className="overflow-hidden rounded-3xl border border-line/80 bg-white shadow-md">
        <div className="border-b border-line/80 px-5 py-4">
          <h2 className="text-lg font-extrabold">Ward breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3">Ward</th>
                <th className="px-5 py-3">Complaints</th>
                <th className="px-5 py-3">Active</th>
                <th className="px-5 py-3">Overdue</th>
                <th className="px-5 py-3">Clusters</th>
                <th className="px-5 py-3">Infra alerts</th>
              </tr>
            </thead>
            <tbody>
              {data.wards.map((row) => (
                <tr className="border-t border-line/60" key={row.wardId}>
                  <td className="px-5 py-3 font-bold">{row.wardName}</td>
                  <td className="px-5 py-3">{row.complaintsOpened}</td>
                  <td className="px-5 py-3">{row.activeCommitments}</td>
                  <td className="px-5 py-3">{row.overdueCommitments}</td>
                  <td className="px-5 py-3">{row.openClusters}</td>
                  <td className="px-5 py-3">{row.criticalInfraAlerts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
