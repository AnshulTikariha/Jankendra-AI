import { ApiError } from '../../api/errors'
import { PageError, PageHeader, PageLoading } from '../../components/staff/PageStates'
import { usePriorities } from '../../hooks/useStaffApi'

export function DevelopmentPlanPage() {
  const { data, isLoading, isError, error, refetch } = usePriorities()

  if (isLoading) return <PageLoading message="Loading development priorities…" />

  if (isError || !data) {
    const message = error instanceof ApiError ? error.message : 'Something went wrong.'
    return <PageError message={message} onRetry={() => void refetch()} />
  }

  return (
    <section className="space-y-6">
      <PageHeader
        description={`Ranked ward actions for ${data.constituencyName} with transparent scoring reasons.`}
        eyebrow="Development plan"
        title="Prioritised actions"
      />

      <div className="space-y-4">
        {data.priorities.map((item) => (
          <article className="overflow-hidden rounded-2xl border border-line/80 bg-white shadow-md" key={item.id}>
            <div className="flex items-center justify-between border-b border-line/60 bg-violet-50/50 px-5 py-3">
              <span className="rounded-full bg-violet-600 px-3 py-1 text-xs font-extrabold text-white">
                Rank #{item.rank}
              </span>
              <span className="text-sm font-extrabold text-violet-700">Score {item.score.toFixed(1)}</span>
            </div>
            <div className="p-5">
              <h2 className="text-lg font-extrabold">{item.title}</h2>
              <p className="mt-1 text-sm text-muted">
                {item.wardName} · {item.category} · {item.sourceType.replace('_', ' ')}
              </p>
              <ul className="mt-4 space-y-2">
                {item.reasons.map((reason) => (
                  <li className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-ink" key={reason}>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>

      <div className="overflow-hidden rounded-3xl border border-line/80 bg-white shadow-md">
        <div className="border-b border-line/80 px-5 py-4">
          <h2 className="text-lg font-extrabold">Ward comparison</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3">Ward</th>
                <th className="px-5 py-3">Score</th>
                <th className="px-5 py-3">Clusters</th>
                <th className="px-5 py-3">Complaints</th>
                <th className="px-5 py-3">Overdue</th>
                <th className="px-5 py-3">Top action</th>
              </tr>
            </thead>
            <tbody>
              {data.wardComparison.map((row) => (
                <tr className="border-t border-line/60" key={row.wardId}>
                  <td className="px-5 py-3 font-bold">{row.wardName}</td>
                  <td className="px-5 py-3">{row.totalScore.toFixed(1)}</td>
                  <td className="px-5 py-3">{row.openClusters}</td>
                  <td className="px-5 py-3">{row.openComplaints}</td>
                  <td className="px-5 py-3">{row.overdueCommitments}</td>
                  <td className="px-5 py-3 text-muted">{row.topAction ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
