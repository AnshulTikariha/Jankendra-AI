import { create } from 'zustand'
import type { AuthSession, UserRole } from '../types/auth'

const AUTH_STORAGE_KEY = 'jankendra-auth'

type AuthState = {
  session: AuthSession | null
  login: (session: AuthSession) => void
  logout: () => void
}

function readStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  session: readStoredSession(),
  login: (session) => {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
    set({ session })
  },
  logout: () => {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    set({ session: null })
  },
}))

export function buildSession(role: UserRole, phone: string): AuthSession {
  const names: Record<UserRole, string> = {
    citizen: 'Resident',
    staff: 'Office Staff',
    leader: 'Hon. Representative',
  }
  return {
    role,
    phone,
    name: names[role],
    constituencyName: 'Demo Constituency',
  }
}
