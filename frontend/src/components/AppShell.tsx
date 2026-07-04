import { PortalHeader } from './PortalHeader'
import { AppSidebar } from './AppSidebar'
import { useAuthStore } from '../stores/useAuthStore'
import { useAppShell } from '../hooks/useAppShell'
import { getRoleTheme } from '../theme/roleThemes'
import { DashboardPage } from '../pages/DashboardPage'
import { TodoPage } from '../pages/staff/TodoPage'
import { CommitmentsPage } from '../pages/staff/CommitmentsPage'
import { DevelopmentPlanPage } from '../pages/staff/DevelopmentPlanPage'
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
  const pageContent = StaffMainContent({ pageId: activePage.id })

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.pageBg} text-slate-950`}>
      <PortalHeader
        constituencyName={session?.constituencyName}
        onLogout={logout}
        phone={session?.phone}
        role={role}
      />

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[17.5rem_1fr] lg:px-8 xl:grid-cols-[19rem_1fr]">
        <AppSidebar
          activePageId={activePage.id}
          constituencyName={session?.constituencyName}
          onSelect={setActivePageId}
          pages={navigationPages}
          role={role}
        />

        <main className={`min-w-0 rounded-3xl bg-gradient-to-br ${theme.mainBg} p-1 sm:p-2`}>
          {pageContent ?? (
            <ComingSoonPanel description={activePage.description} label={activePage.label} />
          )}
        </main>
      </div>
    </div>
  )
}
