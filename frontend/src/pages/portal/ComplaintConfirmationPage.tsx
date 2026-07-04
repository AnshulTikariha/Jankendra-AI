import { useComplaint } from '../../hooks/useComplaints'
import { useUiStore } from '../../stores/useUiStore'
import { complaintCategoryLabels } from '../../types/complaint'

export function ComplaintConfirmationPage() {
  const lastComplaintRef = useUiStore((s) => s.lastComplaintRef)
  const lastComplaintId = useUiStore((s) => s.lastComplaintId)
  const setCitizenView = useUiStore((s) => s.setCitizenView)
  const { data: complaint, isLoading } = useComplaint(lastComplaintId)

  const reference = complaint?.publicReference ?? lastComplaintRef

  return (
    <section className="relative overflow-hidden rounded-3xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-8 text-center shadow-lg">
      <div className="absolute -right-10 -top-10 size-32 rounded-full bg-emerald-200/30 blur-3xl" />
      <div className="relative">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-2xl font-extrabold text-white shadow-lg">
          ✓
        </div>
        <h1 className="mt-5 text-2xl font-extrabold">Complaint registered</h1>
        <p className="mt-2 text-sm text-muted">
          Your complaint has been recorded. Save this reference to track progress.
        </p>
        {isLoading && !reference && (
          <p className="mt-5 text-sm font-semibold text-muted">Loading reference…</p>
        )}
        {reference && (
          <p className="mt-5 font-mono text-2xl font-extrabold text-teal-700">{reference}</p>
        )}
        {complaint && (
          <div className="mx-auto mt-5 max-w-md rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3 text-left text-sm">
            <p className="font-bold text-ink">{complaintCategoryLabels[complaint.category]}</p>
            <p className="mt-1 text-muted">{complaint.wardName}</p>
            {complaint.departmentSuggestion && (
              <p className="mt-2 text-xs font-semibold text-teal-800">
                Routed to: {complaint.departmentSuggestion}
              </p>
            )}
          </div>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            className="rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg"
            onClick={() => setCitizenView('my-complaints')}
            type="button"
          >
            View my complaints
          </button>
          <button
            className="rounded-full border border-line bg-white px-6 py-3 text-sm font-extrabold text-teal-700 transition hover:bg-teal-50"
            onClick={() => setCitizenView('home')}
            type="button"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    </section>
  )
}
