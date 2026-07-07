import { useEffect, useMemo, useState } from 'react'
import { ApiError } from '../../api/errors'
import { PageError, PageHeader, PageLoading } from '../../components/staff/PageStates'
import { WardList, type WardListItem } from '../../components/dashboard/WardList'
import {
  GridPagination,
  PriorityFilterBar,
  PriorityLegend,
  getScoreTier,
  tierStyles,
  type ScoreTier,
} from '../../components/staff/PriorityGrid'
import { usePriorities } from '../../hooks/useStaffApi'
import { usePriorityInsights } from '../../hooks/useLeaderAi'

const PAGE_SIZE = 6

export function DevelopmentPlanPage() {
  const { data, isLoading, isError, error, refetch } = usePriorities()
  const { data: insights, isLoading: insightsLoading } = usePriorityInsights()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState<'all' | ScoreTier>('all')

  const insightMap = useMemo(() => {
    const map = new Map<string, { explanation: string; recommendedAction: string }>()
    for (const item of insights?.items ?? []) {
      map.set(item.id, { explanation: item.explanation, recommendedAction: item.recommended_action })
    }
    return map
  }, [insights?.items])

  const priorities = useMemo(() => data?.priorities ?? [], [data?.priorities])
  const maxScore = useMemo(
    () => Math.max(1, ...priorities.map((item) => item.score)),
    [priorities],
  )

  const filteredPriorities = useMemo(() => {
    const query = search.trim().toLowerCase()
    return priorities.filter((item) => {
      if (tierFilter !== 'all' && getScoreTier(item.score, maxScore) !== tierFilter) return false
      if (!query) return true
      const haystack = `${item.title} ${item.wardName} ${item.category} ${item.sourceType}`.toLowerCase()
      return haystack.includes(query)
    })
  }, [priorities, search, tierFilter, maxScore])

  const pageCount = Math.max(1, Math.ceil(filteredPriorities.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pagedPriorities = useMemo(
    () => filteredPriorities.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredPriorities, currentPage],
  )

  useEffect(() => {
    setPage(1)
  }, [search, tierFilter, priorities.length])

  const wardItems = useMemo<WardListItem[]>(() => {
    const rows = data?.wardComparison ?? []
    const maxWardScore = Math.max(1, ...rows.map((row) => row.totalScore))
    return rows.map((row) => ({
      id: String(row.wardId),
      name: row.wardName,
      subtitle: row.topAction ?? undefined,
      intensity: Math.round((row.totalScore / maxWardScore) * 100),
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

  const rangeStart = filteredPriorities.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filteredPriorities.length)

  return (
    <section className="space-y-6">
      <PageHeader
        description={`Ranked ward actions for ${data.constituencyName} with transparent scoring reasons.`}
        eyebrow="Development plan"
        title="Prioritised actions"
      />

      {(insightsLoading || insights?.overview) && (
        <div className="rounded-2xl border border-violet-200/70 bg-gradient-to-r from-violet-50 to-indigo-50 px-4 py-3 shadow-sm">
          <p className="flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-violet-700">
            <svg aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 3l1.9 4.8L18.7 9l-4.8 1.9L12 15.7 10.1 10.9 5.3 9l4.8-1.2z" strokeLinejoin="round" />
            </svg>
            AI overview
          </p>
          {insightsLoading ? (
            <div className="mt-2 space-y-1.5">
              <div className="h-3.5 w-full animate-pulse rounded bg-violet-100" />
              <div className="h-3.5 w-2/3 animate-pulse rounded bg-violet-100" />
            </div>
          ) : (
            <p className="mt-1 text-sm leading-6 text-ink">{insights?.overview}</p>
          )}
        </div>
      )}

      <PriorityFilterBar
        onSearch={setSearch}
        onTierFilter={setTierFilter}
        placeholder="Search title, ward, or category…"
        search={search}
        tierFilter={tierFilter}
      />

      <PriorityLegend
        noun="prioritised actions"
        onTierFilter={setTierFilter}
        rangeEnd={rangeEnd}
        rangeStart={rangeStart}
        tierFilter={tierFilter}
        total={filteredPriorities.length}
      />

      {pagedPriorities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line/80 bg-white/70 px-6 py-12 text-center text-sm font-semibold text-muted">
          {search.trim() || tierFilter !== 'all'
            ? 'No prioritised actions match your search or filter.'
            : 'No prioritised actions available yet.'}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pagedPriorities.map((item) => {
            const tier = getScoreTier(item.score, maxScore)
            const style = tierStyles[tier]
            const insight = insightMap.get(item.id)
            return (
              <article
                className={`flex flex-col overflow-hidden rounded-2xl border shadow-sm transition hover:shadow-md ${style.card}`}
                key={item.id}
              >
                <div className={`flex items-center justify-between border-b px-4 py-2.5 ${style.header}`}>
                  <span className={`rounded-full px-2.5 py-0.5 text-[0.7rem] font-extrabold ${style.badge}`}>
                    Rank #{item.rank}
                  </span>
                  <span className={`text-sm font-extrabold ${style.scoreText}`}>
                    {item.score.toFixed(1)}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h2 className="text-base font-extrabold leading-snug text-ink">{item.title}</h2>
                  <p className="mt-1 text-xs font-semibold text-muted">
                    {item.wardName} · {item.category} · {item.sourceType.replace('_', ' ')}
                  </p>
                  <ul className="mt-3 space-y-1.5">
                    {item.reasons.slice(0, 3).map((reason) => (
                      <li className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${style.chip}`} key={reason}>
                        {reason}
                      </li>
                    ))}
                  </ul>
                  {insight && (insight.explanation || insight.recommendedAction) && (
                    <div className="mt-3 rounded-xl border border-violet-200/70 bg-violet-50/60 p-3">
                      <p className="flex items-center gap-1 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-violet-700">
                        <svg aria-hidden="true" className="size-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M12 3l1.9 4.8L18.7 9l-4.8 1.9L12 15.7 10.1 10.9 5.3 9l4.8-1.2z" strokeLinejoin="round" />
                        </svg>
                        AI insight
                      </p>
                      {insight.explanation && (
                        <p className="mt-1.5 text-xs leading-5 text-ink">{insight.explanation}</p>
                      )}
                      {insight.recommendedAction && (
                        <p className="mt-2 text-xs leading-5 text-ink">
                          <span className="font-bold text-violet-700">Next: </span>
                          {insight.recommendedAction}
                        </p>
                      )}
                    </div>
                  )}
                  {!insight && insightsLoading && (
                    <div className="mt-3 space-y-1.5 rounded-xl border border-violet-100 bg-violet-50/40 p-3">
                      <div className="h-3 w-full animate-pulse rounded bg-violet-100" />
                      <div className="h-3 w-4/5 animate-pulse rounded bg-violet-100" />
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      <GridPagination currentPage={currentPage} onPage={setPage} pageCount={pageCount} />

      <WardList
        eyebrow="Ward comparison"
        intensityLabel="Score"
        items={wardItems}
        title="Ward priority ranking"
      />
    </section>
  )
}
