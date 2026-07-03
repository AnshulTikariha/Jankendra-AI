import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  localeLabels,
  supportedLocales,
  type SupportedLocale,
} from '../i18n/config'
import { useLocale } from '../hooks/useLocale'

type Variant = 'light' | 'dark'

const triggerVariants: Record<Variant, string> = {
  light:
    'border-white/25 bg-white/12 text-white hover:bg-white/22 focus-visible:ring-white/40',
  dark: 'border-line bg-white text-ink hover:border-primary-light focus-visible:ring-primary-light/25',
}

const menuVariants: Record<Variant, string> = {
  light:
    'border-white/15 bg-slate-950/92 text-white shadow-2xl shadow-black/30 backdrop-blur-xl',
  dark: 'border-line bg-white text-ink shadow-2xl shadow-primary/10',
}

const optionActive: Record<Variant, string> = {
  light: 'bg-white/18 text-white',
  dark: 'bg-soft-blue text-primary',
}

const optionIdle: Record<Variant, string> = {
  light: 'text-white/85 hover:bg-white/12',
  dark: 'text-ink hover:bg-slate-100',
}

type Props = {
  variant?: Variant
}

export function LanguageSwitcher({ variant = 'light' }: Props) {
  const { t } = useTranslation('common')
  const { locale, setLocale } = useLocale()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const handlePointer = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [isOpen])

  const handleSelect = (nextLocale: SupportedLocale) => {
    setLocale(nextLocale)
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={t('language')}
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition focus:outline-none focus-visible:ring-4 sm:text-sm ${triggerVariants[variant]}`}
        onClick={() => setIsOpen((open) => !open)}
        ref={triggerRef}
        type="button"
      >
        <GlobeIcon />
        <span className="min-w-0 truncate">{localeLabels[locale]}</span>
        <ChevronIcon isOpen={isOpen} />
      </button>

      {isOpen && (
        <ul
          aria-label={t('language')}
          className={`absolute right-0 top-full z-50 mt-2 min-w-[11rem] overflow-hidden rounded-2xl border p-1 ${menuVariants[variant]}`}
          role="listbox"
        >
          {supportedLocales.map((supportedLocale) => {
            const isSelected = supportedLocale === locale
            return (
              <li aria-selected={isSelected} key={supportedLocale} role="option">
                <button
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                    isSelected ? optionActive[variant] : optionIdle[variant]
                  }`}
                  onClick={() => handleSelect(supportedLocale)}
                  type="button"
                >
                  <span>{localeLabels[supportedLocale]}</span>
                  {isSelected && <CheckIcon />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function GlobeIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c3 3.5 3 14.5 0 18" />
      <path d="M12 3c-3 3.5-3 14.5 0 18" />
    </svg>
  )
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`size-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M5 12l5 5L20 7" />
    </svg>
  )
}
