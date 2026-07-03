import { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LOCALE_STORAGE_KEY,
  localeHtmlLang,
  type SupportedLocale,
} from '../i18n/config'
import { useUiStore } from '../stores/useUiStore'

function applyDocumentLocale(locale: SupportedLocale) {
  document.documentElement.lang = localeHtmlLang[locale]
}

export function useLocale() {
  const { i18n } = useTranslation()
  const locale = useUiStore((state) => state.locale)
  const setLocaleInStore = useUiStore((state) => state.setLocale)

  useEffect(() => {
    applyDocumentLocale(locale)
    if (i18n.language !== locale) void i18n.changeLanguage(locale)
  }, [i18n, locale])

  const setLocale = useCallback(
    (nextLocale: SupportedLocale) => {
      setLocaleInStore(nextLocale)
      window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale)
      applyDocumentLocale(nextLocale)
      void i18n.changeLanguage(nextLocale)
    },
    [i18n, setLocaleInStore],
  )

  return { locale, setLocale }
}
