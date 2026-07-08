import { useEffect, useMemo, useState } from 'react'
import { ApiError } from '../../api/errors'
import { PageError, PageHeader, PageLoading } from '../../components/staff/PageStates'
import {
  type ComplaintQueueFilters,
  useStaffComplaintsQueue,
} from '../../hooks/useStaffComplaintsQueue'
import { useWards } from '../../hooks/useStaffApi'
import { ComplaintAiInsights } from '../../components/staff/ComplaintAiInsights'
import { useUpdateComplaint } from '../../hooks/useComplaints'
import {
  formatComplaintWardLabel,
  getComplaintDisplayTitle,
  parseComplaintSummary,
} from '../../lib/raiseComplaintFormat'
import {
  citizenStatusLabels,
  complaintCategoryLabels,
  type CitizenComplaintStatus,
  type ComplaintCategory,
} from '../../types/complaint'
import {
  getComplaintSeverity,
  severityBadgeStyles,
  severityCardStyles,
  severityLabels,
} from '../../lib/complaintSeverity'

const PAGE_SIZE = 10

const statusOptions: CitizenComplaintStatus[] = [
  'submitted',
  'under_review',
  'in_progress',
  'resolved',
]

const statusColors: Record<CitizenComplaintStatus, string> = {
  submitted: 'bg-slate-100 text-slate-700',
  under_review: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-emerald-100 text-emerald-800',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ComplaintsQueuePage() {
  const [filters, setFilters] = useState<ComplaintQueueFilters>({
    category: 'all',
    status: 'all',
    source: 'all',
    search: '',
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draftStatus, setDraftStatus] = useState<CitizenComplaintStatus>('submitted')
  const [draftNote, setDraftNote] = useState('')
  const [draftDepartment, setDraftDepartment] = useState('')
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const { data: wardsData } = useWards()
  const { complaints, total, isLoading, isError, error, refetch } =
    useStaffComplaintsQueue(filters)
  const updateComplaintMutation = useUpdateComplaint()

  const pageCount = Math.max(1, Math.ceil(complaints.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pagedComplaints = useMemo(
    () => complaints.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [complaints, currentPage],
  )
  const rangeStart = complaints.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, complaints.length)

  useEffect(() => {
    setPage(1)
  }, [filters.wardId, filters.category, filters.status, filters.source, filters.search])

  const selected = complaints.find((c) => c.id === selectedId) ?? null

  useEffect(() => {
    if (complaints.length === 0) return
    if (selectedId && complaints.some((c) => c.id === selectedId)) return
    const first = complaints[0]
    setSelectedId(first.id)
    setDraftStatus(first.status)
    setDraftNote(first.staffNote ?? '')
    setDraftDepartment(first.assignedDepartment ?? first.departmentSuggestion ?? '')
    setSavedMessage(null)
  }, [complaints, selectedId])

  const openDetail = (id: string) => {
    const item = complaints.find((c) => c.id === id)
    setSelectedId(id)
    if (item) {
      setDraftStatus(item.status)
      setDraftNote(item.staffNote ?? '')
      setDraftDepartment(item.assignedDepartment ?? item.departmentSuggestion ?? '')
    }
    setSavedMessage(null)
  }

  const handleSaveActions = () => {
    if (!selectedId) return
    setSavedMessage(null)
    updateComplaintMutation.mutate(
      {
        complaintId: selectedId,
        payload: {
          status: draftStatus,
          assigned_department: draftDepartment.trim(),
          staff_note: draftNote.trim(),
        },
      },
      {
        onSuccess: () => setSavedMessage('Complaint updated successfully.'),
      },
    )
  }

  if (isLoading) return <PageLoading message="Loading complaint queue…" />

  if (isError) {
    const message = error instanceof ApiError ? error.message : 'Something went wrong.'
    return <PageError message={message} onRetry={() => void refetch()} />
  }

  return (
    <section className="space-y-4">
      <PageHeader
        description="All constituency complaints from citizens and staff. Filter by ward, category, or status."
        eyebrow="Complaint queue"
        title="All complaints"
      />

      <div className="grid gap-3 rounded-3xl border border-line/80 bg-white p-4 shadow-md sm:grid-cols-2 lg:grid-cols-5">
        <label className="block">
          <span className="text-xs font-bold text-muted">Ward</span>
          <select
            className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm font-semibold"
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                wardId: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
            value={filters.wardId ?? ''}
          >
            <option value="">All wards</option>
            {wardsData?.wards.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-bold text-muted">Category</span>
          <select
            className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm font-semibold"
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                category: e.target.value as ComplaintCategory | 'all',
              }))
            }
            value={filters.category}
          >
            <option value="all">All categories</option>
            {(Object.keys(complaintCategoryLabels) as ComplaintCategory[]).map((cat) => (
              <option key={cat} value={cat}>{complaintCategoryLabels[cat]}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-bold text-muted">Status</span>
          <select
            className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm font-semibold"
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                status: e.target.value as CitizenComplaintStatus | 'all',
              }))
            }
            value={filters.status}
          >
            <option value="all">All statuses</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>{citizenStatusLabels[s]}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-bold text-muted">Source</span>
          <select
            className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm font-semibold"
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                source: e.target.value as 'citizen' | 'staff' | 'all',
              }))
            }
            value={filters.source}
          >
            <option value="all">All sources</option>
            <option value="citizen">Citizen</option>
            <option value="staff">Staff</option>
          </select>
        </label>
        <label className="block sm:col-span-2 lg:col-span-1">
          <span className="text-xs font-bold text-muted">Search</span>
          <input
            className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm font-semibold"
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder="Reference, phone, text…"
            value={filters.search}
          />
        </label>
      </div>

      <p className="text-sm font-semibold text-muted">
        {complaints.length === 0
          ? `0 of ${total} complaint${total === 1 ? '' : 's'}`
          : `Showing ${rangeStart}–${rangeEnd} of ${complaints.length} filtered · ${total} total`}
      </p>

      <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-3">
          {complaints.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-semibold text-muted">
              No complaints match your filters.
            </p>
          ) : (
            pagedComplaints.map((complaint) => {
              const severity = getComplaintSeverity(complaint.description)
              const isSelected = selectedId === complaint.id
              return (
              <button
                className={`w-full overflow-hidden rounded-2xl border text-left shadow-sm transition hover:shadow-md ${
                  severity ? severityCardStyles[severity] : 'bg-white'
                } ${
                  isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-line/80'
                }`}
                key={complaint.id}
                onClick={() => openDetail(complaint.id)}
                type="button"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 bg-white/60 px-4 py-3">
                  <span className="font-mono text-sm font-bold text-primary">
                    {complaint.publicReference}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {severity && (
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${severityBadgeStyles[severity]}`}>
                        {severityLabels[severity]}
                      </span>
                    )}
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusColors[complaint.status]}`}>
                      {citizenStatusLabels[complaint.status]}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <p className="font-extrabold text-ink">
                    {getComplaintDisplayTitle(complaint, complaintCategoryLabels[complaint.category])}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {formatComplaintWardLabel(complaint)} · {complaint.source === 'citizen' ? 'Citizen' : 'Staff'}
                    {complaint.reporterPhone ? ` · +91 ${complaint.reporterPhone}` : ''}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-muted">
                    {parseComplaintSummary(complaint.description)}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-muted">{formatDate(complaint.submittedAt)}</p>
                </div>
              </button>
              )
            })
          )}

          {complaints.length > 0 && pageCount > 1 && (
            <nav
              aria-label="Complaint pagination"
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line/80 bg-white px-4 py-3 shadow-sm"
            >
              <button
                className="rounded-full border border-line px-4 py-2 text-xs font-bold text-muted transition hover:bg-slate-50 disabled:opacity-40"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                type="button"
              >
                ← Prev
              </button>
              <div className="flex flex-wrap items-center gap-1.5">
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    aria-current={pageNum === currentPage ? 'page' : undefined}
                    className={`grid size-8 place-items-center rounded-full text-xs font-extrabold transition ${
                      pageNum === currentPage
                        ? 'bg-primary text-white shadow-sm'
                        : 'border border-line bg-white text-muted hover:bg-slate-50'
                    }`}
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    type="button"
                  >
                    {pageNum}
                  </button>
                ))}
              </div>
              <button
                className="rounded-full border border-line px-4 py-2 text-xs font-bold text-muted transition hover:bg-slate-50 disabled:opacity-40"
                disabled={currentPage >= pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                type="button"
              >
                Next →
              </button>
            </nav>
          )}
        </div>

        <aside className="xl:sticky xl:top-4 xl:self-start">
          {selected ? (
            <div className="space-y-4 rounded-3xl border border-line/80 bg-white p-5 shadow-md">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono text-sm font-bold text-primary">{selected.publicReference}</p>
                  {(() => {
                    const severity = getComplaintSeverity(selected.description)
                    return severity ? (
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${severityBadgeStyles[severity]}`}>
                        {severityLabels[severity]}
                      </span>
                    ) : null
                  })()}
                </div>
                <h2 className="mt-1 text-lg font-extrabold">
                  {getComplaintDisplayTitle(selected, complaintCategoryLabels[selected.category])}
                </h2>
                <p className="mt-1 text-xs text-muted">
                  {formatComplaintWardLabel(selected)} · {formatDate(selected.submittedAt)}
                </p>
              </div>

              <p className="text-sm leading-6 text-ink">{selected.description}</p>
              {selected.locationDetail && (
                <p className="text-sm text-muted"><strong>Location:</strong> {selected.locationDetail}</p>
              )}
              {selected.clusterCount > 1 && (
                <p className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800">
                  {selected.clusterCount} similar reports in this ward cluster
                </p>
              )}

              <ComplaintAiInsights
                complaint={selected}
                onApplyDepartment={setDraftDepartment}
              />

              <label className="block">
                <span className="text-xs font-bold text-muted">Update status</span>
                <select
                  className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm font-semibold"
                  onChange={(e) => setDraftStatus(e.target.value as CitizenComplaintStatus)}
                  value={draftStatus}
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>{citizenStatusLabels[s]}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-bold text-muted">Assigned department</span>
                <input
                  className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm font-semibold"
                  onChange={(e) => setDraftDepartment(e.target.value)}
                  placeholder="e.g. PWD, WMD"
                  value={draftDepartment}
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold text-muted">Internal note</span>
                <textarea
                  className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm"
                  onChange={(e) => setDraftNote(e.target.value)}
                  placeholder="Staff notes (internal)"
                  rows={3}
                  value={draftNote}
                />
              </label>

              <button
                className="w-full rounded-full bg-primary py-3 text-sm font-extrabold text-white shadow-md transition disabled:cursor-not-allowed disabled:opacity-60"
                disabled={updateComplaintMutation.isPending}
                onClick={handleSaveActions}
                type="button"
              >
                {updateComplaintMutation.isPending ? 'Saving…' : 'Save actions'}
              </button>

              {savedMessage && (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                  {savedMessage}
                </p>
              )}

              {updateComplaintMutation.isError && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">
                  {updateComplaintMutation.error instanceof ApiError
                    ? updateComplaintMutation.error.message
                    : 'Could not save changes. Please try again.'}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  className="rounded-full border border-line px-3 py-1.5 text-xs font-bold text-muted"
                  onClick={() => {
                    const next =
                      statusOptions[Math.min(statusOptions.indexOf(draftStatus) + 1, statusOptions.length - 1)]
                    setDraftStatus(next)
                  }}
                  type="button"
                >
                  Advance status →
                </button>
                <button
                  className="rounded-full border border-line px-3 py-1.5 text-xs font-bold text-muted"
                  onClick={() => setDraftStatus('resolved')}
                  type="button"
                >
                  Mark resolved
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-muted">
              Select a complaint to update status, assign department, or add notes.
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}
