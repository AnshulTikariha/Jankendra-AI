import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const VOICE_INTRO_SESSION_KEY = 'jankendra-voice-intro-shown'

export function wasVoiceIntroShownThisSession(): boolean {
  if (typeof window === 'undefined') return true
  return window.sessionStorage.getItem(VOICE_INTRO_SESSION_KEY) === '1'
}

export function markVoiceIntroShown(): void {
  window.sessionStorage.setItem(VOICE_INTRO_SESSION_KEY, '1')
}

type VoiceComplaintIntroModalProps = {
  onClose: () => void
  onTryVoice?: () => void
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <path d="M12 19v4M8 23h8" />
    </svg>
  )
}

export function VoiceComplaintIntroModal({ onClose, onTryVoice }: VoiceComplaintIntroModalProps) {
  const { t } = useTranslation(['complaints', 'common'])

  useEffect(() => {
    const handleKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleMicTap = () => {
    if (onTryVoice) {
      onTryVoice()
      return
    }
    onClose()
  }

  const tips = ['tip1', 'tip2'] as const

  return (
    <div
      aria-labelledby="voice-intro-title"
      aria-modal="true"
      className="fixed inset-0 z-[1000] flex items-center justify-center p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-[calc(0.75rem+env(safe-area-inset-top,0px))] sm:p-4"
      role="dialog"
    >
      <button
        aria-label={t('common:close')}
        className="absolute inset-0 cursor-default bg-slate-950/45 backdrop-blur-[2px]"
        onClick={onClose}
        type="button"
      />

      <div className="animate-modal-pop relative flex w-full max-w-sm max-h-[min(90dvh,calc(100dvh-1.5rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)))] flex-col overflow-hidden rounded-2xl border border-line/80 bg-white shadow-2xl">
        <div className="relative shrink-0 px-4 pb-1 pt-4 text-center">
          <button
            aria-label={t('common:close')}
            className="absolute right-3 top-3 grid size-7 place-items-center rounded-full border border-line bg-white text-base font-bold leading-none text-muted transition hover:bg-slate-50"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-teal-700">
            {t('complaints:raise.voiceIntro.badge')}
          </p>
          <h3 className="mt-1 text-base font-extrabold text-ink" id="voice-intro-title">
            {t('complaints:raise.voiceIntro.title')}
          </h3>
          <p className="mx-auto mt-1 max-w-[17rem] text-xs leading-5 text-muted">
            {t('complaints:raise.voiceIntro.subtitle')}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-center px-4 py-4 sm:py-5">
          <div className="relative grid size-32 place-items-center sm:size-36">
            <span
              aria-hidden="true"
              className="animate-mic-ring pointer-events-none absolute inset-0 rounded-full border-2 border-teal-400/70"
            />
            <span
              aria-hidden="true"
              className="animate-mic-ring-delayed pointer-events-none absolute inset-2 rounded-full border-2 border-emerald-400/50"
            />
            <button
              aria-label={t('complaints:raise.voiceIntro.tapToSpeak')}
              className="animate-mic-wiggle relative z-10 grid size-24 place-items-center rounded-full bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600 text-white shadow-[0_12px_32px_-8px_rgba(13,148,136,0.65)] ring-4 ring-teal-200/80 transition hover:scale-105 hover:shadow-[0_16px_36px_-6px_rgba(13,148,136,0.7)] active:scale-95 focus:outline-none focus:ring-4 focus:ring-teal-300/60 sm:size-28"
              onClick={handleMicTap}
              type="button"
            >
              <MicIcon className="size-10 sm:size-11" />
            </button>
          </div>

          <p className="mt-4 text-sm font-extrabold text-teal-800">
            {t('complaints:raise.voiceIntro.tapToSpeak')}
          </p>
          <p className="mt-0.5 text-[0.7rem] font-medium text-muted">
            {t('complaints:raise.voiceIntro.tapHint')}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-line/60 px-4 py-3">
          <ul className="space-y-1.5">
            {tips.map((key) => (
              <li className="flex gap-2 text-xs leading-5 text-ink" key={key}>
                <span aria-hidden="true" className="mt-1.5 size-1 shrink-0 rounded-full bg-teal-500" />
                <span>{t(`complaints:raise.voiceIntro.${key}`)}</span>
              </li>
            ))}
          </ul>

          <p className="mt-2.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-[0.7rem] font-semibold leading-5 text-blue-900">
            <span className="font-extrabold">{t('complaints:raise.voiceIntro.demoLabel')}</span>{' '}
            {t('complaints:raise.voiceIntro.demoNote')}
          </p>
        </div>

        <div className="shrink-0 border-t border-line/60 bg-slate-50/90 px-4 py-3 text-center">
          <button
            className="text-xs font-bold text-muted underline decoration-dotted underline-offset-2 transition hover:text-ink"
            onClick={onClose}
            type="button"
          >
            {t('complaints:raise.voiceIntro.skip')}
          </button>
        </div>
      </div>
    </div>
  )
}
