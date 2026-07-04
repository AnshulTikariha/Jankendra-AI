import { create } from 'zustand'

const PROFILE_STORAGE_KEY = 'jankendra-citizen-profiles'

export type CitizenProfileData = {
  displayName?: string
  wardId?: number
  email?: string
  notifySms?: boolean
  notifyEmail?: boolean
  updatedAt?: string
}

type ProfilesMap = Record<string, CitizenProfileData>

type CitizenProfileState = {
  profiles: ProfilesMap
  getProfile: (userId: string) => CitizenProfileData
  updateProfile: (userId: string, patch: Omit<CitizenProfileData, 'updatedAt'>) => void
}

function readProfiles(): ProfilesMap {
  if (typeof window === 'undefined') return {}
  const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as ProfilesMap
  } catch {
    return {}
  }
}

function persistProfiles(profiles: ProfilesMap) {
  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles))
}

export function getStoredDisplayName(userId: string): string | undefined {
  return readProfiles()[userId]?.displayName
}

export const useCitizenProfileStore = create<CitizenProfileState>((set, get) => ({
  profiles: readProfiles(),

  getProfile: (userId) => get().profiles[userId] ?? {},

  updateProfile: (userId, patch) => {
    const next = {
      ...get().profiles,
      [userId]: {
        ...get().profiles[userId],
        ...patch,
        updatedAt: new Date().toISOString(),
      },
    }
    persistProfiles(next)
    set({ profiles: next })
  },
}))
