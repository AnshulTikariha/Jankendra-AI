import { type FormEvent, useEffect, useMemo, useState } from 'react'
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
import { useCommitments, useCreateCommitment, useWards } from '../../hooks/useStaffApi'
import type { Commitment } from '../../types/staff'

const PAGE_SIZE = 6

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function CommitmentCard({ item, maxWeight }: { item: Commitment; maxWeight: number }) {
  const tier = getScoreTier(item.weight, maxWeight)
  const style = tierStyles[tier]
  return (
    <article className={`flex flex-col overflow-hidden rounded-2xl border shadow-sm transition hover:shadow-md ${style.card}`}>
      <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5 ${style.header}`}>
        <span className={`rounded-full px-2.5 py-0.5 text-[0.7rem] font-extrabold ${
          item.status === 'completed' ? 'bg-emerald-600 text-white' : style.badge
        }`}>
          {item.status}
        </span>
        <span className={`text-xs font-extrabold ${style.scoreText}`}>
          {item.weightTier} · {Math.round(item.weight * 10) / 10}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h2 className="text-base font-extrabold leading-snug text-ink">{item.title}</h2>
        <p className="mt-1 text-xs font-semibold text-muted">
          {item.wardName ?? 'Constituency-wide'} · {formatDate(item.deadline)}
        </p>
        <p className="mt-3 line-clamp-4 text-sm leading-6 text-ink">{item.description}</p>
      </div>
    </article>
  )
}

export function CommitmentsPage() {
  const [tab, setTab] = useState<'all' | 'active' | 'completed'>('all')
  const { data, isLoading, isError, error, refetch } = useCommitments(tab)
  const { data: wardsData } = useWards()
  const createCommitment = useCreateCommitment()
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [wardId, setWardId] = useState<number | ''>('')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState<'all' | ScoreTier>('all')

  const commitments = useMemo(() => data?.commitments ?? [], [data?.commitments])
  const maxWeight = useMemo(
    () => Math.max(1, ...commitments.map((item) => item.weight)),
    [commitments],
  )

  const filteredCommitments = useMemo(() => {
    const query = search.trim().toLowerCase()
    return commitments.filter((item) => {
      if (tierFilter !== 'all' && getScoreTier(item.weight, maxWeight) !== tierFilter) return false
      if (!query) return true
      const haystack = `${item.title} ${item.description} ${item.wardName ?? ''} ${item.weightTier} ${item.status}`.toLowerCase()
      return haystack.includes(query)
    })
  }, [commitments, search, tierFilter, maxWeight])

  const pageCount = Math.max(1, Math.ceil(filteredCommitments.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pagedCommitments = useMemo(
    () => filteredCommitments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredCommitments, currentPage],
  )

  useEffect(() => {
    setPage(1)
  }, [search, tierFilter, tab, commitments.length])

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)
    try {
      await createCommitment.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        deadline,
        ward_id: wardId === '' ? undefined : wardId,
      })
      setTitle('')
      setDescription('')
      setDeadline('')
      setWardId('')
      setShowForm(false)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not create commitment')
    }
  }

  if (isLoading) return <PageLoading message="Loading commitments…" />

  if (isError || !data) {
    const message = error instanceof ApiError ? error.message : 'Something went wrong.'
    return <PageError message={message} onRetry={() => void refetch()} />
  }

  const rangeStart = filteredCommitments.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filteredCommitments.length)

  return (
    <section className="space-y-4">
      <PageHeader
        description="Track active and completed commitments from meetings and manual entry."
        eyebrow="Commitments"
        title="Commitment tracker"
      />

      <div className="flex flex-wrap gap-2">
        {(['all', 'active', 'completed'] as const).map((value) => (
          <button
            className={`rounded-full px-4 py-2 text-xs font-extrabold ${
              tab === value ? 'bg-primary text-white' : 'border border-line bg-white text-muted'
            }`}
            key={value}
            onClick={() => setTab(value)}
            type="button"
          >
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </button>
        ))}
        <button
          className="ml-auto rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-xs font-extrabold text-primary"
          onClick={() => setShowForm((v) => !v)}
          type="button"
        >
          {showForm ? 'Cancel' : '+ Add commitment'}
        </button>
      </div>

      {showForm && (
        <form className="space-y-4 rounded-3xl border border-line/80 bg-white p-5 shadow-md" onSubmit={(e) => void handleCreate(e)}>
          <label className="block">
            <span className="text-sm font-bold">Title</span>
            <input className="mt-2 w-full rounded-xl border border-line px-4 py-3 font-semibold" onChange={(e) => setTitle(e.target.value)} required value={title} />
          </label>
          <label className="block">
            <span className="text-sm font-bold">Description</span>
            <textarea className="mt-2 w-full rounded-xl border border-line px-4 py-3" onChange={(e) => setDescription(e.target.value)} required rows={3} value={description} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-bold">Deadline</span>
              <input className="mt-2 w-full rounded-xl border border-line px-4 py-3 font-semibold" onChange={(e) => setDeadline(e.target.value)} required type="date" value={deadline} />
            </label>
            <label className="block">
              <span className="text-sm font-bold">Ward (optional)</span>
              <select className="mt-2 w-full rounded-xl border border-line px-4 py-3 font-semibold" onChange={(e) => setWardId(e.target.value ? Number(e.target.value) : '')} value={wardId}>
                <option value="">Constituency-wide</option>
                {wardsData?.wards.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </label>
          </div>
          {formError && <p className="text-sm font-semibold text-red-600">{formError}</p>}
          <button className="rounded-full bg-primary px-6 py-3 text-sm font-extrabold text-white disabled:opacity-50" disabled={createCommitment.isPending} type="submit">
            {createCommitment.isPending ? 'Saving…' : 'Create commitment'}
          </button>
        </form>
      )}

      <PriorityFilterBar
        onSearch={setSearch}
        onTierFilter={setTierFilter}
        placeholder="Search title, ward, or status…"
        search={search}
        tierFilter={tierFilter}
      />

      <PriorityLegend
        noun="commitments"
        onTierFilter={setTierFilter}
        rangeEnd={rangeEnd}
        rangeStart={rangeStart}
        tierFilter={tierFilter}
        total={filteredCommitments.length}
      />

      {pagedCommitments.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line/80 bg-white/70 px-6 py-12 text-center text-sm font-semibold text-muted">
          {search.trim() || tierFilter !== 'all'
            ? 'No commitments match your search or filter.'
            : 'No commitments in this view.'}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pagedCommitments.map((item) => (
            <CommitmentCard item={item} key={item.id} maxWeight={maxWeight} />
          ))}
        </div>
      )}

      <GridPagination currentPage={currentPage} onPage={setPage} pageCount={pageCount} />
    </section>
  )
}
