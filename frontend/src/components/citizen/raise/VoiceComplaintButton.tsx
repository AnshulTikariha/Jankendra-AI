import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { transcribeVoice } from '../../../api/voice'
import { ApiError } from '../../../api/errors'
import { useBrowserSpeechRecognition } from '../../../hooks/useBrowserSpeechRecognition'
import { useVoiceAnalyser } from '../../../hooks/useVoiceAnalyser'
import { useLocale } from '../../../hooks/useLocale'
import { getBrowserSpeechRecognitionCtor, shouldUseBrowserBackup, defaultBrowserSpeechLang, localeFromSpeechCode, storeSpeechLang, looksLikeHindi } from '../../../lib/browserSpeech'
import { friendlyVoiceError } from '../../../lib/voiceErrors'
import { useAuthStore } from '../../../stores/useAuthStore'
import { VoiceLevelBars } from './VoiceLevelBars'

type VoiceState = 'idle' | 'recording' | 'processing' | 'error'
type RecordingStrategy = 'hybrid' | 'cloud' | 'browser'

type VoiceComplaintButtonProps = {
  onTranscript: (text: string) => void
}

function pickRecorderMimeType(): string | undefined {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ]
  if (typeof MediaRecorder === 'undefined') {
    return undefined
  }
  return candidates.find((type) => MediaRecorder.isTypeSupported(type))
}

function formatElapsed(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
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

export function VoiceComplaintButton({ onTranscript }: VoiceComplaintButtonProps) {
  const { t } = useTranslation('complaints')
  const { locale, setLocale } = useLocale()
  const token = useAuthStore((state) => state.session?.accessToken)
  const [state, setState] = useState<VoiceState>('idle')
  const [strategy, setStrategy] = useState<RecordingStrategy>('hybrid')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [liveTranscript, setLiveTranscript] = useState('')
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const mimeTypeRef = useRef<string>('audio/webm')
  const browserTranscriptRef = useRef('')
  const liveTranscriptRef = useRef('')
  const strategyRef = useRef<RecordingStrategy>('hybrid')
  const [browserSpeechLang, setBrowserSpeechLang] = useState(defaultBrowserSpeechLang)
  const [analyserStream, setAnalyserStream] = useState<MediaStream | null>(null)

  const isRecording = state === 'recording'
  const isProcessing = state === 'processing'
  const panelOpen = isRecording || isProcessing
  const browserAssist =
    isRecording &&
    (strategy === 'browser' || strategy === 'hybrid') &&
    Boolean(getBrowserSpeechRecognitionCtor())

  const levels = useVoiceAnalyser(analyserStream, isRecording)

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setAnalyserStream(null)
  }, [])

  const clearTranscriptRefs = useCallback(() => {
    browserTranscriptRef.current = ''
    liveTranscriptRef.current = ''
    setLiveTranscript('')
  }, [])

  const getBrowserBackupTranscript = useCallback(
    () => browserTranscriptRef.current.trim() || liveTranscriptRef.current.trim(),
    [],
  )

  const handleSpeechError = useCallback(
    (code: string) => {
      if (code === 'unsupported' || code === 'no-speech') {
        return
      }
      if (code === 'not-allowed') {
        setErrorMessage(t('raise.voice.permissionDenied'))
        setState('error')
        stopStream()
      }
    },
    [stopStream, t],
  )

  const { stop: stopBrowserSpeech } = useBrowserSpeechRecognition({
    active: browserAssist,
    languageTag: browserSpeechLang,
    onInterim: (text) => {
      liveTranscriptRef.current = text
      setLiveTranscript(text)
    },
    onFinal: (text) => {
      browserTranscriptRef.current = text
      setLiveTranscript(text)
    },
    onError: handleSpeechError,
  })

  useEffect(() => () => stopStream(), [stopStream])

  useEffect(() => {
    if (!isRecording) {
      setElapsedSeconds(0)
      return
    }

    const startedAt = Date.now()
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000))
    }, 250)

    return () => window.clearInterval(timer)
  }, [isRecording])

  const setFriendlyError = useCallback(
    (raw: string) => {
      setErrorMessage(friendlyVoiceError(raw, t('raise.voice.error')))
    },
    [t],
  )

  const applyTranscript = useCallback(
    (transcript: string, detectedLanguage?: string | null) => {
      const resolvedLanguage =
        detectedLanguage ??
        (looksLikeHindi(transcript) ? 'hi-IN' : null)

      if (resolvedLanguage) {
        storeSpeechLang(resolvedLanguage)
        setBrowserSpeechLang(resolvedLanguage)
        const nextLocale = localeFromSpeechCode(resolvedLanguage)
        if (nextLocale && nextLocale !== locale) {
          setLocale(nextLocale)
        }
      }

      onTranscript(transcript)
      setErrorMessage(null)
      setState('idle')
      clearTranscriptRefs()
    },
    [clearTranscriptRefs, locale, onTranscript, setLocale],
  )

  const finishBrowserRecording = useCallback(() => {
    stopBrowserSpeech()
    stopStream()
    const transcript = getBrowserBackupTranscript()
    clearTranscriptRefs()

    if (transcript) {
      applyTranscript(transcript, looksLikeHindi(transcript) ? 'hi-IN' : 'en-IN')
      return
    }

    setErrorMessage(t('raise.voice.noSpeech'))
    setState('error')
  }, [applyTranscript, clearTranscriptRefs, getBrowserBackupTranscript, stopBrowserSpeech, stopStream, t])

  const uploadRecording = useCallback(
    async (blob: Blob) => {
      if (!token) {
        const backup = getBrowserBackupTranscript()
        if (shouldUseBrowserBackup(backup, strategyRef.current, locale)) {
          applyTranscript(
            backup,
            looksLikeHindi(backup) ? 'hi-IN' : 'en-IN',
          )
          return
        }
        setErrorMessage(t('raise.voice.notSignedIn'))
        setState('error')
        return
      }

      setState('processing')
      try {
        const result = await transcribeVoice(token, blob)
        applyTranscript(result.transcript, result.detected_language)
      } catch (err) {
        const backup = getBrowserBackupTranscript()
        if (shouldUseBrowserBackup(backup, strategyRef.current, locale)) {
          applyTranscript(
            backup,
            looksLikeHindi(backup) ? 'hi-IN' : 'en-IN',
          )
          return
        }

        const raw = err instanceof ApiError ? err.message : t('raise.voice.error')
        if (raw.includes('Speech-to-Text API') || raw.includes('SERVICE_DISABLED')) {
          setErrorMessage(t('raise.voice.apiDisabled'))
        } else {
          setFriendlyError(raw)
        }
        setState('error')
      }
    },
    [applyTranscript, getBrowserBackupTranscript, locale, setFriendlyError, t, token],
  )

  const startCloudRecorder = useCallback((stream: MediaStream, mimeType: string) => {
    chunksRef.current = []
    mimeTypeRef.current = mimeType

    const recorder = new MediaRecorder(stream, { mimeType })
    recorderRef.current = recorder

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data)
      }
    }

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current })
      chunksRef.current = []
      recorderRef.current = null
      stopBrowserSpeech()
      stopStream()
      if (blob.size > 0) {
        void uploadRecording(blob)
      } else {
        const backup = getBrowserBackupTranscript()
        clearTranscriptRefs()
        if (shouldUseBrowserBackup(backup, strategyRef.current, locale)) {
          applyTranscript(
            backup,
            looksLikeHindi(backup) ? 'hi-IN' : 'en-IN',
          )
        } else {
          setState('idle')
        }
      }
    }

    recorder.start(200)
  }, [applyTranscript, clearTranscriptRefs, getBrowserBackupTranscript, locale, stopBrowserSpeech, stopStream, uploadRecording])

  const startRecording = useCallback(async () => {
    setErrorMessage(null)
    clearTranscriptRefs()

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage(t('raise.voice.unsupported'))
      setState('error')
      return
    }

    const hasBrowser = Boolean(getBrowserSpeechRecognitionCtor())
    const mimeType = pickRecorderMimeType()
    const canCloud = Boolean(mimeType && token)

    let nextStrategy: RecordingStrategy = 'browser'
    if (canCloud && hasBrowser) {
      nextStrategy = 'hybrid'
    } else if (canCloud) {
      nextStrategy = 'cloud'
    } else if (hasBrowser) {
      nextStrategy = 'browser'
    } else {
      setErrorMessage(t('raise.voice.unsupported'))
      setState('error')
      return
    }

    setStrategy(nextStrategy)
    strategyRef.current = nextStrategy

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      setAnalyserStream(stream)

      if (nextStrategy === 'cloud' || nextStrategy === 'hybrid') {
        startCloudRecorder(stream, mimeType!)
      }

      setState('recording')
    } catch {
      stopStream()
      setErrorMessage(t('raise.voice.permissionDenied'))
      setState('error')
    }
  }, [clearTranscriptRefs, startCloudRecorder, stopStream, t, token])

  const stopRecording = useCallback(() => {
    if (strategyRef.current === 'browser') {
      finishBrowserRecording()
      return
    }

    const recorder = recorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
      return
    }

    finishBrowserRecording()
  }, [finishBrowserRecording])

  const handleClick = () => {
    if (state === 'recording') {
      stopRecording()
      return
    }
    if (state === 'processing') {
      return
    }
    void startRecording()
  }

  const label =
    state === 'recording'
      ? t('raise.voice.stop')
      : state === 'processing'
        ? t('raise.voice.processing')
        : t('raise.voice.start')

  const busy = state === 'processing'
  const showLivePreview = isRecording && strategy !== 'cloud'

  return (
    <>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <button
          aria-label={label}
          aria-pressed={state === 'recording'}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold shadow-sm transition focus:outline-none focus:ring-4 focus:ring-teal-200/40 sm:px-4 sm:text-sm ${
            state === 'recording'
              ? 'border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100'
              : 'border-line bg-white text-ink hover:bg-slate-50'
          } ${busy ? 'cursor-wait opacity-80' : ''}`}
          disabled={busy}
          onClick={handleClick}
          type="button"
        >
          <MicIcon
            className={`size-4 ${state === 'recording' ? 'animate-pulse text-rose-600' : 'text-teal-700'}`}
          />
          <span className="hidden sm:inline">{label}</span>
        </button>
      </div>

      {panelOpen && (
        <div
          aria-labelledby="voice-recording-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-4 backdrop-blur-[2px] sm:items-center"
          role="dialog"
        >
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-line/80 bg-white shadow-2xl">
            <div
              className={`px-6 py-5 ${
                isRecording
                  ? 'bg-gradient-to-br from-rose-50 via-white to-teal-50'
                  : 'bg-gradient-to-br from-teal-50 via-white to-white'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {isRecording ? (
                    <span className="relative flex size-3">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-400 opacity-70" />
                      <span className="relative inline-flex size-3 rounded-full bg-rose-500" />
                    </span>
                  ) : (
                    <span className="inline-flex size-3 animate-pulse rounded-full bg-teal-500" />
                  )}
                  <p className="text-sm font-extrabold text-ink" id="voice-recording-title">
                    {isRecording ? t('raise.voice.recordingTitle') : t('raise.voice.processingTitle')}
                  </p>
                </div>
                {isRecording && (
                  <span className="rounded-full bg-white/80 px-2.5 py-1 font-mono text-xs font-bold text-rose-700 shadow-sm">
                    {formatElapsed(elapsedSeconds)}
                  </span>
                )}
              </div>

              <p className="mt-2 text-sm text-muted">
                {isRecording
                  ? strategy === 'hybrid'
                    ? t('raise.voice.recordingHintAuto')
                    : t('raise.voice.recordingHint')
                  : t('raise.voice.processingHintCloud')}
              </p>

              <div className="mt-4 rounded-2xl border border-line/70 bg-white/90 px-3 py-4 shadow-inner">
                {isRecording ? (
                  <VoiceLevelBars active levels={levels} />
                ) : (
                  <div className="flex h-16 items-center justify-center gap-2">
                    <span className="size-2 animate-bounce rounded-full bg-teal-500 [animation-delay:-0.2s]" />
                    <span className="size-2 animate-bounce rounded-full bg-teal-500 [animation-delay:-0.1s]" />
                    <span className="size-2 animate-bounce rounded-full bg-teal-500" />
                  </div>
                )}
              </div>

              {isRecording && (
                <p className="mt-3 text-center text-xs font-semibold text-teal-800">
                  {t('raise.voice.levelHint')}
                </p>
              )}

              {showLivePreview && (
                <div className="mt-3 min-h-[4.5rem] rounded-2xl border border-teal-100 bg-teal-50/60 px-3 py-2 text-sm text-ink">
                  <p className="text-[0.65rem] font-bold uppercase tracking-wide text-teal-800">
                    {t('raise.voice.livePreview')}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">
                    {liveTranscript || t('raise.voice.livePreviewEmpty')}
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-line/80 bg-slate-50 px-6 py-4">
              {isRecording ? (
                <button
                  className="w-full rounded-full bg-rose-600 px-4 py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-200"
                  onClick={stopRecording}
                  type="button"
                >
                  {t('raise.voice.stop')}
                </button>
              ) : (
                <p className="text-center text-sm font-medium text-muted">
                  {t('raise.voice.processing')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {errorMessage && state === 'error' && (
        <div
          className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-lg sm:inset-x-auto sm:right-6 sm:bottom-6"
          role="alert"
        >
          <p className="font-bold">{t('raise.voice.errorTitle')}</p>
          <p className="mt-1">{errorMessage}</p>
          <button
            className="mt-3 text-xs font-bold text-rose-700 underline"
            onClick={() => {
              setErrorMessage(null)
              setState('idle')
            }}
            type="button"
          >
            {t('raise.voice.dismiss')}
          </button>
        </div>
      )}
    </>
  )
}
