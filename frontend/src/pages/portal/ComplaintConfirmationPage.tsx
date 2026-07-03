import { useUiStore } from '../../stores/useUiStore'

export function ComplaintConfirmationPage() {
  const lastComplaintRef = useUiStore((s) => s.lastComplaintRef)
  const setCitizenView = useUiStore((s) => s.setCitizenView)

  return (
    <section className="rounded-3xl border border-accent/20 bg-emerald-50 p-6 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent text-2xl font-extrabold text-white">✓</div>
      <h1 className="mt-4 text-2xl font-extrabold">Complaint registered</h1>
      <p className="mt-2 text-sm text-muted">
        Your complaint has been recorded. Save this reference to track progress.
      </p>
      {lastComplaintRef && (
        <p className="mt-4 font-mono text-xl font-extrabold text-primary">{lastComplaintRef}</p>
      )}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          className="rounded-full bg-primary px-6 py-3 text-sm font-extrabold text-white"
          onClick={() => setCitizenView('my-complaints')}
          type="button"
        >
          View my complaints
        </button>
        <button
          className="rounded-full border border-line bg-white px-6 py-3 text-sm font-extrabold text-primary"
          onClick={() => setCitizenView('home')}
          type="button"
        >
          Back to home
        </button>
      </div>
    </section>
  )
}
