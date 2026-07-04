import { create } from 'zustand'
import type { AuthSession } from '../types/auth'

const AUTH_STORAGE_KEY = 'jankendra-auth'

type AuthState = {
  session: AuthSession | null
  login: (session: AuthSession) => void
  setSession: (session: AuthSession) => void
  logout: () => void
  getAccessToken: () => string | null
}

function readStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as AuthSession
    if (!parsed.accessToken || !parsed.userId) return null
    return parsed
  } catch {
    return null
  }
}

function persistSession(session: AuthSession | null) {
  if (session) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
  } else {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: readStoredSession(),

  login: (session) => {
    persistSession(session)
    set({ session })
  },

  setSession: (session) => {
    persistSession(session)
    set({ session })
  },

  logout: () => {
    persistSession(null)
    set({ session: null })
  },

  getAccessToken: () => get().session?.accessToken ?? null,
}))
