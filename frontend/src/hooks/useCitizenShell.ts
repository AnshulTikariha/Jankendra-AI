import { useMemo } from 'react'
import { useUiStore } from '../stores/useUiStore'
import { citizenPages, type CitizenPageId } from '../types/citizenNavigation'

export function useCitizenShell() {
  const citizenView = useUiStore((s) => s.citizenView)
  const setCitizenView = useUiStore((s) => s.setCitizenView)

  const pages = useMemo(
    () =>
      citizenPages.map((page) => ({
        ...page,
        statusLabel: page.available ? 'Available' : 'Coming soon',
      })),
    [],
  )

  const sidebarActiveId: CitizenPageId = useMemo(() => {
    if (citizenView === 'confirmation') return 'raise'
    if (citizenPages.some((p) => p.id === citizenView)) return citizenView as CitizenPageId
    return 'home'
  }, [citizenView])

  const activePage = useMemo(
    () => pages.find((page) => page.id === sidebarActiveId) ?? pages[0],
    [pages, sidebarActiveId],
  )

  return {
    activePage,
    citizenView,
    navigationPages: pages,
    setCitizenView,
    sidebarActiveId,
  }
}
