import { useAuthStore } from '../../stores/useAuthStore'
import { useComplaintStore } from '../../stores/useComplaintStore'
import { useUiStore } from '../../stores/useUiStore'

const trustPoints = [
  'Your complaint is recorded permanently',
  'Similar issues in your ward are grouped for faster action',
  'Track status with your reference number',
]

export function CitizenHomePage() {
  const session = useAuthStore((s) => s.session)
  const getByPhone = useComplaintStore((s) => s.getByPhone)
  const setCitizenView = useUiStore((s) => s.setCitizenView)

  const complaints = session ? getByPhone(session.phone) : []
  const openCount = complaints.filter((c) => c.status !== 'resolved').length

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-line bg-gradient-to-br from-primary to-primary-dark p-6 text-white shadow-lg">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">Citizen portal</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Your voice reaches your representative.</h1>
        <p className="mt-3 text-white/80">
          Report issues in your ward and follow their progress with a permanent reference number.
        </p>
        <button
          className="mt-6 w-full rounded-full bg-white py-3.5 text-base font-extrabold text-primary shadow-lg sm:w-auto sm:px-8"
          onClick={() => setCitizenView('raise')}
          type="button"
        >
          Report a new issue
        </button>
      </div>

      <button
        className="flex w-full items-center justify-between rounded-2xl border border-line bg-white p-5 text-left shadow-sm transition hover:border-primary-light"
        onClick={() => setCitizenView('my-complaints')}
        type="button"
      >
        <div>
          <p className="text-sm font-bold text-muted">My complaints</p>
          <p className="mt-1 text-lg font-extrabold">{openCount} open</p>
        </div>
        <span className="text-2xl text-primary">→</span>
      </button>

      <ul className="space-y-3 rounded-2xl border border-line bg-white p-5">
        {trustPoints.map((point) => (
          <li className="flex items-start gap-3 text-sm text-muted" key={point}>
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-accent">✓</span>
            {point}
          </li>
        ))}
      </ul>
    </section>
  )
}
