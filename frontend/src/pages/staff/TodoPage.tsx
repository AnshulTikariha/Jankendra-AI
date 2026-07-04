import { useState } from 'react'
import { ApiError } from '../../api/errors'
import { PageError, PageHeader, PageLoading } from '../../components/staff/PageStates'
import { useTodoAction, useTodoList } from '../../hooks/useStaffApi'
import type { Commitment } from '../../types/staff'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function TodoItem({ item, onComplete, onExtend, busy }: {
  item: Commitment
  onComplete: (id: string) => void
  onExtend: (id: string, deadline: string) => void
  busy: boolean
}) {
  const [extending, setExtending] = useState(false)
  const [newDeadline, setNewDeadline] = useState(item.deadline)

  return (
    <article className="overflow-hidden rounded-2xl border border-line/80 bg-white shadow-sm">
      <div className="border-b border-line/60 bg-slate-50/50 px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-800">
            {item.weightTier} · weight {item.weight}
          </span>
          {item.daysOverdue > 0 && (
            <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
              {item.daysOverdue} days overdue
            </span>
          )}
        </div>
      </div>
      <div className="p-5">
        <h2 className="text-lg font-extrabold text-ink">{item.title}</h2>
        <p className="mt-1 text-sm text-muted">
          {item.wardName ?? 'Constituency-wide'} · Due {formatDate(item.deadline)}
          {item.assignee ? ` · ${item.assignee}` : ''}
        </p>
        <p className="mt-3 text-sm leading-6 text-ink">{item.description}</p>

        {extending ? (
          <div className="mt-4 flex flex-wrap items-end gap-3">
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
              Save extension
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
          <div className="mt-4 flex flex-wrap gap-2">
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
              Extend deadline
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
      {data.items.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-semibold text-muted">
          No active to-do items. All commitments are on track.
        </p>
      ) : (
        data.items.map((item) => (
          <TodoItem
            busy={todoAction.isPending}
            item={item}
            key={item.id}
            onComplete={(id) => void handleComplete(id)}
            onExtend={(id, deadline) => void handleExtend(id, deadline)}
          />
        ))
      )}
    </section>
  )
}
