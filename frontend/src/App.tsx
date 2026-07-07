import type { ReactNode } from 'react'
import { AppShell } from './components/AppShell'
import { AuthBootstrap } from './components/AuthBootstrap'
import { CitizenShell } from './components/CitizenShell'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useAuthStore } from './stores/useAuthStore'
import { useUiStore } from './stores/useUiStore'
import { LoginPage } from './pages/LoginPage'
import { CitizenDashboardPage } from './pages/portal/CitizenDashboardPage'
import { ComplaintConfirmationPage } from './pages/portal/ComplaintConfirmationPage'
import { MyComplaintsPage } from './pages/portal/MyComplaintsPage'
import { RaiseComplaintPage } from './pages/portal/RaiseComplaintPage'
import { CitizenProfilePage } from './pages/portal/CitizenProfilePage'
import { ComplaintDetailPage } from './pages/portal/ComplaintDetailPage'
import { WardUpdatesPage } from './pages/portal/WardUpdatesPage'

function CitizenPortal() {
  const citizenView = useUiStore((s) => s.citizenView)

  let page: ReactNode
  switch (citizenView) {
    case 'home':
      page = <CitizenDashboardPage />
      break
    case 'raise':
      page = (
        <ErrorBoundary label="Report issue">
          <RaiseComplaintPage />
        </ErrorBoundary>
      )
      break
    case 'my-complaints':
      page = <MyComplaintsPage />
      break
    case 'ward-updates':
      page = <WardUpdatesPage />
      break
    case 'confirmation':
      page = <ComplaintConfirmationPage />
      break
    case 'profile':
      page = <CitizenProfilePage />
      break
    case 'complaint-detail':
      page = (
        <ErrorBoundary label="Complaint details">
          <ComplaintDetailPage />
        </ErrorBoundary>
      )
      break
    default:
      page = (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm font-semibold text-muted">Unknown page. Returning to home…</p>
        </section>
      )
  }

  return <CitizenShell>{page}</CitizenShell>
}

function AppRoutes() {
  const session = useAuthStore((s) => s.session)

  if (!session) {
    return <LoginPage />
  }

  if (session.role === 'citizen') {
    return <CitizenPortal />
  }

  return <AppShell />
}

function App() {
  return (
    <AuthBootstrap>
      <AppRoutes />
    </AuthBootstrap>
  )
}

export default App
