import { useMemo } from 'react'
import { wardOptions } from '../data/wards'
import { localeLabels, type SupportedLocale } from '../i18n/config'
import { useAuthStore } from '../stores/useAuthStore'
import { useCitizenProfileStore, type CitizenProfileData } from '../stores/useCitizenProfileStore'
import { roleLabels } from '../types/auth'
import { useLocale } from './useLocale'

export type CitizenProfileForm = {
  displayName: string
  wardId: number | ''
  email: string
  notifySms: boolean
  notifyEmail: boolean
  locale: SupportedLocale
}

export type CitizenProfileView = CitizenProfileForm & {
  phone: string
  roleLabel: string
  constituencyName: string
  userId: string
  wardName: string | null
  localeLabel: string
  hasLocalEdits: boolean
  lastUpdated: string | null
}

function hasLocalProfileEdits(stored: CitizenProfileData): boolean {
  return Boolean(
    stored.displayName ||
      stored.wardId ||
      stored.email ||
      stored.notifySms !== undefined ||
      stored.notifyEmail !== undefined,
  )
}

export function useCitizenProfile() {
  const session = useAuthStore((s) => s.session)
  const setSession = useAuthStore((s) => s.setSession)
  const profiles = useCitizenProfileStore((s) => s.profiles)
  const updateProfile = useCitizenProfileStore((s) => s.updateProfile)
  const { locale, setLocale } = useLocale()

  const userId = session?.userId ?? ''
  const stored = profiles[userId] ?? {}

  const profile = useMemo((): CitizenProfileView | null => {
    if (!session) return null

    const ward = stored.wardId
      ? wardOptions.find((w) => w.id === stored.wardId) ?? null
      : null

    return {
      displayName: stored.displayName ?? session.name,
      wardId: stored.wardId ?? '',
      wardName: ward?.name ?? null,
      email: stored.email ?? '',
      notifySms: stored.notifySms ?? true,
      notifyEmail: stored.notifyEmail ?? false,
      locale,
      localeLabel: localeLabels[locale],
      phone: session.phone,
      roleLabel: roleLabels[session.role],
      constituencyName: session.constituencyName,
      userId: session.userId,
      hasLocalEdits: hasLocalProfileEdits(stored),
      lastUpdated: stored.updatedAt ?? null,
    }
  }, [session, stored, locale])

  const saveProfile = (form: CitizenProfileForm) => {
    if (!session) return

    updateProfile(userId, {
      displayName: form.displayName.trim(),
      wardId: form.wardId === '' ? undefined : form.wardId,
      email: form.email.trim() || undefined,
      notifySms: form.notifySms,
      notifyEmail: form.notifyEmail,
    })

    if (form.displayName.trim() !== session.name) {
      setSession({ ...session, name: form.displayName.trim() })
    }

    if (form.locale !== locale) {
      setLocale(form.locale)
    }
  }

  return { profile, saveProfile }
}
