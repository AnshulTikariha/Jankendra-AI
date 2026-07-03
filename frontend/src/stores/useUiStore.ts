import { create } from 'zustand'

type UiState = {
  activePageId: string
  setActivePageId: (pageId: string) => void
}

export const useUiStore = create<UiState>((set) => ({
  activePageId: 'dashboard',
  setActivePageId: (pageId) => set({ activePageId: pageId }),
}))
