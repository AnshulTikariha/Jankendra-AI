import { citizenTrustPoints } from '../../data/demoCitizenDashboard'
import { getRoleTheme } from '../../theme/roleThemes'

const icons = ['🔒', '🔗', '📋']

export function TrustStrip() {
  const theme = getRoleTheme('citizen')

  return (
    <section className="grid gap-4 sm:grid-cols-3">
      {citizenTrustPoints.map((point, index) => (
        <article
          className="relative overflow-hidden rounded-2xl border border-white/60 bg-white p-5 shadow-md shadow-slate-200/50"
          key={point.id}
        >
          <div className={`absolute -right-3 -top-3 size-16 rounded-full ${theme.sidebarBlurOrb} blur-xl`} />
          <div className={`relative grid size-10 place-items-center rounded-xl bg-gradient-to-br ${theme.emptyIconBg} text-lg`}>
            {icons[index]}
          </div>
          <h3 className="relative mt-3 font-extrabold text-ink">{point.title}</h3>
          <p className="relative mt-1 text-sm text-muted">{point.description}</p>
        </article>
      ))}
    </section>
  )
}
