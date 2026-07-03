import { messages } from '../i18n'
import { useAppShell } from '../hooks/useAppShell'
import { DashboardPage } from '../pages/DashboardPage'

export function AppShell() {
  const { activePage, navigationPages, setActivePageId } = useAppShell()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-700">
              {messages.en.scaffoldStatus}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              {messages.en.appName}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              {messages.en.appTagline}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            React + Vite + Tailwind
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[18rem_1fr] lg:px-8">
        <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="px-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Planned pages
          </h2>
          <nav className="mt-4 grid gap-2" aria-label="Primary">
            {navigationPages.map((page) => {
              const isActive = page.id === activePage.id

              return (
                <button
                  aria-current={isActive ? 'page' : undefined}
                  className={`rounded-2xl px-4 py-3 text-left transition ${
                    isActive
                      ? 'bg-slate-950 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  key={page.id}
                  onClick={() => setActivePageId(page.id)}
                  type="button"
                >
                  <span className="block text-sm font-semibold">
                    {page.label}
                  </span>
                  <span
                    className={`mt-1 block text-xs ${
                      isActive ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {page.phase}
                  </span>
                </button>
              )
            })}
          </nav>
        </aside>

        <main className="min-w-0">
          <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Selected workflow
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              {activePage.label}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {activePage.description}
            </p>
          </div>

          <DashboardPage />
        </main>
      </div>
    </div>
  )
}
