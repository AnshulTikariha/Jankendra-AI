import { useMemo } from 'react'
import { ApiError } from '../../api/errors'
import { PageError, PageHeader, PageLoading } from '../../components/staff/PageStates'
import { WardList, type WardListItem } from '../../components/dashboard/WardList'
import { usePriorities } from '../../hooks/useStaffApi'

export function DevelopmentPlanPage() {
  const { data, isLoading, isError, error, refetch } = usePriorities()

  const wardItems = useMemo<WardListItem[]>(() => {
    const rows = data?.wardComparison ?? []
    const maxScore = Math.max(1, ...rows.map((row) => row.totalScore))
    return rows.map((row) => ({
      id: String(row.wardId),
      name: row.wardName,
      subtitle: row.topAction ?? undefined,
      intensity: Math.round((row.totalScore / maxScore) * 100),
      metrics: [
        { key: 'totalScore', label: 'Score', value: Math.round(row.totalScore * 10) / 10 },
        { key: 'openClusters', label: 'Clusters', value: row.openClusters },
        { key: 'openComplaints', label: 'Complaints', value: row.openComplaints },
        { key: 'overdueCommitments', label: 'Overdue', value: row.overdueCommitments, alert: true },
      ],
    }))
  }, [data?.wardComparison])

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

      <WardList
        eyebrow="Ward comparison"
        intensityLabel="Score"
        items={wardItems}
        title="Ward priority ranking"
      />
    </section>
  )
}
