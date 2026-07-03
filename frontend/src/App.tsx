import { AppShell } from './components/AppShell'
import { CitizenShell } from './components/CitizenShell'
import { useAuthStore } from './stores/useAuthStore'
import { useUiStore } from './stores/useUiStore'
import { LoginPage } from './pages/LoginPage'
import { CitizenHomePage } from './pages/portal/CitizenHomePage'
import { ComplaintConfirmationPage } from './pages/portal/ComplaintConfirmationPage'
import { MyComplaintsPage } from './pages/portal/MyComplaintsPage'
import { RaiseComplaintPage } from './pages/portal/RaiseComplaintPage'

function CitizenPortal() {
  const citizenView = useUiStore((s) => s.citizenView)

  return (
    <CitizenShell>
      {citizenView === 'home' && <CitizenHomePage />}
      {citizenView === 'raise' && <RaiseComplaintPage />}
      {citizenView === 'my-complaints' && <MyComplaintsPage />}
      {citizenView === 'confirmation' && <ComplaintConfirmationPage />}
    </CitizenShell>
  )
}

function App() {
  const session = useAuthStore((s) => s.session)

  if (!session) {
    return <LoginPage />
  }

  if (session.role === 'citizen') {
    return <CitizenPortal />
  }

  return <AppShell />
}

export default App
