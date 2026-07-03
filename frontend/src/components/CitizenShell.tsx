import { LanguageSwitcher } from './LanguageSwitcher'
import { useAuthStore } from '../stores/useAuthStore'
import { useUiStore } from '../stores/useUiStore'
import { roleLabels } from '../types/auth'

type Props = {
  children: React.ReactNode
}

export function CitizenShell({ children }: Props) {
  const session = useAuthStore((s) => s.session)
  const logout = useAuthStore((s) => s.logout)
  const citizenView = useUiStore((s) => s.citizenView)
  const setCitizenView = useUiStore((s) => s.setCitizenView)

  const navItems = [
    { id: 'home' as const, label: 'Home' },
    { id: 'raise' as const, label: 'Report issue' },
    { id: 'my-complaints' as const, label: 'My complaints' },
  ]

  return (
    <div className="min-h-svh text-ink">
      <header className="border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4">
          <div className="min-w-0">
            <p className="text-sm font-extrabold">Jankendra-AI</p>
            <p className="truncate text-xs text-muted">{session?.constituencyName}</p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="dark" />
            <span className="rounded-full bg-soft-blue px-3 py-1 text-xs font-bold text-primary">
              {roleLabels.citizen}
            </span>
            <button className="rounded-full border border-line px-3 py-1 text-xs font-bold text-muted" onClick={logout} type="button">
              Sign out
            </button>
          </div>
        </div>
        <nav aria-label="Citizen navigation" className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-4 pb-3">
          {navItems.map((item) => (
            <button
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
                citizenView === item.id || (item.id === 'home' && citizenView === 'confirmation')
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 text-muted hover:bg-slate-200'
              }`}
              key={item.id}
              onClick={() => setCitizenView(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  )
}
