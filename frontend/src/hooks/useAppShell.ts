import { useMemo } from 'react'
import { useAuthStore } from '../stores/useAuthStore'
import { useUiStore } from '../stores/useUiStore'
import { navigationPages } from '../types/navigation'

export function useAppShell() {
  const role = useAuthStore((s) => s.session?.role ?? 'staff')
  const activePageId = useUiStore((s) => s.activePageId)
  const setActivePageId = useUiStore((s) => s.setActivePageId)

  const pages = useMemo(
    () =>
      navigationPages
        .filter((page) => {
          if (page.staffOnly && role !== 'staff') return false
          if (page.leaderOnly && role !== 'leader') return false
          return true
        })
        .map((page) => ({
          ...page,
          statusLabel: page.available ? 'Available' : 'Coming soon',
        })),
    [role],
  )

  const activePage = useMemo(
    () => pages.find((page) => page.id === activePageId) ?? pages[0],
    [activePageId, pages],
  )

  return { activePage, navigationPages: pages, setActivePageId, role }
}
