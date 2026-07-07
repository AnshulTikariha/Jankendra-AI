export type BrowserSpeechRecognition = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

export type BrowserSpeechRecognitionEvent = {
  resultIndex: number
  results: BrowserSpeechRecognitionResultList
}

export type BrowserSpeechRecognitionResultList = {
  length: number
  [index: number]: BrowserSpeechRecognitionResult
}

export type BrowserSpeechRecognitionResult = {
  isFinal: boolean
  [index: number]: { transcript: string }
}

export type BrowserSpeechRecognitionErrorEvent = {
  error: string
  message?: string
}

import type { SupportedLocale } from '../i18n/config'

export const VOICE_DETECTED_LANG_KEY = 'jankendra-voice-detected-lang'

export function getBrowserSpeechRecognitionCtor(): BrowserSpeechRecognitionCtor | null {
  if (typeof window === 'undefined') {
    return null
  }

  const extended = window as Window & {
    SpeechRecognition?: BrowserSpeechRecognitionCtor
    webkitSpeechRecognition?: BrowserSpeechRecognitionCtor
  }

  return extended.SpeechRecognition ?? extended.webkitSpeechRecognition ?? null
}

export type BrowserSpeechRecognitionCtor = new () => BrowserSpeechRecognition

export function localeFromSpeechCode(code: string | null | undefined): SupportedLocale | null {
  if (!code) {
    return null
  }
  if (code.startsWith('hi')) {
    return 'hi'
  }
  if (code.startsWith('en')) {
    return 'en'
  }
  return null
}

export function readStoredSpeechLang(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  return window.localStorage.getItem(VOICE_DETECTED_LANG_KEY)
}

export function storeSpeechLang(code: string) {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(VOICE_DETECTED_LANG_KEY, code)
}

export function defaultBrowserSpeechLang(): string {
  const stored = readStoredSpeechLang()
  if (stored) {
    return stored
  }
  if (typeof navigator !== 'undefined') {
    const nav = navigator.language.toLowerCase()
    if (nav.startsWith('hi')) {
      return 'hi-IN'
    }
  }
  return 'en-IN'
}

export function speechRecognitionLang(locale: string): string {
  if (locale.startsWith('hi')) {
    return 'hi-IN'
  }
  return 'en-IN'
}

export function looksLikeHindi(text: string): boolean {
  return /[\u0900-\u097F]/.test(text)
}

export function shouldUseBrowserBackup(
  backup: string,
  _strategy: 'hybrid' | 'cloud' | 'browser',
  _locale: string,
): boolean {
  if (!backup.trim()) {
    return false
  }
  // If browser speech captured text, prefer it over failing cloud responses.
  // This keeps voice input usable when Speech-to-Text returns no transcript.
  return true
}

export function collectTranscript(event: BrowserSpeechRecognitionEvent): {
  finalText: string
  interimText: string
} {
  let finalText = ''
  let interimText = ''

  for (let index = event.resultIndex; index < event.results.length; index += 1) {
    const result = event.results[index]
    const chunk = result[0]?.transcript ?? ''
    if (result.isFinal) {
      finalText += chunk
    } else {
      interimText += chunk
    }
  }

  return { finalText, interimText }
}
