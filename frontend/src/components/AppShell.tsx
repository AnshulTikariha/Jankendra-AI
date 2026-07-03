import { LanguageSwitcher } from './LanguageSwitcher'
import { AppSidebar } from './AppSidebar'
import { useAuthStore } from '../stores/useAuthStore'
import { roleLabels } from '../types/auth'
import { useAppShell } from '../hooks/useAppShell'
import { DashboardPage } from '../pages/DashboardPage'

export function AppShell() {
  const session = useAuthStore((s) => s.session)
  const logout = useAuthStore((s) => s.logout)
  const { activePage, navigationPages, setActivePageId, role } = useAppShell()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50/40 text-slate-950">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent">
              Constituency intelligence
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Governance command center</h1>
            <p className="mt-1 text-sm text-muted">
              {session?.constituencyName} · {roleLabels[role]}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <LanguageSwitcher variant="dark" />
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800">
              Built for public service
            </span>
            <button
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-bold text-muted shadow-sm transition hover:border-primary-light hover:text-primary"
              onClick={logout}
              type="button"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[17.5rem_1fr] lg:px-8 xl:grid-cols-[19rem_1fr]">
        <AppSidebar
          activePageId={activePage.id}
          constituencyName={session?.constituencyName}
          onSelect={setActivePageId}
          pages={navigationPages}
          role={role}
        />

        <main className="min-w-0 rounded-3xl bg-gradient-to-br from-slate-100/80 via-white to-blue-50/30 p-1 sm:p-2">
          {activePage.id === 'dashboard' ? (
            <DashboardPage />
          ) : (
            <div className="flex min-h-[20rem] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300/80 bg-white/80 p-8 text-center shadow-sm">
              <div className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-2xl font-extrabold text-slate-400">
                ◇
              </div>
              <p className="mt-4 text-lg font-extrabold">{activePage.label}</p>
              <p className="mt-2 max-w-md text-sm text-muted">{activePage.description}</p>
              <span className="mt-4 rounded-full bg-amber-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-amber-800">
                Coming soon
              </span>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
