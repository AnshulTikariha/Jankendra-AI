import { AppShell } from './components/AppShell'
import { AuthBootstrap } from './components/AuthBootstrap'
import { CitizenShell } from './components/CitizenShell'
import { useAuthStore } from './stores/useAuthStore'
import { useUiStore } from './stores/useUiStore'
import { useCitizenShell } from './hooks/useCitizenShell'
import { LoginPage } from './pages/LoginPage'
import { CitizenDashboardPage } from './pages/portal/CitizenDashboardPage'
import { ComplaintConfirmationPage } from './pages/portal/ComplaintConfirmationPage'
import { MyComplaintsPage } from './pages/portal/MyComplaintsPage'
import { RaiseComplaintPage } from './pages/portal/RaiseComplaintPage'
import { CitizenProfilePage } from './pages/portal/CitizenProfilePage'

function CitizenComingSoon({ label, description }: { label: string; description: string }) {
  return (
    <div className="flex min-h-[20rem] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300/80 bg-white/80 p-8 text-center shadow-sm">
      <div className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-100 text-2xl font-extrabold text-teal-500">
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

function CitizenPortal() {
  const citizenView = useUiStore((s) => s.citizenView)
  const { activePage } = useCitizenShell()

  const isComingSoon =
    citizenView === 'ward-updates' ||
    citizenView === 'help'

  return (
    <CitizenShell>
      {citizenView === 'home' && <CitizenDashboardPage />}
      {citizenView === 'raise' && <RaiseComplaintPage />}
      {citizenView === 'my-complaints' && <MyComplaintsPage />}
      {citizenView === 'confirmation' && <ComplaintConfirmationPage />}
      {citizenView === 'profile' && <CitizenProfilePage />}
      {isComingSoon && (
        <CitizenComingSoon description={activePage.description} label={activePage.label} />
      )}
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
