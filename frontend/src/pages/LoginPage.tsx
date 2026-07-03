import {
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { useLocale } from '../hooks/useLocale'
import { buildSession, useAuthStore } from '../stores/useAuthStore'
import type { UserRole } from '../types/auth'

const previewOtp = '246810'
const otpLength = previewOtp.length
const roles: UserRole[] = ['citizen', 'staff', 'leader']
const philosophyKeys = ['localFirst', 'accountable', 'humanLed'] as const
const highlightKeys = ['access', 'verified', 'mobileFirst'] as const

type StatusKey = 'enterPhone' | 'invalidPhone' | 'otpGenerated' | 'otpMismatch'

export function LoginPage() {
  const { t } = useTranslation(['auth', 'common'])
  useLocale()
  const login = useAuthStore((s) => s.login)

  const [selectedRole, setSelectedRole] = useState<UserRole>('citizen')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState<string[]>(Array.from({ length: otpLength }, () => ''))
  const [hasRequestedOtp, setHasRequestedOtp] = useState(false)
  const [statusKey, setStatusKey] = useState<StatusKey>('enterPhone')
  const otpRefs = useRef<Array<HTMLInputElement | null>>([])

  const digitsOnly = useMemo(() => phone.replace(/\D/g, ''), [phone])
  const maskedPhone = digitsOnly.length >= 4 ? `+91 ***** **${digitsOnly.slice(-3)}` : t('auth:maskedPhoneDefault')
  const isPhoneValid = digitsOnly.length === 10
  const enteredOtp = otp.join('')
  const canVerify = enteredOtp.length === otpLength
  const statusMessage = t(`auth:status.${statusKey}`, { otp: previewOtp })
  const selectedRoleLabel = t(`auth:roles.${selectedRole}`)

  const requestOtp = () => {
    if (!isPhoneValid) {
      setStatusKey('invalidPhone')
      return
    }
    setHasRequestedOtp(true)
    setOtp(Array.from({ length: otpLength }, () => ''))
    setStatusKey('otpGenerated')
    window.setTimeout(() => otpRefs.current[0]?.focus(), 80)
  }

  const handlePhoneSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    requestOtp()
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
  }

  const handleOtpPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, otpLength).split('')
    if (!pasted.length) return
    setOtp(Array.from({ length: otpLength }, (_, i) => pasted[i] ?? ''))
    otpRefs.current[Math.min(pasted.length, otpLength) - 1]?.focus()
  }

  const handleVerifyOtp = () => {
    if (enteredOtp !== previewOtp) {
      setStatusKey('otpMismatch')
      return
    }
    login(buildSession(selectedRole, digitsOnly))
  }

  const handleChangeNumber = () => {
    setHasRequestedOtp(false)
    setOtp(Array.from({ length: otpLength }, () => ''))
    setStatusKey('enterPhone')
  }

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
                          onClick={() => setSelectedRole(role)}
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
                  </label>

                  <button
                    className="flex w-full items-center justify-center rounded-full bg-primary px-5 py-3.5 text-base font-extrabold text-white shadow-xl shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:bg-slate-300 disabled:shadow-none sm:py-4"
                    disabled={!isPhoneValid}
                    type="submit"
                  >
                    {t('auth:sendOtp')}
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
                    onClick={handleVerifyOtp}
                    type="button"
                  >
                    {t('auth:verifyAndContinue')}
                  </button>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <button
                      className="font-extrabold text-primary transition hover:text-primary-dark"
                      onClick={requestOtp}
                      type="button"
                    >
                      {t('auth:resendOtp')}
                    </button>
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-muted">
                      {t('auth:previewCode', { code: previewOtp })}
                    </span>
                  </div>
                </div>
              )}

              <p
                className="mt-5 break-words rounded-2xl border border-line bg-slate-50 px-4 py-3 text-sm font-semibold text-muted"
                role="status"
              >
                {statusMessage}
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
    </main>
  )
}
