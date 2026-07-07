import {
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { requestOtp, verifyOtp } from '../api/auth'
import { ApiError } from '../api/errors'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { useLocale } from '../hooks/useLocale'
import { mapTokenResponse } from '../lib/authMappers'
import { useAuthStore } from '../stores/useAuthStore'
import type { UserRole } from '../types/auth'

const otpLength = 6
const demoOtp = '246810'
const exposeDemoOtp = import.meta.env.VITE_EXPOSE_DEMO_OTP !== 'false'
const roles: UserRole[] = ['citizen', 'staff', 'leader']
const demoPhones: Record<UserRole, string> = {
  citizen: '9876543212',
  staff: '9876543211',
  leader: '9876543210',
}
const philosophyKeys = ['localFirst', 'accountable', 'humanLed'] as const
const highlightKeys = ['access', 'verified', 'mobileFirst'] as const

type StatusKey = 'enterPhone' | 'invalidPhone' | 'otpSent' | 'sendingOtp' | 'verifyingOtp'

export function LoginPage() {
  const { t } = useTranslation(['auth', 'common'])
  useLocale()
  const login = useAuthStore((s) => s.login)

  const [selectedRole, setSelectedRole] = useState<UserRole>('citizen')
  const [phone, setPhone] = useState(demoPhones.citizen)
  const [otp, setOtp] = useState<string[]>(Array.from({ length: otpLength }, () => ''))
  const [hasRequestedOtp, setHasRequestedOtp] = useState(false)
  const [statusKey, setStatusKey] = useState<StatusKey>('enterPhone')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null)
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otpCopied, setOtpCopied] = useState(false)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const otpRefs = useRef<Array<HTMLInputElement | null>>([])

  const digitsOnly = useMemo(() => phone.replace(/\D/g, ''), [phone])
  const maskedPhone = digitsOnly.length >= 4 ? `+91 ***** **${digitsOnly.slice(-3)}` : t('auth:maskedPhoneDefault')
  const isPhoneValid = digitsOnly.length === 10
  const enteredOtp = otp.join('')
  const canVerify = enteredOtp.length === otpLength && !isVerifying
  const statusMessage = t(`auth:status.${statusKey}`)
  const selectedRoleLabel = t(`auth:roles.${selectedRole}`)

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role)
    const isDemoNumber = Object.values(demoPhones).includes(digitsOnly)
    if (!digitsOnly || isDemoNumber) {
      setPhone(demoPhones[role])
    }
  }

  const requestOtpCode = async () => {
    if (!isPhoneValid) {
      setStatusKey('invalidPhone')
      setErrorMessage(null)
      return
    }

    setIsSendingOtp(true)
    setErrorMessage(null)
    setStatusKey('sendingOtp')

    try {
      const response = await requestOtp(digitsOnly)
      setHasRequestedOtp(true)
      setOtp(Array.from({ length: otpLength }, () => ''))
      setDevOtpHint(response.dev_otp ?? (exposeDemoOtp ? demoOtp : null))
      setOtpCopied(false)
      setShowOtpModal(Boolean(response.dev_otp ?? (exposeDemoOtp ? demoOtp : null)))
      setStatusKey('otpSent')
      window.setTimeout(() => otpRefs.current[0]?.focus(), 80)
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : t('common:errors.generic'))
      setStatusKey('enterPhone')
    } finally {
      setIsSendingOtp(false)
    }
  }

  const handlePhoneSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void requestOtpCode()
  }

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const nextOtp = [...otp]
    nextOtp[index] = digit
    setOtp(nextOtp)
    if (digit && index < otpLength - 1) otpRefs.current[index + 1]?.focus()
  }

  const handleOtpKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      if (canVerify) void handleVerifyOtp()
    }
  }

  const handleOtpPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, otpLength).split('')
    if (!pasted.length) return
    setOtp(Array.from({ length: otpLength }, (_, i) => pasted[i] ?? ''))
    otpRefs.current[Math.min(pasted.length, otpLength) - 1]?.focus()
  }

  const handleVerifyOtp = async () => {
    if (!canVerify) return

    setIsVerifying(true)
    setErrorMessage(null)
    setStatusKey('verifyingOtp')

    try {
      const response = await verifyOtp(digitsOnly, enteredOtp, selectedRole)
      login(mapTokenResponse(response))
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : t('common:errors.generic'))
      setStatusKey('otpSent')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleChangeNumber = () => {
    setHasRequestedOtp(false)
    setOtp(Array.from({ length: otpLength }, () => ''))
    setDevOtpHint(null)
    setShowOtpModal(false)
    setOtpCopied(false)
    setErrorMessage(null)
    setStatusKey('enterPhone')
  }

  const handleAutofillOtp = () => {
    if (!devOtpHint) return
    const digits = devOtpHint.replace(/\D/g, '').slice(0, otpLength).split('')
    setOtp(Array.from({ length: otpLength }, (_, i) => digits[i] ?? ''))
    setShowOtpModal(false)
    window.setTimeout(() => otpRefs.current[Math.min(digits.length, otpLength) - 1]?.focus(), 80)
  }

  const handleCopyOtp = async () => {
    if (!devOtpHint) return
    try {
      await navigator.clipboard.writeText(devOtpHint)
      setOtpCopied(true)
      window.setTimeout(() => setOtpCopied(false), 2000)
    } catch {
      setOtpCopied(false)
    }
  }

  useEffect(() => {
    if (!showOtpModal) return
    const handleKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setShowOtpModal(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [showOtpModal])

  return (
    <main className="min-h-svh overflow-hidden px-2 py-3 text-ink sm:px-6 sm:py-6 lg:px-8">
      <section className="mx-auto grid w-full max-w-7xl items-start gap-5 lg:min-h-[calc(100svh-3rem)] lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-8">
        <div className="relative order-2 min-w-0 overflow-hidden rounded-[1.5rem] border border-white/40 bg-primary px-4 py-5 text-white shadow-2xl shadow-primary/20 sm:px-8 sm:py-10 lg:order-1 lg:min-h-[44rem] lg:rounded-[2rem] lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.25),transparent_24rem),linear-gradient(135deg,rgba(30,64,175,0.98),rgba(30,58,138,0.95)_54%,rgba(5,150,105,0.92))]" />
          <div className="absolute -right-24 top-12 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
          <div className="absolute -bottom-32 left-16 h-80 w-80 rounded-full bg-primary-light/30 blur-3xl" />

          <div className="relative z-10 flex min-h-full flex-col justify-between gap-6 lg:gap-10">
            <header className="flex min-w-0 items-center justify-between gap-2 sm:gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white/95 text-sm font-extrabold tracking-[-0.06em] text-primary shadow-xl shadow-slate-950/20 sm:size-12 sm:text-base">
                  JA
                </div>
                <div className="min-w-0">
                  <p className="text-base font-extrabold leading-tight tracking-tight sm:text-lg">
                    {t('common:appName')}
                  </p>
                  <p className="truncate text-xs leading-tight text-white/72 sm:text-sm">
                    {t('common:appTagline')}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <LanguageSwitcher />
                <span className="rounded-full border border-white/20 bg-white/10 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/80 sm:px-3 sm:text-xs sm:tracking-[0.18em]">
                  {t('common:productBadge')}
                </span>
              </div>
            </header>

            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-white/82 sm:text-xs">
                <span className="size-2 rounded-full bg-accent" />
                {t('auth:secureAccess')}
              </div>
              <h1 className="max-w-4xl text-[1.7rem] font-extrabold leading-[1.02] tracking-[-0.055em] sm:text-5xl lg:text-7xl">
                {t('auth:heroTitle')}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-white/78 sm:mt-5 sm:text-lg">
                {t('auth:heroDescription')}
              </p>
            </div>

            <div className="grid gap-2 sm:gap-3 md:grid-cols-3">
              {philosophyKeys.map((key) => (
                <article
                  className="rounded-2xl border border-white/16 bg-white/10 p-3 backdrop-blur sm:rounded-3xl sm:p-4"
                  key={key}
                >
                  <h2 className="text-sm font-extrabold text-white">{t(`auth:philosophy.${key}.title`)}</h2>
                  <p className="mt-1 text-xs leading-5 text-white/70 sm:mt-2 sm:text-sm">
                    {t(`auth:philosophy.${key}.detail`)}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="order-1 mx-auto min-w-0 w-full max-w-xl lg:order-2">
          <div className="min-w-0 rounded-[1.5rem] border border-line/80 bg-white/85 p-2 shadow-2xl shadow-primary/10 backdrop-blur-xl sm:rounded-[2rem] sm:p-4">
            <div className="min-w-0 rounded-[1.25rem] border border-line bg-card p-4 shadow-sm sm:rounded-[1.5rem] sm:p-7">
              <div className="mb-5 flex min-w-0 items-start justify-between gap-3 sm:mb-6 sm:gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent sm:text-sm">
                    {t('auth:mobileLogin')}
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold leading-tight tracking-[-0.04em] text-ink sm:text-3xl">
                    {t('auth:continueWithOtp')}
                  </h2>
                  <p className="mt-2 text-sm text-muted">{t('auth:loginSubtitle')}</p>
                </div>
                <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-soft-blue text-lg font-extrabold text-primary sm:size-12 sm:text-xl">
                  #
                </div>
              </div>

              {!hasRequestedOtp ? (
                <form className="min-w-0 space-y-5" onSubmit={handlePhoneSubmit}>
                  <div>
                    <p className="text-xs font-semibold text-muted">{t('auth:roles.preview')}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {roles.map((role) => (
                        <button
                          className={`rounded-full px-2.5 py-1 text-[0.7rem] font-bold transition sm:text-xs ${
                            selectedRole === role
                              ? 'bg-primary text-white shadow-sm'
                              : 'border border-line bg-slate-50 text-muted hover:border-primary-light hover:text-primary'
                          }`}
                          key={role}
                          onClick={() => handleRoleSelect(role)}
                          type="button"
                        >
                          {t(`auth:roles.${role}`)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="block min-w-0" htmlFor="mobile-number">
                    <span className="text-sm font-bold text-ink">{t('auth:mobileNumber')}</span>
                    <div className="mt-2 flex min-w-0 overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition focus-within:border-primary-light focus-within:ring-4 focus-within:ring-primary-light/15">
                      <span className="grid place-items-center border-r border-line bg-slate-50 px-3 text-sm font-extrabold text-primary sm:px-4">
                        +91
                      </span>
                      <input
                        className="min-w-0 flex-1 border-0 px-3 py-3.5 text-base font-semibold text-ink outline-none placeholder:text-slate-400 sm:px-4 sm:py-4"
                        id="mobile-number"
                        inputMode="numeric"
                        maxLength={10}
                        onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder={t('auth:mobilePlaceholder')}
                        type="tel"
                        value={phone}
                      />
                    </div>
                    <span className="mt-2 flex items-start gap-1.5 text-xs font-medium text-muted">
                      <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-accent/15 text-[0.6rem] font-bold text-accent">
                        i
                      </span>
                      {t('auth:demoPhoneNote')}
                    </span>
                  </label>

                  <button
                    className="flex w-full items-center justify-center rounded-full bg-primary px-5 py-3.5 text-base font-extrabold text-white shadow-xl shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:bg-slate-300 disabled:shadow-none sm:py-4"
                    disabled={!isPhoneValid || isSendingOtp}
                    type="submit"
                  >
                    {isSendingOtp ? t('auth:status.sendingOtp') : t('auth:sendOtp')}
                  </button>
                </form>
              ) : (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-soft-blue bg-soft-blue/70 p-4">
                    <div className="flex min-w-0 items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                          {t('auth:otpSentTo')}
                        </p>
                        <p className="mt-1 font-extrabold text-ink">{maskedPhone}</p>
                        <p className="mt-1 text-xs text-muted">
                          {t('auth:signingInAs', { role: selectedRoleLabel })}
                        </p>
                      </div>
                      <button
                        className="rounded-full border border-primary/20 bg-white px-3 py-2 text-xs font-extrabold text-primary transition hover:border-primary-light hover:bg-white"
                        onClick={handleChangeNumber}
                        type="button"
                      >
                        {t('common:change')}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-ink" htmlFor="otp-0">
                      {t('auth:enterOtp')}
                    </label>
                    <div className="mt-3 grid min-w-0 grid-cols-6 gap-1 sm:gap-3">
                      {otp.map((digit, index) => (
                        <input
                          aria-label={t('auth:otpDigit', { index: index + 1 })}
                          className="aspect-square min-w-0 rounded-lg border border-line bg-white text-center text-lg font-extrabold text-ink shadow-sm outline-none transition focus:border-primary-light focus:ring-4 focus:ring-primary-light/15 sm:rounded-2xl sm:text-xl"
                          id={`otp-${index}`}
                          inputMode="numeric"
                          key={`otp-${index}`}
                          maxLength={1}
                          onChange={(event) => handleOtpChange(index, event.target.value)}
                          onKeyDown={(event) => handleOtpKeyDown(index, event)}
                          onPaste={handleOtpPaste}
                          ref={(element) => {
                            otpRefs.current[index] = element
                          }}
                          type="text"
                          value={digit}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    className="flex w-full items-center justify-center rounded-full bg-primary px-5 py-3.5 text-base font-extrabold text-white shadow-xl shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:bg-slate-300 disabled:shadow-none sm:py-4"
                    disabled={!canVerify}
                    onClick={() => void handleVerifyOtp()}
                    type="button"
                  >
                    {isVerifying ? t('auth:status.verifyingOtp') : t('auth:verifyAndContinue')}
                  </button>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <button
                      className="font-extrabold text-primary transition hover:text-primary-dark disabled:opacity-50"
                      disabled={isSendingOtp}
                      onClick={() => void requestOtpCode()}
                      type="button"
                    >
                      {t('auth:resendOtp')}
                    </button>
                    {devOtpHint && (
                      <button
                        className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-bold text-accent transition hover:bg-accent/20"
                        onClick={() => setShowOtpModal(true)}
                        type="button"
                      >
                        <span className="size-1.5 animate-pulse rounded-full bg-accent" />
                        {t('auth:demoOtp.reopen')}
                      </button>
                    )}
                  </div>
                </div>
              )}

              <p
                className={`mt-5 break-words rounded-2xl border px-4 py-3 text-sm font-semibold ${
                  errorMessage
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : 'border-line bg-slate-50 text-muted'
                }`}
                role="status"
              >
                {errorMessage ?? statusMessage}
              </p>
            </div>
          </div>

          <div className="mt-3 grid gap-2 sm:mt-5 sm:gap-3 sm:grid-cols-3">
            {highlightKeys.map((key) => (
              <div
                className="rounded-2xl border border-line bg-white/80 px-4 py-3 text-sm font-bold text-muted shadow-sm"
                key={key}
              >
                {t(`auth:highlights.${key}`)}
              </div>
            ))}
          </div>
        </div>
      </section>

      {showOtpModal && devOtpHint && (
        <DemoOtpModal
          code={devOtpHint}
          copied={otpCopied}
          onAutofill={handleAutofillOtp}
          onClose={() => setShowOtpModal(false)}
          onCopy={() => void handleCopyOtp()}
        />
      )}
    </main>
  )
}

type DemoOtpModalProps = {
  code: string
  copied: boolean
  onAutofill: () => void
  onClose: () => void
  onCopy: () => void
}

function DemoOtpModal({ code, copied, onAutofill, onClose, onCopy }: DemoOtpModalProps) {
  const { t } = useTranslation(['auth', 'common'])
  const digits = code.replace(/\D/g, '').split('')

  return (
    <div
      aria-labelledby="demo-otp-title"
      aria-modal="true"
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      role="dialog"
    >
      <button
        aria-label={t('common:close')}
        className="absolute inset-0 cursor-default bg-slate-950/55 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />

      <div className="animate-modal-pop relative w-full max-w-md overflow-hidden rounded-[1.75rem] border border-white/60 bg-white shadow-2xl shadow-primary/25">
        <div className="relative overflow-hidden bg-[linear-gradient(135deg,rgba(30,64,175,0.98),rgba(5,150,105,0.95))] px-6 py-6 text-white">
          <div className="absolute -right-10 -top-12 size-40 rounded-full bg-white/15 blur-2xl" />
          <div className="absolute -bottom-16 left-8 size-40 rounded-full bg-accent/25 blur-2xl" />
          <div className="relative flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em]">
              <span className="size-1.5 animate-pulse rounded-full bg-accent" />
              {t('auth:demoOtp.badge')}
            </span>
            <button
              aria-label={t('common:close')}
              className="grid size-8 place-items-center rounded-full bg-white/15 text-lg font-bold leading-none text-white transition hover:bg-white/25"
              onClick={onClose}
              type="button"
            >
              ×
            </button>
          </div>
          <h3 className="relative mt-4 text-xl font-extrabold tracking-tight" id="demo-otp-title">
            {t('auth:demoOtp.title')}
          </h3>
          <p className="relative mt-1 text-sm text-white/80">{t('auth:demoOtp.subtitle')}</p>
        </div>

        <div className="px-6 py-6">
          <div className="flex justify-center gap-2 sm:gap-2.5">
            {digits.map((digit, index) => (
              <span
                className="grid size-11 place-items-center rounded-xl border border-primary/20 bg-soft-blue text-2xl font-extrabold text-primary shadow-sm sm:size-12"
                key={`demo-otp-${index}`}
              >
                {digit}
              </span>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <button
              className="flex flex-1 items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary-dark"
              onClick={onAutofill}
              type="button"
            >
              {t('auth:demoOtp.autofill')}
            </button>
            <button
              className="flex items-center justify-center gap-1.5 rounded-full border border-line bg-white px-5 py-3 text-sm font-extrabold text-primary transition hover:border-primary-light hover:bg-slate-50"
              onClick={onCopy}
              type="button"
            >
              {copied ? t('auth:demoOtp.copied') : t('auth:demoOtp.copy')}
            </button>
          </div>

          <button
            className="mt-3 w-full text-center text-xs font-bold text-muted transition hover:text-ink"
            onClick={onClose}
            type="button"
          >
            {t('auth:demoOtp.dismiss')}
          </button>
        </div>
      </div>
    </div>
  )
}
