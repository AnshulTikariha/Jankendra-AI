export const supportedLocales = ['en', 'hi'] as const

export type SupportedLocale = (typeof supportedLocales)[number]

export const defaultLocale: SupportedLocale = 'en'

export const LOCALE_STORAGE_KEY = 'jankendra-locale'

export const localeLabels: Record<SupportedLocale, string> = {
  en: 'English',
  hi: 'हिन्दी',
}

export const localeHtmlLang: Record<SupportedLocale, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
}

export function isSupportedLocale(value: string): value is SupportedLocale {
  return supportedLocales.includes(value as SupportedLocale)
}

export function readStoredLocale(): SupportedLocale {
  if (typeof window === 'undefined') return defaultLocale
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY)
  if (stored && isSupportedLocale(stored)) return stored
  const browserLang = window.navigator.language.slice(0, 2)
  if (isSupportedLocale(browserLang)) return browserLang
  return defaultLocale
}
