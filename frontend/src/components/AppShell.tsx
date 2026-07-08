import { useEffect, useState } from 'react'
import { PortalHeader } from './PortalHeader'
import { AppSidebar } from './AppSidebar'
import { WorkspaceMobileNav } from './WorkspaceMobileNav'
import { useAuthStore } from '../stores/useAuthStore'
import { useAppShell } from '../hooks/useAppShell'
import { getRoleTheme } from '../theme/roleThemes'
import { DashboardPage } from '../pages/DashboardPage'
import { TodoPage } from '../pages/staff/TodoPage'
import { CommitmentsPage } from '../pages/staff/CommitmentsPage'
import { DevelopmentPlanPage } from '../pages/staff/DevelopmentPlanPage'
import { ComplaintInsightsPage } from '../pages/staff/ComplaintInsightsPage'
import { LogIssuePage } from '../pages/staff/LogIssuePage'
import { DigestPage } from '../pages/staff/DigestPage'
import { ProfilePage } from '../pages/staff/ProfilePage'
import { ComplaintsQueuePage } from '../pages/staff/ComplaintsQueuePage'

function ComingSoonPanel({ label, description }: { label: string; description: string }) {
  return (
    <div className="flex min-h-[20rem] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300/80 bg-white/80 p-8 text-center shadow-sm">
      <div className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-2xl font-extrabold text-slate-400">
        ◇
      </div>
      <p className="mt-4 text-lg font-extrabold">{label}</p>
      <p className="mt-2 max-w-md text-sm text-muted">{description}</p>
      <span className="mt-4 rounded-full bg-amber-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-amber-800">
        Coming soon
      </span>
    </div>
  )
}

function StaffMainContent({ pageId }: { pageId: string }) {
  switch (pageId) {
    case 'dashboard':
      return <DashboardPage />
    case 'todo':
      return <TodoPage />
    case 'complaints-queue':
      return <ComplaintsQueuePage />
    case 'commitments':
      return <CommitmentsPage />
    case 'development-plan':
      return <DevelopmentPlanPage />
    case 'complaint-insights':
      return <ComplaintInsightsPage />
    case 'log-issue':
      return <LogIssuePage />
    case 'digest':
      return <DigestPage />
    case 'profile':
      return <ProfilePage />
    default:
      return null
  }
}

export function AppShell() {
  const session = useAuthStore((s) => s.session)
  const logout = useAuthStore((s) => s.logout)
  const { activePage, navigationPages, setActivePageId, role } = useAppShell()
  const theme = getRoleTheme(role)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    setSidebarOpen(false)
  }, [activePage.id])

  useEffect(() => {
    if (!sidebarOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [sidebarOpen])

  const pageContent = StaffMainContent({ pageId: activePage.id })

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.pageBg} pb-20 text-slate-950 lg:pb-0`}>
      <PortalHeader
        compactOnMobile
        constituencyName={session?.constituencyName}
        onLogout={logout}
        onMenuClick={() => setSidebarOpen(true)}
        phone={session?.phone}
        role={role}
      />

      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:gap-6 sm:px-6 sm:py-6 lg:grid-cols-[17.5rem_1fr] lg:px-8 xl:grid-cols-[19rem_1fr]">
        <div className="hidden lg:block">
          <AppSidebar
            activePageId={activePage.id}
            constituencyName={session?.constituencyName}
            onSelect={setActivePageId}
            pages={navigationPages}
            role={role}
          />
        </div>

        <main className={`min-w-0 rounded-3xl bg-gradient-to-br ${theme.mainBg} p-1 sm:p-2`}>
          {pageContent ?? (
            <ComingSoonPanel description={activePage.description} label={activePage.label} />
          )}
        </main>
      </div>

      {sidebarOpen && (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[1px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
          type="button"
        />
      )}
      <div
        aria-hidden={!sidebarOpen}
        className={`fixed inset-y-0 left-0 z-50 w-[min(88vw,19rem)] p-3 transition-transform duration-300 ease-out lg:hidden ${
          sidebarOpen ? 'translate-x-0' : 'pointer-events-none -translate-x-full'
        }`}
      >
        <AppSidebar
          activePageId={activePage.id}
          className="h-full shadow-2xl"
          constituencyName={session?.constituencyName}
          onClose={() => setSidebarOpen(false)}
          onSelect={setActivePageId}
          pages={navigationPages}
          role={role}
        />
      </div>

      <WorkspaceMobileNav
        activePageId={activePage.id}
        menuOpen={sidebarOpen}
        onMenuOpen={() => setSidebarOpen((open) => !open)}
        onSelect={setActivePageId}
        role={role}
      />
    </div>
  )
}
