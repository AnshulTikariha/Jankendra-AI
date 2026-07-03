import { LanguageSwitcher } from './LanguageSwitcher'
import { roleLabels, type UserRole } from '../types/auth'
import { getRoleTheme } from '../theme/roleThemes'

type Props = {
  role: UserRole
  constituencyName?: string
  phone?: string
  onLogout: () => void
}

const headerCopy: Record<UserRole, { eyebrow: string; title: string; Graphic: () => React.ReactNode }> = {
  citizen: { eyebrow: 'Citizen portal', title: 'Your voice matters', Graphic: CitizenHeaderGraphic },
  staff: { eyebrow: 'Staff workspace', title: 'Governance command center', Graphic: StaffHeaderGraphic },
  leader: { eyebrow: 'Leader overview', title: 'Strategic constituency view', Graphic: LeaderHeaderGraphic },
}

export function PortalHeader({ role, constituencyName, phone, onLogout }: Props) {
  const theme = getRoleTheme(role)
  const copy = headerCopy[role]
  const Graphic = copy.Graphic

  return (
    <header className="relative overflow-hidden border-b border-white/10 shadow-lg shadow-slate-900/10">
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.headerGradient}`} />
      <div className="absolute -left-20 top-0 size-64 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -right-16 bottom-0 size-72 rounded-full bg-white/5 blur-3xl" />

      <div className="absolute right-4 top-1/2 hidden -translate-y-1/2 opacity-20 lg:block xl:right-8">
        <Graphic />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className={`grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${theme.avatarGradient} text-sm font-extrabold text-white shadow-xl ring-2 ring-white/20 sm:size-16 sm:text-base`}>
              {theme.avatarLabel}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className={`text-[0.65rem] font-bold uppercase tracking-[0.22em] sm:text-xs ${theme.headerAccentText}`}>
                  {copy.eyebrow}
                </p>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-white/90">
                  <span className={`size-1.5 animate-pulse rounded-full ${theme.heroPulse}`} />
                  Live
                </span>
              </div>

              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                {copy.title}
              </h1>

              <p className="mt-1 truncate text-sm text-white/75">
                {constituencyName ?? 'Constituency'} · {roleLabels[role]}
                {phone ? ` · +91 ${phone}` : ''}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <LanguageSwitcher variant="light" />
            <span className={`hidden rounded-full border px-3 py-2 text-xs font-bold sm:inline-flex ${theme.headerBadgeBorder} ${theme.headerBadgeBg} ${theme.headerBadgeText}`}>
              Built for public service
            </span>
            <button
              className={`inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-bold text-white shadow-sm backdrop-blur-sm transition ${theme.headerSignOutHover}`}
              onClick={onLogout}
              type="button"
            >
              <SignOutIcon />
              Sign out
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 lg:hidden">
          <div className="h-px flex-1 bg-white/15" />
          <div className="grid size-12 place-items-center rounded-xl bg-white/10 opacity-40">
            <MiniGraphic role={role} />
          </div>
          <div className="h-px flex-1 bg-white/15" />
        </div>
      </div>
    </header>
  )
}

function MiniGraphic({ role }: { role: UserRole }) {
  if (role === 'citizen') {
    return (
      <svg aria-hidden="true" className="size-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="3" />
        <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      </svg>
    )
  }
  if (role === 'leader') {
    return (
      <svg aria-hidden="true" className="size-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M4 18v-6l4-2 4 3 8-5v10H4z" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <svg aria-hidden="true" className="size-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <rect height="14" rx="2" width="16" x="4" y="6" />
      <path d="M8 10h8M8 14h5" strokeLinecap="round" />
    </svg>
  )
}

function CitizenHeaderGraphic() {
  return (
    <svg aria-hidden="true" className="size-36 xl:size-44" fill="none" viewBox="0 0 180 180">
      <circle cx="90" cy="90" opacity="0.5" r="78" stroke="white" strokeDasharray="8 10" strokeWidth="1.5" />
      <circle cx="70" cy="75" fill="white" opacity="0.7" r="10" />
      <circle cx="105" cy="68" fill="white" opacity="0.5" r="8" />
      <circle cx="95" cy="100" fill="white" opacity="0.6" r="12" />
      <path d="M55 125 Q90 145 125 125" opacity="0.4" stroke="white" strokeWidth="2" />
      <path d="M90 90 L70 75 M90 90 L105 68 M90 90 L95 100" opacity="0.35" stroke="white" strokeWidth="1.5" />
    </svg>
  )
}

function StaffHeaderGraphic() {
  return (
    <svg aria-hidden="true" className="size-36 xl:size-44" fill="none" viewBox="0 0 180 180">
      <rect height="100" opacity="0.9" rx="12" stroke="white" strokeWidth="2" width="120" x="30" y="40" />
      <path d="M30 65h120" opacity="0.4" stroke="white" strokeWidth="1.5" />
      <rect fill="white" height="28" opacity="0.5" rx="4" width="36" x="45" y="78" />
      <rect fill="white" height="28" opacity="0.35" rx="4" width="36" x="90" y="78" />
      <rect fill="white" height="18" opacity="0.6" rx="3" width="50" x="45" y="115" />
      <circle cx="135" cy="55" fill="#93c5fd" r="6" />
      <path d="M50 52h40" opacity="0.5" stroke="white" strokeLinecap="round" strokeWidth="2" />
    </svg>
  )
}

function LeaderHeaderGraphic() {
  return (
    <svg aria-hidden="true" className="size-36 xl:size-44" fill="none" viewBox="0 0 180 180">
      <circle cx="90" cy="90" opacity="0.9" r="70" stroke="white" strokeWidth="2" />
      <circle cx="65" cy="80" fill="white" opacity="0.65" r="7" />
      <circle cx="95" cy="70" fill="white" opacity="0.45" r="5" />
      <circle cx="110" cy="95" fill="white" opacity="0.55" r="9" />
      <circle cx="75" cy="105" fill="white" opacity="0.4" r="4" />
      <path d="M40 130 L70 100 L95 115 L140 75" opacity="0.7" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
      <path d="M125 75 L140 75 L140 90" opacity="0.5" stroke="white" strokeLinecap="round" strokeWidth="2" />
    </svg>
  )
}

function SignOutIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
