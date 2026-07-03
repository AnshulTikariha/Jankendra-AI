export const supportedLocales = ['en', 'hi'] as const

export type SupportedLocale = (typeof supportedLocales)[number]

export const defaultLocale: SupportedLocale = 'en'

export const messages = {
  en: {
    appName: 'Jankendra-AI',
    appTagline:
      'Constituency intelligence for leaders and staff across every workflow.',
    scaffoldStatus: 'Phase 0 frontend scaffold',
  },
} as const
