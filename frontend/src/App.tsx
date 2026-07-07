import { AppShell } from './components/AppShell'
import { AuthBootstrap } from './components/AuthBootstrap'
import { CitizenShell } from './components/CitizenShell'
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

  return (
    <CitizenShell>
      {citizenView === 'home' && <CitizenDashboardPage />}
      {citizenView === 'raise' && <RaiseComplaintPage />}
      {citizenView === 'my-complaints' && <MyComplaintsPage />}
      {citizenView === 'ward-updates' && <WardUpdatesPage />}
      {citizenView === 'confirmation' && <ComplaintConfirmationPage />}
      {citizenView === 'profile' && <CitizenProfilePage />}
      {citizenView === 'complaint-detail' && <ComplaintDetailPage />}
    </CitizenShell>
  )
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
