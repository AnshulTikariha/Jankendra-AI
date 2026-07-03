import { getCitizenGreeting } from '../../data/demoCitizenDashboard'
import type { CitizenStats } from '../../hooks/useCitizenDashboard'
import { getRoleTheme } from '../../theme/roleThemes'

type Props = {
  constituencyName: string
  phone?: string
  stats: CitizenStats
  onReportIssue: () => void
}

export function CitizenDashboardHero({ constituencyName, phone, stats, onReportIssue }: Props) {
  const theme = getRoleTheme('citizen')

  return (
    <section className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${theme.heroGradient} p-6 text-white shadow-xl ${theme.heroShadow} sm:p-8`}>
      <div className="absolute -right-16 -top-16 size-48 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-20 left-1/3 size-56 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="absolute right-8 top-8 opacity-20">
        <CitizenGraphic />
      </div>

      <div className="relative z-10">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-white/90 sm:text-xs">
          <span className={`size-2 animate-pulse rounded-full ${theme.heroPulse}`} />
          Your citizen portal
        </p>
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.22em] text-white/70">
          {getCitizenGreeting()}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{constituencyName}</h1>
        <p className="mt-3 max-w-xl text-sm text-white/80 sm:text-base">
          Signed in as <span className="font-bold text-white">General Public</span>
          {phone ? ` · +91 ${phone}` : ''}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <StatPill label="Open complaints" value={String(stats.open)} />
          <StatPill label="Resolved" value={String(stats.resolved)} />
          <StatPill label="Total filed" value={String(stats.total)} />
        </div>

        <button
          className={`mt-6 rounded-full bg-white px-6 py-3 text-sm font-extrabold shadow-lg transition ${theme.heroCtaText} ${theme.heroCtaHover}`}
          onClick={onReportIssue}
          type="button"
        >
          Report a new issue
        </button>
      </div>
    </section>
  )
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur-sm">
      <p className="text-[0.65rem] font-bold uppercase tracking-wide text-white/65">{label}</p>
      <p className="mt-0.5 text-sm font-extrabold">{value}</p>
    </div>
  )
}

function CitizenGraphic() {
  return (
    <svg aria-hidden="true" className="size-32 sm:size-40" fill="none" viewBox="0 0 160 160">
      <circle cx="80" cy="80" opacity="0.9" r="70" stroke="white" strokeWidth="2" />
      <circle cx="60" cy="65" fill="white" opacity="0.7" r="10" />
      <circle cx="95" cy="60" fill="white" opacity="0.5" r="8" />
      <circle cx="85" cy="95" fill="white" opacity="0.6" r="12" />
      <path d="M50 110 Q80 125 110 110" opacity="0.4" stroke="white" strokeWidth="2" />
    </svg>
  )
}
