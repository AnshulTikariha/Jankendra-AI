import { useCallback, useEffect, useRef, useState, forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { transcribeVoice } from '../../../api/voice'
import { ApiError } from '../../../api/errors'
import { useBrowserSpeechRecognition } from '../../../hooks/useBrowserSpeechRecognition'
import { useVoiceAnalyser } from '../../../hooks/useVoiceAnalyser'
import { useLocale } from '../../../hooks/useLocale'
import { getBrowserSpeechRecognitionCtor, shouldUseBrowserBackup, speechRecognitionLang, looksLikeHindi } from '../../../lib/browserSpeech'
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

export const VoiceComplaintButton = forwardRef<HTMLButtonElement, VoiceComplaintButtonProps>(
  function VoiceComplaintButton({ onTranscript }, ref) {
  const { t } = useTranslation('complaints')
  const { locale } = useLocale()
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
  const uploadEpochRef = useRef(0)
  const startingRef = useRef(false)
  const [acquiringMic, setAcquiringMic] = useState(false)
  const [browserSpeechLang, setBrowserSpeechLang] = useState(() => speechRecognitionLang(locale))
  const [analyserStream, setAnalyserStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    setBrowserSpeechLang(speechRecognitionLang(locale))
  }, [locale])

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

  const isUploadCurrent = useCallback((epoch: number) => epoch === uploadEpochRef.current, [])

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

  const resetSession = useCallback(() => {
    uploadEpochRef.current += 1
    startingRef.current = false
    setAcquiringMic(false)
    const recorder = recorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.stop()
      } catch {
        // Recorder may already be stopping.
      }
    }
    recorderRef.current = null
    chunksRef.current = []
    stopBrowserSpeech()
    stopStream()
    clearTranscriptRefs()
    setErrorMessage(null)
    setState('idle')
  }, [clearTranscriptRefs, stopBrowserSpeech, stopStream])

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

  const applyTranscript = useCallback(
    (transcript: string) => {
      onTranscript(transcript)
      setErrorMessage(null)
      setState('idle')
      clearTranscriptRefs()
    },
    [clearTranscriptRefs, onTranscript],
  )

  const pickTranscript = useCallback(
    (cloudTranscript: string, backupTranscript: string): string => {
      const cloud = cloudTranscript.trim()
      const backup = backupTranscript.trim()
      const wantsEnglish = locale === 'en'

      if (wantsEnglish) {
        if (cloud && !looksLikeHindi(cloud)) {
          return cloud
        }
        if (backup && !looksLikeHindi(backup)) {
          return backup
        }
      } else {
        if (cloud && looksLikeHindi(cloud)) {
          return cloud
        }
        if (backup && looksLikeHindi(backup)) {
          return backup
        }
      }

      return cloud || backup
    },
    [locale],
  )

  const finishBrowserRecording = useCallback(() => {
    stopBrowserSpeech()
    stopStream()
    const transcript = getBrowserBackupTranscript()
    clearTranscriptRefs()

    if (transcript) {
      applyTranscript(transcript)
      return
    }

    setErrorMessage(t('raise.voice.noSpeech'))
    setState('error')
  }, [applyTranscript, clearTranscriptRefs, getBrowserBackupTranscript, stopBrowserSpeech, stopStream, t])

  const uploadRecording = useCallback(
    async (blob: Blob, epoch: number) => {
      let settled = false

      const finish = () => {
        settled = true
      }

      const failUpload = (message: string) => {
        if (!isUploadCurrent(epoch)) {
          finish()
          return
        }
        setErrorMessage(message)
        setState('error')
        finish()
      }

      try {
        if (!token) {
          const backup = getBrowserBackupTranscript()
          if (shouldUseBrowserBackup(backup, strategyRef.current, locale)) {
            applyTranscript(backup)
            finish()
            return
          }
          failUpload(t('raise.voice.notSignedIn'))
          return
        }

        if (!isUploadCurrent(epoch)) {
          finish()
          return
        }

        const result = await transcribeVoice(
          token,
          blob,
          speechRecognitionLang(locale) as 'en-IN' | 'hi-IN',
        )

        if (!isUploadCurrent(epoch)) {
          finish()
          return
        }

        const backup = getBrowserBackupTranscript()
        applyTranscript(pickTranscript(result.transcript, backup))
        finish()
      } catch (err) {
        if (!isUploadCurrent(epoch)) {
          finish()
          return
        }

        const backup = getBrowserBackupTranscript()
        if (shouldUseBrowserBackup(backup, strategyRef.current, locale)) {
          try {
            applyTranscript(backup)
          } catch {
            const raw = err instanceof ApiError ? err.message : t('raise.voice.error')
            failUpload(friendlyVoiceError(raw, t('raise.voice.error')))
            return
          }
          finish()
          return
        }

        const raw = err instanceof ApiError ? err.message : t('raise.voice.error')
        if (raw.includes('Speech-to-Text API') || raw.includes('SERVICE_DISABLED')) {
          failUpload(t('raise.voice.apiDisabled'))
        } else {
          failUpload(friendlyVoiceError(raw, t('raise.voice.error')))
        }
      } finally {
        if (!settled && isUploadCurrent(epoch)) {
          setErrorMessage((current) => current ?? t('raise.voice.error'))
          setState('error')
        }
      }
    },
    [applyTranscript, getBrowserBackupTranscript, isUploadCurrent, locale, pickTranscript, t, token],
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
        const epoch = uploadEpochRef.current
        setState('processing')
        void uploadRecording(blob, epoch)
      } else {
        const backup = getBrowserBackupTranscript()
        clearTranscriptRefs()
        if (shouldUseBrowserBackup(backup, strategyRef.current, locale)) {
          applyTranscript(backup)
        } else {
          setState('idle')
        }
      }
    }

    recorder.start(200)
  }, [applyTranscript, clearTranscriptRefs, getBrowserBackupTranscript, locale, stopBrowserSpeech, stopStream, uploadRecording])

  const startRecording = useCallback(async () => {
    if (startingRef.current) {
      return
    }

    startingRef.current = true
    setAcquiringMic(true)
    const captureEpoch = uploadEpochRef.current + 1
    uploadEpochRef.current = captureEpoch
    setErrorMessage(null)
    clearTranscriptRefs()

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage(t('raise.voice.unsupported'))
      setState('error')
      startingRef.current = false
      setAcquiringMic(false)
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
      startingRef.current = false
      setAcquiringMic(false)
      return
    }

    setStrategy(nextStrategy)
    strategyRef.current = nextStrategy
    setState('idle')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (captureEpoch !== uploadEpochRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

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
    } finally {
      startingRef.current = false
      setAcquiringMic(false)
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
      resetSession()
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

  const busy = state === 'processing' || acquiringMic
  const showLivePreview = isRecording && strategy !== 'cloud'

  return (
    <>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <button
          ref={ref}
          aria-label={label}
          aria-pressed={state === 'recording'}
          className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2.5 text-xs font-extrabold transition focus:outline-none focus:ring-4 focus:ring-teal-200/50 sm:px-4 sm:text-sm ${
            state === 'recording'
              ? 'border-rose-300 bg-rose-50 text-rose-800 shadow-md shadow-rose-100/80 hover:bg-rose-100'
              : busy
                ? 'cursor-wait border-teal-200 bg-teal-50/80 text-teal-800 opacity-80'
                : 'border-teal-300 bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 text-teal-900 shadow-md shadow-teal-200/50 ring-1 ring-teal-200/70 hover:border-teal-400 hover:from-teal-100 hover:via-emerald-100 hover:to-teal-100 hover:shadow-lg hover:shadow-teal-200/60'
          }`}
          disabled={busy}
          onClick={handleClick}
          type="button"
        >
          <span
            className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full ${
              state === 'recording'
                ? 'bg-rose-100'
                : 'bg-gradient-to-br from-teal-500 to-emerald-600 shadow-sm shadow-teal-300/40'
            }`}
          >
            <MicIcon
              className={`size-3.5 ${
                state === 'recording' ? 'animate-pulse text-rose-600' : 'text-white'
              }`}
            />
          </span>
          <span>{label}</span>
        </button>
      </div>

      {panelOpen && (
        <div
          aria-labelledby="voice-recording-title"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/45 p-0 backdrop-blur-[2px] pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))] sm:items-center sm:p-4 sm:pb-4"
          role="dialog"
        >
          <div className="flex max-h-[min(88dvh,calc(100dvh-5.5rem-env(safe-area-inset-bottom,0px)))] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-line/80 bg-white shadow-2xl sm:max-h-[min(90dvh,40rem)] sm:rounded-3xl">
            <div
              className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6 sm:py-5 ${
                isRecording
                  ? 'bg-gradient-to-br from-rose-50 via-white to-teal-50'
                  : 'bg-gradient-to-br from-teal-50 via-white to-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  {isRecording ? (
                    <span className="relative flex size-3 shrink-0">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-400 opacity-70" />
                      <span className="relative inline-flex size-3 rounded-full bg-rose-500" />
                    </span>
                  ) : (
                    <span className="inline-flex size-3 shrink-0 animate-pulse rounded-full bg-teal-500" />
                  )}
                  <p className="text-sm font-extrabold text-ink" id="voice-recording-title">
                    {isRecording ? t('raise.voice.recordingTitle') : t('raise.voice.processingTitle')}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {isRecording && (
                    <span className="rounded-full bg-white/80 px-2.5 py-1 font-mono text-xs font-bold text-rose-700 shadow-sm">
                      {formatElapsed(elapsedSeconds)}
                    </span>
                  )}
                  {isRecording && (
                    <button
                      className="rounded-full bg-rose-600 px-3 py-1.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-200 lg:hidden"
                      onClick={stopRecording}
                      type="button"
                    >
                      {t('raise.voice.stop')}
                    </button>
                  )}
                </div>
              </div>

              <p className="mt-2 text-sm text-muted">
                {isRecording
                  ? strategy === 'hybrid'
                    ? t('raise.voice.recordingHintAuto')
                    : t('raise.voice.recordingHint')
                  : t('raise.voice.processingHintCloud')}
              </p>

              <div className="mt-4 rounded-2xl border border-line/70 bg-white/90 px-3 py-3 shadow-inner sm:py-4">
                {isRecording ? (
                  <VoiceLevelBars active levels={levels} />
                ) : (
                  <div className="flex h-14 items-center justify-center gap-2 sm:h-16">
                    <span className="size-2 animate-bounce rounded-full bg-teal-500 [animation-delay:-0.2s]" />
                    <span className="size-2 animate-bounce rounded-full bg-teal-500 [animation-delay:-0.1s]" />
                    <span className="size-2 animate-bounce rounded-full bg-teal-500" />
                  </div>
                )}
              </div>

              {isRecording && (
                <p className="mt-2 text-center text-xs font-semibold text-teal-800 sm:mt-3">
                  {t('raise.voice.levelHint')}
                </p>
              )}

              {showLivePreview && (
                <div className="mt-3 max-h-28 overflow-y-auto rounded-2xl border border-teal-100 bg-teal-50/60 px-3 py-2 text-sm text-ink sm:max-h-36">
                  <p className="text-[0.65rem] font-bold uppercase tracking-wide text-teal-800">
                    {t('raise.voice.livePreview')}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">
                    {liveTranscript || t('raise.voice.livePreviewEmpty')}
                  </p>
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-line/80 bg-slate-50 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:px-6 sm:py-4">
              {isRecording ? (
                <button
                  className="w-full rounded-full bg-rose-600 px-4 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-200"
                  onClick={stopRecording}
                  type="button"
                >
                  {t('raise.voice.stop')}
                </button>
              ) : (
                <button
                  className="w-full rounded-full border border-line bg-white px-4 py-3.5 text-sm font-bold text-ink transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-teal-200"
                  onClick={resetSession}
                  type="button"
                >
                  {t('raise.voice.cancel')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {errorMessage && state === 'error' && (
        <div
          className="fixed inset-x-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] z-[100] mx-auto max-w-md rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-lg sm:inset-x-auto sm:right-6 sm:bottom-6"
          role="alert"
        >
          <p className="font-bold">{t('raise.voice.errorTitle')}</p>
          <p className="mt-1">{errorMessage}</p>
          <button
            className="mt-3 text-xs font-bold text-rose-700 underline"
            onClick={resetSession}
            type="button"
          >
            {t('raise.voice.dismiss')}
          </button>
        </div>
      )}
    </>
  )
})
