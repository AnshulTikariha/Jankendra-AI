import { create } from 'zustand'
import { readStoredLocale, type SupportedLocale } from '../i18n/config'

export type CitizenView =
  | 'home'
  | 'raise'
  | 'my-complaints'
  | 'confirmation'
  | 'ward-updates'
  | 'help'
  | 'profile'

type UiState = {
  activePageId: string
  citizenView: CitizenView
  lastComplaintRef: string | null
  lastComplaintId: string | null
  locale: SupportedLocale
  setActivePageId: (pageId: string) => void
  setCitizenView: (view: CitizenView) => void
  setLastComplaintRef: (ref: string | null) => void
  setLastComplaintId: (id: string | null) => void
  setLocale: (locale: SupportedLocale) => void
}

export const useUiStore = create<UiState>((set) => ({
  activePageId: 'dashboard',
  citizenView: 'home',
  lastComplaintRef: null,
  lastComplaintId: null,
  locale: readStoredLocale(),
  setActivePageId: (pageId) => set({ activePageId: pageId }),
  setCitizenView: (view) => set({ citizenView: view }),
  setLastComplaintRef: (ref) => set({ lastComplaintRef: ref }),
  setLastComplaintId: (id) => set({ lastComplaintId: id }),
  setLocale: (locale) => set({ locale }),
}))
