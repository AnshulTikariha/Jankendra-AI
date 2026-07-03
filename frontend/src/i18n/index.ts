import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { defaultLocale, readStoredLocale } from './config'
import enAuth from './locales/en/auth.json'
import enCommon from './locales/en/common.json'
import hiAuth from './locales/hi/auth.json'
import hiCommon from './locales/hi/common.json'

void i18n.use(initReactI18next).init({
  resources: {
    en: { auth: enAuth, common: enCommon },
    hi: { auth: hiAuth, common: hiCommon },
  },
  lng: readStoredLocale(),
  fallbackLng: defaultLocale,
  defaultNS: 'common',
  ns: ['common', 'auth'],
  interpolation: { escapeValue: false },
})

export { defaultLocale, localeHtmlLang, localeLabels, supportedLocales } from './config'
export type { SupportedLocale } from './config'
export default i18n
