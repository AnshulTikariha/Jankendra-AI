import { getRoleTheme } from '../theme/roleThemes'
import type { UserRole } from '../types/auth'
import { getWorkspaceMobileNavItems } from '../lib/workspaceMobileNav'

type Props = {
  role: UserRole
  activePageId: string
  menuOpen: boolean
  onSelect: (pageId: string) => void
  onMenuOpen: () => void
}

export function WorkspaceMobileNav({
  role,
  activePageId,
  menuOpen,
  onSelect,
  onMenuOpen,
}: Props) {
  const theme = getRoleTheme(role)
  const items = getWorkspaceMobileNavItems(role)

  return (
    <nav
      aria-label="Workspace mobile navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-white/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md lg:hidden"
    >
      <div className="mx-auto flex max-w-lg">
        {items.map((item) => {
          const isMenu = item.menuTrigger === true
          const isActive = isMenu ? menuOpen : activePageId === item.id

          return (
            <button
              aria-current={isActive ? 'page' : undefined}
              aria-expanded={isMenu ? menuOpen : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-2.5 text-center transition ${
                isActive ? theme.mobileNavActive : 'text-muted'
              }`}
              key={item.id}
              onClick={() => (isMenu ? onMenuOpen() : onSelect(item.id))}
              type="button"
            >
              <span
                className={`grid size-8 place-items-center rounded-xl text-sm font-bold ${
                  isActive ? theme.mobileNavActiveBg : ''
                }`}
              >
                {item.icon}
              </span>
              <span className="w-full truncate text-[0.6rem] font-bold leading-tight sm:text-[0.65rem]">
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
