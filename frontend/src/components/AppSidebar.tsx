import { roleLabels, type UserRole } from '../types/auth'
import type { NavigationPage } from '../types/navigation'

type NavPage = NavigationPage & { statusLabel: string }

type Props = {
  pages: NavPage[]
  activePageId: string
  role: UserRole
  constituencyName?: string
  onSelect: (pageId: string) => void
}

const navVisuals: Record<string, { gradient: string; icon: React.ReactNode }> = {
  dashboard: {
    gradient: 'from-blue-500 to-indigo-600',
    icon: <HomeIcon />,
  },
  todo: {
    gradient: 'from-emerald-500 to-teal-600',
    icon: <TodoIcon />,
  },
  commitments: {
    gradient: 'from-violet-500 to-purple-600',
    icon: <CommitmentIcon />,
  },
  'development-plan': {
    gradient: 'from-amber-500 to-orange-500',
    icon: <PlanIcon />,
  },
  'log-issue': {
    gradient: 'from-rose-500 to-pink-600',
    icon: <IssueIcon />,
  },
  'upload-meeting': {
    gradient: 'from-cyan-500 to-blue-500',
    icon: <UploadIcon />,
  },
  digest: {
    gradient: 'from-indigo-500 to-violet-600',
    icon: <DigestIcon />,
  },
  chat: {
    gradient: 'from-primary to-primary-light',
    icon: <ChatIcon />,
  },
  profile: {
    gradient: 'from-slate-600 to-slate-800',
    icon: <ProfileIcon />,
  },
  'context-injection': {
    gradient: 'from-teal-500 to-emerald-600',
    icon: <LibraryIcon />,
  },
}

export function AppSidebar({ pages, activePageId, role, constituencyName, onSelect }: Props) {
  const availableCount = pages.filter((p) => p.available).length

  return (
    <aside className="relative flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-lg shadow-slate-200/60">
      <div className="absolute -left-10 top-20 size-32 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -right-8 bottom-24 size-28 rounded-full bg-accent/10 blur-3xl" />

      {/* Header */}
      <div className="relative border-b border-slate-100 bg-gradient-to-br from-primary via-primary-dark to-accent px-4 py-5 text-white">
        <div className="absolute right-3 top-3 opacity-20">
          <SidebarGraphic />
        </div>
        <div className="relative flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-white/95 text-sm font-extrabold tracking-tight text-primary shadow-lg">
            JA
          </div>
          <div className="min-w-0">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/70">Workspace</p>
            <p className="truncate text-sm font-extrabold">Jankendra-AI</p>
          </div>
        </div>
        <p className="relative mt-3 truncate text-xs text-white/75">{constituencyName ?? 'Constituency'}</p>
      </div>

      {/* Role card */}
      <div className="relative mx-4 -mt-4 rounded-2xl border border-white/80 bg-white p-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className={`grid size-10 place-items-center rounded-xl bg-gradient-to-br ${
            role === 'leader' ? 'from-amber-500 to-orange-500' : 'from-blue-500 to-indigo-600'
          } text-xs font-extrabold text-white shadow-md`}>
            {role === 'leader' ? 'L' : 'S'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-muted">Signed in as</p>
            <p className="truncate font-extrabold text-ink">{roleLabels[role]}</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-emerald-700">
            {availableCount} live
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav aria-label="Primary" className="relative flex-1 space-y-1 overflow-y-auto px-3 py-4">
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
                  ? 'bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg shadow-slate-900/20'
                  : isDisabled
                    ? 'opacity-60 hover:bg-slate-50'
                    : 'hover:bg-slate-50'
              }`}
              key={page.id}
              onClick={() => onSelect(page.id)}
              type="button"
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-accent to-emerald-300" />
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
                  isActive ? 'text-slate-300' : 'text-muted'
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
                <span className={`size-2 shrink-0 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-emerald-500'}`} />
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="relative border-t border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50/50 p-4">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-3">
          <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-accent to-emerald-600 text-white shadow-md">
            <SignalIcon />
          </div>
          <div className="min-w-0">
            <p className="text-[0.65rem] font-bold uppercase tracking-wide text-muted">System status</p>
            <p className="text-xs font-extrabold text-ink">All engines operational</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

function SidebarGraphic() {
  return (
    <svg aria-hidden="true" className="size-16" fill="none" viewBox="0 0 64 64">
      <rect height="52" opacity="0.9" rx="8" stroke="white" strokeWidth="1.5" width="52" x="6" y="6" />
      <path d="M6 18h52M22 6v52" opacity="0.5" stroke="white" strokeWidth="1" />
      <circle cx="38" cy="32" fill="white" opacity="0.6" r="6" />
      <circle cx="48" cy="42" fill="white" opacity="0.4" r="4" />
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

function TodoIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01" strokeLinecap="round" />
    </svg>
  )
}

function CommitmentIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <path d="M9 5a2 2 0 014 0v0a2 2 0 01-4 0zM9 14l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PlanIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M4 18v-6l4-2 4 3 8-5v10H4z" strokeLinejoin="round" />
    </svg>
  )
}

function IssueIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5m0 3h.01" strokeLinecap="round" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 16V6m0 0l-4 4m4-4l4 4M5 18h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DigestIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M6 4h12v16H6z" />
      <path d="M9 8h6M9 12h6M9 16h4" strokeLinecap="round" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M6 8h12v8H9l-3 3V8z" strokeLinejoin="round" />
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

function LibraryIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M5 5h5v14H5a1 1 0 01-1-1V6a1 1 0 011-1zm8 0h5a1 1 0 011 1v12a1 1 0 01-1 1h-5V5z" />
    </svg>
  )
}

function SignalIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M4 16l4-4 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
