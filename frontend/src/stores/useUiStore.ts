import { create } from 'zustand'
import { readStoredLocale, type SupportedLocale } from '../i18n/config'

export type CitizenView = 'home' | 'raise' | 'my-complaints' | 'confirmation'

type UiState = {
  activePageId: string
  citizenView: CitizenView
  lastComplaintRef: string | null
  locale: SupportedLocale
  setActivePageId: (pageId: string) => void
  setCitizenView: (view: CitizenView) => void
  setLastComplaintRef: (ref: string | null) => void
  setLocale: (locale: SupportedLocale) => void
}

export const useUiStore = create<UiState>((set) => ({
  activePageId: 'dashboard',
  citizenView: 'home',
  lastComplaintRef: null,
  locale: readStoredLocale(),
  setActivePageId: (pageId) => set({ activePageId: pageId }),
  setCitizenView: (view) => set({ citizenView: view }),
  setLastComplaintRef: (ref) => set({ lastComplaintRef: ref }),
  setLocale: (locale) => set({ locale }),
}))
