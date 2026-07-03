import { PortalHeader } from './PortalHeader'
import { CitizenSidebar } from './citizen/CitizenSidebar'
import { useAuthStore } from '../stores/useAuthStore'
import { useCitizenShell } from '../hooks/useCitizenShell'
import { getRoleTheme } from '../theme/roleThemes'
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
  const theme = getRoleTheme('citizen')

  const handleNavSelect = (pageId: string) => {
    setCitizenView(pageId as CitizenView)
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.pageBg} text-slate-950 pb-20 lg:pb-0`}>
      <PortalHeader
        constituencyName={session?.constituencyName}
        onLogout={logout}
        phone={session?.phone}
        role="citizen"
      />

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[17.5rem_1fr] lg:px-8 xl:grid-cols-[19rem_1fr]">
        <div className="hidden lg:block">
          <CitizenSidebar
            activePageId={sidebarActiveId}
            constituencyName={session?.constituencyName}
            onSelect={handleNavSelect}
            pages={navigationPages}
          />
        </div>

        <main className={`min-w-0 rounded-3xl bg-gradient-to-br ${theme.mainBg} p-1 sm:p-2`}>
          {children}
        </main>
      </div>

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
                  isActive ? theme.mobileNavActive : 'text-muted'
                }`}
                key={item.id}
                onClick={() => handleNavSelect(item.id)}
                type="button"
              >
                <span className={`grid size-8 place-items-center rounded-xl text-sm font-bold ${
                  isActive ? theme.mobileNavActiveBg : ''
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
