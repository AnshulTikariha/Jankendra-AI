import { useUiStore } from '../../stores/useUiStore'

export function ComplaintConfirmationPage() {
  const lastComplaintRef = useUiStore((s) => s.lastComplaintRef)
  const setCitizenView = useUiStore((s) => s.setCitizenView)

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
        {lastComplaintRef && (
          <p className="mt-5 font-mono text-2xl font-extrabold text-teal-700">{lastComplaintRef}</p>
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
