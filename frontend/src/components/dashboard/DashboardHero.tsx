import type { UserRole } from '../../types/auth'
import { getDashboardGreeting } from '../../types/dashboard'
import { roleLabels } from '../../types/auth'
import { getRoleTheme } from '../../theme/roleThemes'

type Props = {
  constituencyName: string
  role: UserRole
  phone?: string
}

export function DashboardHero({ constituencyName, role, phone }: Props) {
  const theme = getRoleTheme(role)

  return (
    <section className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${theme.heroGradient} p-6 text-white shadow-xl ${theme.heroShadow} sm:p-8`}>
      <div className="absolute -right-16 -top-16 size-48 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-20 left-1/3 size-56 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute right-8 top-8 opacity-20">
        <ConstituencyGraphic />
      </div>

      <div className="relative z-10">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-white/90 sm:text-xs">
          <span className={`size-2 animate-pulse rounded-full ${theme.heroPulse}`} />
          Live governance signals
        </p>
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.22em] text-white/70">
          {getDashboardGreeting(role)}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{constituencyName}</h1>
        <p className="mt-3 max-w-xl text-sm text-white/80 sm:text-base">
          Signed in as <span className="font-bold text-white">{roleLabels[role]}</span>
          {phone ? ` · +91 ${phone}` : ''}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <StatPill label="Wards tracked" value="6" />
          <StatPill label="Active engines" value="4" />
          <StatPill label="Updated" value="Just now" />
        </div>
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

function ConstituencyGraphic() {
  return (
    <svg aria-hidden="true" className="size-32 sm:size-40" fill="none" viewBox="0 0 160 160">
      <circle cx="80" cy="80" opacity="0.9" r="70" stroke="white" strokeWidth="2" />
      <circle cx="80" cy="80" opacity="0.5" r="48" stroke="white" strokeDasharray="6 8" strokeWidth="1.5" />
      <circle cx="55" cy="65" fill="white" opacity="0.8" r="8" />
      <circle cx="95" cy="55" fill="white" opacity="0.6" r="6" />
      <circle cx="88" cy="95" fill="white" opacity="0.7" r="10" />
      <circle cx="62" cy="98" fill="white" opacity="0.5" r="5" />
      <path d="M55 65 L95 55 L88 95 L62 98 Z" opacity="0.3" stroke="white" strokeWidth="1" />
    </svg>
  )
}
