import { useMemo } from 'react'
import { useUiStore } from '../stores/useUiStore'
import { navigationPages } from '../types/navigation'

export function useAppShell() {
  const activePageId = useUiStore((state) => state.activePageId)
  const setActivePageId = useUiStore((state) => state.setActivePageId)

  const activePage = useMemo(
    () =>
      navigationPages.find((page) => page.id === activePageId) ??
      navigationPages[0],
    [activePageId],
  )

  return {
    activePage,
    navigationPages,
    setActivePageId,
  }
}
