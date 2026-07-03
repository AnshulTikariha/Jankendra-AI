import { useAuthStore } from '../../stores/useAuthStore'
import { useComplaintStore } from '../../stores/useComplaintStore'
import { useUiStore } from '../../stores/useUiStore'
import {
  citizenStatusLabels,
  complaintCategoryLabels,
} from '../../types/complaint'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function MyComplaintsPage() {
  const session = useAuthStore((s) => s.session)
  const getByPhone = useComplaintStore((s) => s.getByPhone)
  const setCitizenView = useUiStore((s) => s.setCitizenView)

  const complaints = session ? getByPhone(session.phone) : []

  if (complaints.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-line bg-white p-8 text-center">
        <p className="text-lg font-extrabold">No complaints yet</p>
        <p className="mt-2 text-sm text-muted">Report an issue in your ward to get started.</p>
        <button
          className="mt-5 rounded-full bg-primary px-6 py-3 text-sm font-extrabold text-white"
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
      <div>
        <h1 className="text-2xl font-extrabold">My complaints</h1>
        <p className="mt-1 text-sm text-muted">Only your submissions are shown here.</p>
      </div>

      {complaints.map((complaint) => (
        <article className="rounded-2xl border border-line bg-white p-5 shadow-sm" key={complaint.id}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="font-mono text-sm font-bold text-primary">{complaint.publicReference}</p>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-muted">
              {citizenStatusLabels[complaint.status]}
            </span>
          </div>
          <h2 className="mt-3 font-extrabold">{complaintCategoryLabels[complaint.category]}</h2>
          <p className="mt-1 text-sm text-muted">{complaint.wardName} · {formatDate(complaint.submittedAt)}</p>
          <p className="mt-3 text-sm leading-6 text-ink">{complaint.description}</p>
          {complaint.clusterCount > 1 && (
            <p className="mt-3 rounded-xl bg-soft-blue px-3 py-2 text-xs font-semibold text-primary">
              {complaint.clusterCount} residents reported similar issues in your ward
            </p>
          )}
        </article>
      ))}
    </section>
  )
}
