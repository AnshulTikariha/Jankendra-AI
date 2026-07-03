import {
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  useMemo,
  useRef,
  useState,
} from 'react'

const demoOtp = '246810'
const otpLength = demoOtp.length

const philosophyCards = [
  {
    title: 'Local-first confidence',
    detail: 'Designed around constituency data staying close, protected, and useful for daily decisions.',
  },
  {
    title: 'Accountable public service',
    detail: 'Every workflow points leaders and staff toward faster follow-up and clearer ownership.',
  },
  {
    title: 'Human-led intelligence',
    detail: 'AI supports governance judgment with signals, context, and audit-ready records.',
  },
]

const accessHighlights = [
  'Leader and staff access',
  'No API or SMS call in this POC',
  'Mobile-first at 320px and up',
]

function App() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState<string[]>(Array.from({ length: otpLength }, () => ''))
  const [hasRequestedOtp, setHasRequestedOtp] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [statusMessage, setStatusMessage] = useState('Enter your mobile number to generate a local demo OTP.')
  const otpRefs = useRef<Array<HTMLInputElement | null>>([])

  const digitsOnly = useMemo(() => phone.replace(/\D/g, ''), [phone])
  const maskedPhone = digitsOnly.length >= 4 ? `+91 ***** **${digitsOnly.slice(-3)}` : '+91 mobile number'
  const isPhoneValid = digitsOnly.length === 10
  const enteredOtp = otp.join('')
  const canVerify = enteredOtp.length === otpLength

  const requestLocalOtp = () => {
    if (!isPhoneValid) {
      setStatusMessage('Use a 10 digit mobile number for this POC login.')
      return
    }

    setHasRequestedOtp(true)
    setIsVerified(false)
    setOtp(Array.from({ length: otpLength }, () => ''))
    setStatusMessage(`POC OTP generated locally: ${demoOtp}. No SMS or API request was made.`)

    window.setTimeout(() => otpRefs.current[0]?.focus(), 80)
  }

  const handlePhoneSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    requestLocalOtp()
  }

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const nextOtp = [...otp]
    nextOtp[index] = digit
    setOtp(nextOtp)

    if (digit && index < otpLength - 1) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const pastedOtp = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, otpLength)
      .split('')

    if (pastedOtp.length === 0) {
      return
    }

    const nextOtp = Array.from({ length: otpLength }, (_, index) => pastedOtp[index] ?? '')
    setOtp(nextOtp)
    otpRefs.current[Math.min(pastedOtp.length, otpLength) - 1]?.focus()
  }

  const handleVerifyOtp = () => {
    if (enteredOtp !== demoOtp) {
      setIsVerified(false)
      setStatusMessage(`That OTP does not match the POC code. Use ${demoOtp} to continue.`)
      return
    }

    setIsVerified(true)
    setStatusMessage('OTP verified locally. This is a frontend-only POC success state.')
  }

  const handleChangeNumber = () => {
    setHasRequestedOtp(false)
    setIsVerified(false)
    setOtp(Array.from({ length: otpLength }, () => ''))
    setStatusMessage('Enter your mobile number to generate a local demo OTP.')
  }

  return (
    <main className="min-h-svh overflow-hidden px-4 py-6 text-ink sm:px-6 lg:px-8">
      <section className="mx-auto grid min-h-[calc(100svh-3rem)] w-full max-w-7xl items-center gap-8 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/40 bg-primary px-5 py-6 text-white shadow-2xl shadow-primary/20 sm:px-8 sm:py-10 lg:min-h-[44rem] lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.25),transparent_24rem),linear-gradient(135deg,rgba(30,64,175,0.98),rgba(30,58,138,0.95)_54%,rgba(5,150,105,0.92))]" />
          <div className="absolute -right-24 top-12 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
          <div className="absolute -bottom-32 left-16 h-80 w-80 rounded-full bg-primary-light/30 blur-3xl" />

          <div className="relative z-10 flex min-h-full flex-col justify-between gap-10">
            <header className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-2xl bg-white/95 font-extrabold tracking-[-0.06em] text-primary shadow-xl shadow-slate-950/20">
                  JA
                </div>
                <div>
                  <p className="text-lg font-extrabold tracking-tight">Jankendra-AI</p>
                  <p className="text-sm text-white/72">Constituency intelligence platform</p>
                </div>
              </div>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white/80">
                POC
              </span>
            </header>

            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white/82">
                <span className="size-2 rounded-full bg-accent" />
                Secure staff and leader access
              </div>
              <h1 className="max-w-4xl text-4xl font-extrabold leading-[0.98] tracking-[-0.055em] sm:text-5xl lg:text-7xl">
                AI for better constituency decisions.
              </h1>
              <p className="mt-5 max-w-2xl text-base text-white/78 sm:text-lg">
                A mobile OTP entry point for a local-first governance workspace where every
                complaint, commitment, and decision stays accountable.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {philosophyCards.map((card) => (
                <article
                  className="rounded-3xl border border-white/16 bg-white/10 p-4 backdrop-blur"
                  key={card.title}
                >
                  <h2 className="text-sm font-extrabold text-white">{card.title}</h2>
                  <p className="mt-2 text-sm text-white/70">{card.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-xl">
          <div className="rounded-[2rem] border border-line/80 bg-white/85 p-3 shadow-2xl shadow-primary/10 backdrop-blur-xl sm:p-4">
            <div className="rounded-[1.5rem] border border-line bg-card p-5 shadow-sm sm:p-7">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-accent">
                    Mobile login
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-ink sm:text-3xl">
                    Continue with OTP
                  </h2>
                  <p className="mt-2 text-sm text-muted">
                    Built for quick, verified access by constituency teams.
                  </p>
                </div>
                <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-soft-blue text-xl font-extrabold text-primary">
                  #
                </div>
              </div>

              {!hasRequestedOtp && (
                <form className="space-y-5" onSubmit={handlePhoneSubmit}>
                  <label className="block" htmlFor="mobile-number">
                    <span className="text-sm font-bold text-ink">Mobile number</span>
                    <div className="mt-2 flex overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition focus-within:border-primary-light focus-within:ring-4 focus-within:ring-primary-light/15">
                      <span className="grid place-items-center border-r border-line bg-slate-50 px-4 text-sm font-extrabold text-primary">
                        +91
                      </span>
                      <input
                        className="min-w-0 flex-1 border-0 px-4 py-4 text-base font-semibold text-ink outline-none placeholder:text-slate-400"
                        id="mobile-number"
                        inputMode="numeric"
                        maxLength={10}
                        onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="98765 43210"
                        type="tel"
                        value={phone}
                      />
                    </div>
                  </label>

                  <button
                    className="flex w-full items-center justify-center rounded-full bg-primary px-5 py-4 text-base font-extrabold text-white shadow-xl shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:bg-slate-300 disabled:shadow-none"
                    disabled={!isPhoneValid}
                    type="submit"
                  >
                    Send POC OTP
                  </button>
                </form>
              )}

              {hasRequestedOtp && !isVerified && (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-soft-blue bg-soft-blue/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                          OTP sent to
                        </p>
                        <p className="mt-1 font-extrabold text-ink">{maskedPhone}</p>
                      </div>
                      <button
                        className="rounded-full border border-primary/20 bg-white px-3 py-2 text-xs font-extrabold text-primary transition hover:border-primary-light hover:bg-white"
                        onClick={handleChangeNumber}
                        type="button"
                      >
                        Change
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-ink" htmlFor="otp-0">
                      Enter 6 digit OTP
                    </label>
                    <div className="mt-3 grid grid-cols-6 gap-2 sm:gap-3">
                      {otp.map((digit, index) => (
                        <input
                          aria-label={`OTP digit ${index + 1}`}
                          className="aspect-square min-w-0 rounded-2xl border border-line bg-white text-center text-xl font-extrabold text-ink shadow-sm outline-none transition focus:border-primary-light focus:ring-4 focus:ring-primary-light/15"
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
                    className="flex w-full items-center justify-center rounded-full bg-primary px-5 py-4 text-base font-extrabold text-white shadow-xl shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:bg-slate-300 disabled:shadow-none"
                    disabled={!canVerify}
                    onClick={handleVerifyOtp}
                    type="button"
                  >
                    Verify and continue
                  </button>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <button
                      className="font-extrabold text-primary transition hover:text-primary-dark"
                      onClick={requestLocalOtp}
                      type="button"
                    >
                      Resend local OTP
                    </button>
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-muted">
                      Demo code: {demoOtp}
                    </span>
                  </div>
                </div>
              )}

              {isVerified && (
                <div className="rounded-3xl border border-accent/20 bg-emerald-50 p-5">
                  <div className="grid size-12 place-items-center rounded-2xl bg-accent text-2xl font-extrabold text-white">
                    OK
                  </div>
                  <h3 className="mt-4 text-2xl font-extrabold tracking-[-0.04em] text-ink">
                    Access ready
                  </h3>
                  <p className="mt-2 text-sm text-muted">
                    The OTP was verified in the browser. Connect real auth endpoints later to issue
                    role-based JWT sessions.
                  </p>
                  <button
                    className="mt-5 rounded-full bg-white px-4 py-3 text-sm font-extrabold text-primary shadow-sm ring-1 ring-line transition hover:bg-soft-blue"
                    onClick={handleChangeNumber}
                    type="button"
                  >
                    Try another number
                  </button>
                </div>
              )}

              <p
                className="mt-5 rounded-2xl border border-line bg-slate-50 px-4 py-3 text-sm font-semibold text-muted"
                role="status"
              >
                {statusMessage}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {accessHighlights.map((highlight) => (
              <div
                className="rounded-2xl border border-line bg-white/80 px-4 py-3 text-sm font-bold text-muted shadow-sm"
                key={highlight}
              >
                {highlight}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
