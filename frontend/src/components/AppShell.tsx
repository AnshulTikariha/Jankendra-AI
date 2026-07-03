import { LanguageSwitcher } from './LanguageSwitcher'
import { useAuthStore } from '../stores/useAuthStore'
import { roleLabels } from '../types/auth'
import { useAppShell } from '../hooks/useAppShell'
import { DashboardPage } from '../pages/DashboardPage'

export function AppShell() {
  const session = useAuthStore((s) => s.session)
  const logout = useAuthStore((s) => s.logout)
  const { activePage, navigationPages, setActivePageId, role } = useAppShell()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-700">
              Constituency intelligence
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Jankendra-AI</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              {session?.constituencyName} · {roleLabels[role]}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <LanguageSwitcher variant="dark" />
            <span className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
              Built for public service
            </span>
            <button
              className="rounded-full border border-line px-4 py-2 text-sm font-bold text-muted transition hover:bg-slate-100"
              onClick={logout}
              type="button"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[18rem_1fr] lg:px-8">
        <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="px-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Workspace</h2>
          <nav aria-label="Primary" className="mt-4 grid gap-2">
            {navigationPages.map((page) => {
              const isActive = page.id === activePage.id
              return (
                <button
                  aria-current={isActive ? 'page' : undefined}
                  className={`rounded-2xl px-4 py-3 text-left transition ${
                    isActive ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  key={page.id}
                  onClick={() => setActivePageId(page.id)}
                  type="button"
                >
                  <span className="block text-sm font-semibold">{page.label}</span>
                  <span className={`mt-1 block text-xs ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                    {page.statusLabel}
                  </span>
                </button>
              )
            })}
          </nav>
        </aside>

        <main className="min-w-0">
          {activePage.id === 'dashboard' ? (
            <DashboardPage />
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="text-lg font-extrabold">{activePage.label}</p>
              <p className="mt-2 text-sm text-muted">{activePage.description}</p>
              <p className="mt-4 text-xs font-bold uppercase tracking-wide text-accent">Coming soon</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
