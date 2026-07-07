import type { CitizenPage } from '../../types/citizenNavigation'
import { getRoleTheme } from '../../theme/roleThemes'

type NavPage = CitizenPage & { statusLabel: string }

type Props = {
  pages: NavPage[]
  activePageId: string
  constituencyName?: string
  onSelect: (pageId: string) => void
}

const navVisuals: Record<string, { gradient: string; icon: React.ReactNode }> = {
  home: { gradient: 'from-teal-500 to-emerald-600', icon: <HomeIcon /> },
  raise: { gradient: 'from-rose-500 to-pink-600', icon: <ReportIcon /> },
  'my-complaints': { gradient: 'from-blue-500 to-indigo-600', icon: <ListIcon /> },
  'ward-updates': { gradient: 'from-amber-500 to-orange-500', icon: <UpdatesIcon /> },
  profile: { gradient: 'from-slate-600 to-slate-800', icon: <ProfileIcon /> },
}

export function CitizenSidebar({ pages, activePageId, constituencyName, onSelect }: Props) {
  const availableCount = pages.filter((p) => p.available).length
  const theme = getRoleTheme('citizen')

  return (
    <aside className="relative flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-lg shadow-slate-200/60">
      <div className={`absolute -left-10 top-20 size-32 rounded-full ${theme.sidebarBlurOrb} blur-3xl`} />
      <div className={`absolute -right-8 bottom-24 size-28 rounded-full ${theme.sidebarBlurOrb2} blur-3xl`} />

      <div className={`relative border-b border-slate-100 bg-gradient-to-br ${theme.sidebarHeaderGradient} px-4 py-5 text-white`}>
        <div className="absolute right-3 top-3 opacity-20">
          <CommunityGraphic />
        </div>
        <div className="relative flex items-center gap-3">
          <div className={`grid size-11 place-items-center rounded-2xl bg-white/95 text-sm font-extrabold tracking-tight ${theme.sidebarLogoText} shadow-lg`}>
            JA
          </div>
          <div className="min-w-0">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/70">Citizen portal</p>
            <p className="truncate text-sm font-extrabold">Jankendra-AI</p>
          </div>
        </div>
        <p className="relative mt-3 truncate text-xs text-white/75">{constituencyName ?? 'Constituency'}</p>
      </div>

      <div className="relative mx-4 -mt-4 rounded-2xl border border-white/80 bg-white p-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className={`grid size-10 place-items-center rounded-xl bg-gradient-to-br ${theme.sidebarRoleAvatar} text-xs font-extrabold text-white shadow-md`}>
            GP
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-muted">Signed in as</p>
            <p className="truncate font-extrabold text-ink">General Public</p>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide ${theme.sidebarLiveBadge}`}>
            {availableCount} live
          </span>
        </div>
      </div>

      <nav aria-label="Citizen navigation" className="relative flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p className="px-2 pb-2 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-muted">Navigation</p>
        {pages.map((page) => {
          const isActive = page.id === activePageId
          const visual = navVisuals[page.id]
          const isDisabled = !page.available

          return (
            <button
              aria-current={isActive ? 'page' : undefined}
              className={`group relative flex w-full items-center gap-3 rounded-2xl px-2.5 py-2.5 text-left transition ${
                isActive
                  ? `bg-gradient-to-r ${theme.sidebarActiveNav} text-white shadow-lg`
                  : isDisabled
                    ? 'opacity-60 hover:bg-slate-50'
                    : 'hover:bg-slate-50'
              }`}
              key={page.id}
              onClick={() => onSelect(page.id)}
              type="button"
            >
              {isActive && (
                <span className={`absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b ${theme.sidebarActiveAccent}`} />
              )}
              <div
                className={`grid size-9 shrink-0 place-items-center rounded-xl shadow-sm transition group-hover:scale-105 ${
                  isActive
                    ? `bg-gradient-to-br ${visual?.gradient ?? 'from-slate-500 to-slate-700'} text-white`
                    : `bg-gradient-to-br ${visual?.gradient ?? 'from-slate-400 to-slate-600'} text-white opacity-80 group-hover:opacity-100`
                }`}
              >
                {visual?.icon}
              </div>
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{page.label}</span>
                <span className={`mt-0.5 block truncate text-[0.65rem] font-semibold ${
                  isActive ? theme.sidebarActiveSubtext : 'text-muted'
                }`}>
                  {page.statusLabel}
                </span>
              </div>
              {isDisabled ? (
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase ${
                  isActive ? 'bg-white/15 text-white/80' : 'bg-slate-100 text-slate-500'
                }`}>
                  Soon
                </span>
              ) : (
                <span className={`size-2 shrink-0 rounded-full ${theme.sidebarActiveDot}`} />
              )}
            </button>
          )
        })}
      </nav>

      <div className={`relative border-t border-slate-100 bg-gradient-to-r ${theme.sidebarFooterBg} p-4`}>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-3">
          <div className={`grid size-9 place-items-center rounded-xl bg-gradient-to-br ${theme.sidebarFooterIcon} text-white shadow-md`}>
            <ShieldIcon />
          </div>
          <div className="min-w-0">
            <p className="text-[0.65rem] font-bold uppercase tracking-wide text-muted">Your data</p>
            <p className="text-xs font-extrabold text-ink">Private & secure</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

function CommunityGraphic() {
  return (
    <svg aria-hidden="true" className="size-16" fill="none" viewBox="0 0 64 64">
      <circle cx="32" cy="24" opacity="0.8" r="8" stroke="white" strokeWidth="1.5" />
      <circle cx="18" cy="36" opacity="0.6" r="6" stroke="white" strokeWidth="1.5" />
      <circle cx="46" cy="36" opacity="0.6" r="6" stroke="white" strokeWidth="1.5" />
      <path d="M32 32 L18 42 M32 32 L46 42" opacity="0.5" stroke="white" strokeWidth="1" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z" strokeLinejoin="round" />
    </svg>
  )
}

function ReportIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01" strokeLinecap="round" />
    </svg>
  )
}

function UpdatesIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M4 18v-6l4-2 4 3 8-5v10H4z" strokeLinejoin="round" />
    </svg>
  )
}

function ProfileIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="3" />
      <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 3l8 4v6c0 4.4-3.6 8-8 8s-8-3.6-8-8V7l8-4z" strokeLinejoin="round" />
    </svg>
  )
}
