import { type FormEvent, useState } from 'react'
import { ApiError } from '../../api/errors'
import { PageError, PageHeader, PageLoading } from '../../components/staff/PageStates'
import { useCommitments, useCreateCommitment, useWards } from '../../hooks/useStaffApi'
import type { Commitment } from '../../types/staff'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function CommitmentCard({ item }: { item: Commitment }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-line/80 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 bg-slate-50/50 px-5 py-3">
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${
          item.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-700'
        }`}>
          {item.status}
        </span>
        <span className="text-xs font-bold text-muted">{item.weightTier}</span>
      </div>
      <div className="p-5">
        <h2 className="text-lg font-extrabold">{item.title}</h2>
        <p className="mt-1 text-sm text-muted">
          {item.wardName ?? 'Constituency-wide'} · {formatDate(item.deadline)}
        </p>
        <p className="mt-3 text-sm leading-6">{item.description}</p>
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

      {data.commitments.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-semibold text-muted">
          No commitments in this view.
        </p>
      ) : (
        data.commitments.map((item) => <CommitmentCard item={item} key={item.id} />)
      )}
    </section>
  )
}
