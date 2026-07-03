import { LanguageSwitcher } from './LanguageSwitcher'
import { CitizenSidebar } from './citizen/CitizenSidebar'
import { useAuthStore } from '../stores/useAuthStore'
import { roleLabels } from '../types/auth'
import { useCitizenShell } from '../hooks/useCitizenShell'
import type { CitizenView } from '../stores/useUiStore'

type Props = {
  children: React.ReactNode
}

const mobileNavItems = [
  { id: 'home' as const, label: 'Home', icon: '⌂' },
  { id: 'raise' as const, label: 'Report', icon: '＋' },
  { id: 'my-complaints' as const, label: 'My issues', icon: '☰' },
]

export function CitizenShell({ children }: Props) {
  const session = useAuthStore((s) => s.session)
  const logout = useAuthStore((s) => s.logout)
  const { navigationPages, setCitizenView, sidebarActiveId } = useCitizenShell()

  const handleNavSelect = (pageId: string) => {
    setCitizenView(pageId as CitizenView)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-teal-50/30 text-slate-950 pb-20 lg:pb-0">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-700">
              Citizen portal
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Your voice matters</h1>
            <p className="mt-1 text-sm text-muted">
              {session?.constituencyName} · {roleLabels.citizen}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <LanguageSwitcher variant="dark" />
            <span className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-800">
              Built for public service
            </span>
            <button
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-bold text-muted shadow-sm transition hover:border-teal-300 hover:text-teal-700"
              onClick={logout}
              type="button"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[17.5rem_1fr] lg:px-8 xl:grid-cols-[19rem_1fr]">
        <div className="hidden lg:block">
          <CitizenSidebar
            activePageId={sidebarActiveId}
            constituencyName={session?.constituencyName}
            onSelect={handleNavSelect}
            pages={navigationPages}
          />
        </div>

        <main className="min-w-0 rounded-3xl bg-gradient-to-br from-slate-100/80 via-white to-teal-50/20 p-1 sm:p-2">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Citizen mobile navigation"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-white/95 backdrop-blur-md lg:hidden"
      >
        <div className="mx-auto flex max-w-lg">
          {mobileNavItems.map((item) => {
            const isActive = sidebarActiveId === item.id
            return (
              <button
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-1 flex-col items-center gap-1 py-3 text-center transition ${
                  isActive ? 'text-teal-700' : 'text-muted'
                }`}
                key={item.id}
                onClick={() => handleNavSelect(item.id)}
                type="button"
              >
                <span className={`grid size-8 place-items-center rounded-xl text-sm font-bold ${
                  isActive ? 'bg-teal-100' : ''
                }`}>
                  {item.icon}
                </span>
                <span className="text-[0.65rem] font-bold">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
