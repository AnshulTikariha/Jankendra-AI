import { useEffect, useMemo, useState } from 'react'
import { ApiError } from '../../api/errors'
import { PageError, PageHeader, PageLoading } from '../../components/staff/PageStates'
import {
  GridPagination,
  PriorityFilterBar,
  PriorityLegend,
  getScoreTier,
  tierStyles,
  type ScoreTier,
} from '../../components/staff/PriorityGrid'
import { useTodoAction, useTodoList } from '../../hooks/useStaffApi'
import type { Commitment } from '../../types/staff'

const PAGE_SIZE = 6

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function TodoItem({ item, maxWeight, onComplete, onExtend, busy }: {
  item: Commitment
  maxWeight: number
  onComplete: (id: string) => void
  onExtend: (id: string, deadline: string) => void
  busy: boolean
}) {
  const [extending, setExtending] = useState(false)
  const [newDeadline, setNewDeadline] = useState(item.deadline)
  const tier = getScoreTier(item.weight, maxWeight)
  const style = tierStyles[tier]

  return (
    <article className={`flex flex-col overflow-hidden rounded-2xl border shadow-sm transition hover:shadow-md ${style.card}`}>
      <div className={`border-b px-4 py-2.5 ${style.header}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-[0.7rem] font-extrabold ${style.badge}`}>
            {item.weightTier} · weight {item.weight}
          </span>
          {item.daysOverdue > 0 && (
            <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-[0.7rem] font-extrabold text-white">
              {item.daysOverdue}d overdue
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h2 className="text-base font-extrabold leading-snug text-ink">{item.title}</h2>
        <p className="mt-1 text-xs font-semibold text-muted">
          {item.wardName ?? 'Constituency-wide'} · Due {formatDate(item.deadline)}
          {item.assignee ? ` · ${item.assignee}` : ''}
        </p>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-ink">{item.description}</p>

        {extending ? (
          <div className="mt-auto flex flex-wrap items-end gap-2 pt-4">
            <label className="block">
              <span className="text-xs font-bold text-muted">New deadline</span>
              <input
                className="mt-1 rounded-xl border border-line px-3 py-2 text-sm font-semibold"
                onChange={(e) => setNewDeadline(e.target.value)}
                type="date"
                value={newDeadline}
              />
            </label>
            <button
              className="rounded-full bg-primary px-4 py-2 text-xs font-extrabold text-white disabled:opacity-50"
              disabled={busy}
              onClick={() => {
                onExtend(item.id, newDeadline)
                setExtending(false)
              }}
              type="button"
            >
              Save
            </button>
            <button
              className="rounded-full border border-line px-4 py-2 text-xs font-bold text-muted"
              onClick={() => setExtending(false)}
              type="button"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="mt-auto flex flex-wrap gap-2 pt-4">
            <button
              className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-extrabold text-white disabled:opacity-50"
              disabled={busy}
              onClick={() => onComplete(item.id)}
              type="button"
            >
              Mark complete
            </button>
            <button
              className="rounded-full border border-line bg-white px-4 py-2 text-xs font-extrabold text-primary disabled:opacity-50"
              disabled={busy}
              onClick={() => setExtending(true)}
              type="button"
            >
              Extend
            </button>
          </div>
        )}
      </div>
    </article>
  )
}

export function TodoPage() {
  const { data, isLoading, isError, error, refetch } = useTodoList()
  const todoAction = useTodoAction()
  const [actionError, setActionError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState<'all' | ScoreTier>('all')

  const items = useMemo(() => data?.items ?? [], [data?.items])
  const maxWeight = useMemo(
    () => Math.max(1, ...items.map((item) => item.weight)),
    [items],
  )

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()
    return items.filter((item) => {
      if (tierFilter !== 'all' && getScoreTier(item.weight, maxWeight) !== tierFilter) return false
      if (!query) return true
      const haystack = `${item.title} ${item.description} ${item.wardName ?? ''} ${item.weightTier} ${item.assignee ?? ''}`.toLowerCase()
      return haystack.includes(query)
    })
  }, [items, search, tierFilter, maxWeight])

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pagedItems = useMemo(
    () => filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredItems, currentPage],
  )

  useEffect(() => {
    setPage(1)
  }, [search, tierFilter, items.length])

  const handleComplete = async (id: string) => {
    setActionError(null)
    try {
      await todoAction.mutateAsync({ id, payload: { action: 'complete' } })
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Action failed')
    }
  }

  const handleExtend = async (id: string, newDeadline: string) => {
    setActionError(null)
    try {
      await todoAction.mutateAsync({
        id,
        payload: { action: 'extend', new_deadline: newDeadline },
      })
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Action failed')
    }
  }

  if (isLoading) return <PageLoading message="Loading to-do list…" />

  if (isError || !data) {
    const message = error instanceof ApiError ? error.message : 'Something went wrong.'
    return <PageError message={message} onRetry={() => void refetch()} />
  }

  const rangeStart = filteredItems.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filteredItems.length)

  return (
    <section className="space-y-4">
      <PageHeader
        description="Weighted active commitments sorted by urgency. Complete or extend items from here."
        eyebrow="Action queue"
        title="To-do list"
      />
      {actionError && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {actionError}
        </p>
      )}

      <PriorityFilterBar
        onSearch={setSearch}
        onTierFilter={setTierFilter}
        placeholder="Search title, ward, or assignee…"
        search={search}
        tierFilter={tierFilter}
      />

      <PriorityLegend
        noun="to-do items"
        onTierFilter={setTierFilter}
        rangeEnd={rangeEnd}
        rangeStart={rangeStart}
        tierFilter={tierFilter}
        total={filteredItems.length}
      />

      {pagedItems.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line/80 bg-white/70 px-6 py-12 text-center text-sm font-semibold text-muted">
          {search.trim() || tierFilter !== 'all'
            ? 'No to-do items match your search or filter.'
            : 'No active to-do items. All commitments are on track.'}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pagedItems.map((item) => (
            <TodoItem
              busy={todoAction.isPending}
              item={item}
              key={item.id}
              maxWeight={maxWeight}
              onComplete={(id) => void handleComplete(id)}
              onExtend={(id, deadline) => void handleExtend(id, deadline)}
            />
          ))}
        </div>
      )}

      <GridPagination currentPage={currentPage} onPage={setPage} pageCount={pageCount} />
    </section>
  )
}
