import { useAuthStore } from '../../stores/useAuthStore'
import { useComplaintStore } from '../../stores/useComplaintStore'
import { useUiStore } from '../../stores/useUiStore'
import {
  citizenStatusLabels,
  complaintCategoryLabels,
  type CitizenComplaintStatus,
} from '../../types/complaint'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const statusOrder: CitizenComplaintStatus[] = ['submitted', 'under_review', 'in_progress', 'resolved']

const statusColors: Record<CitizenComplaintStatus, string> = {
  submitted: 'bg-slate-100 text-slate-700',
  under_review: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-emerald-100 text-emerald-800',
}

function StatusStepper({ status }: { status: CitizenComplaintStatus }) {
  const currentIndex = statusOrder.indexOf(status)

  return (
    <div className="mt-4 flex items-center gap-1">
      {statusOrder.map((step, index) => (
        <div className="flex flex-1 items-center gap-1" key={step}>
          <div
            className={`size-2.5 shrink-0 rounded-full ${
              index <= currentIndex
                ? index === currentIndex
                  ? 'bg-teal-500 ring-2 ring-teal-200'
                  : 'bg-teal-400'
                : 'bg-slate-200'
            }`}
          />
          {index < statusOrder.length - 1 && (
            <div className={`h-0.5 flex-1 rounded ${index < currentIndex ? 'bg-teal-400' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export function MyComplaintsPage() {
  const session = useAuthStore((s) => s.session)
  const getByPhone = useComplaintStore((s) => s.getByPhone)
  const setCitizenView = useUiStore((s) => s.setCitizenView)

  const complaints = session ? getByPhone(session.phone) : []

  if (complaints.length === 0) {
    return (
      <section className="flex min-h-[20rem] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300/80 bg-white/80 p-8 text-center shadow-sm">
        <div className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-100 text-2xl text-teal-600">
          ○
        </div>
        <p className="mt-4 text-lg font-extrabold">No complaints yet</p>
        <p className="mt-2 text-sm text-muted">Report an issue in your ward to get started.</p>
        <button
          className="mt-5 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg"
          onClick={() => setCitizenView('raise')}
          type="button"
        >
          Report a new issue
        </button>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-3xl border border-line/80 bg-white shadow-md">
        <div className="border-b border-line/80 bg-gradient-to-r from-teal-50/50 to-white px-5 py-4 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">My complaints</p>
          <h1 className="mt-1 text-2xl font-extrabold">Track your submissions</h1>
          <p className="mt-1 text-sm text-muted">Only your complaints are shown here.</p>
        </div>
      </div>

      {complaints.map((complaint) => (
        <article className="overflow-hidden rounded-2xl border border-line/80 bg-white shadow-md" key={complaint.id}>
          <div className="border-b border-line/60 bg-slate-50/50 px-5 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-sm font-bold text-teal-700">{complaint.publicReference}</p>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusColors[complaint.status]}`}>
                {citizenStatusLabels[complaint.status]}
              </span>
            </div>
          </div>
          <div className="p-5">
            <h2 className="font-extrabold text-lg">{complaintCategoryLabels[complaint.category]}</h2>
            <p className="mt-1 text-sm text-muted">{complaint.wardName} · {formatDate(complaint.submittedAt)}</p>
            <p className="mt-3 text-sm leading-6 text-ink">{complaint.description}</p>
            <StatusStepper status={complaint.status} />
            <div className="mt-3 flex flex-wrap gap-2">
              {statusOrder.map((step) => (
                <span className="text-[0.6rem] font-semibold text-muted" key={step}>
                  {citizenStatusLabels[step]}
                </span>
              ))}
            </div>
            {complaint.clusterCount > 1 && (
              <p className="mt-4 rounded-xl bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-800">
                {complaint.clusterCount} residents reported similar issues in your ward
              </p>
            )}
          </div>
        </article>
      ))}
    </section>
  )
}
