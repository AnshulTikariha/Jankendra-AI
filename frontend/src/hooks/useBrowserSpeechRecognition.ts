import { useCallback, useEffect, useRef } from 'react'
import {
  collectTranscript,
  getBrowserSpeechRecognitionCtor,
  type BrowserSpeechRecognition,
} from '../lib/browserSpeech'

type UseBrowserSpeechRecognitionOptions = {
  active: boolean
  languageTag: string
  onInterim: (text: string) => void
  onFinal: (text: string) => void
  onError: (code: string) => void
}

export function useBrowserSpeechRecognition({
  active,
  languageTag,
  onInterim,
  onFinal,
  onError,
}: UseBrowserSpeechRecognitionOptions) {
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null)
  const finalPartsRef = useRef<string[]>([])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
  }, [])

  useEffect(() => {
    if (!active) {
      return
    }

    const Ctor = getBrowserSpeechRecognitionCtor()
    if (!Ctor) {
      onError('unsupported')
      return
    }

    finalPartsRef.current = []
    const recognition = new Ctor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = languageTag

    recognition.onresult = (event) => {
      const { finalText, interimText } = collectTranscript(event)
      if (finalText) {
        finalPartsRef.current.push(finalText.trim())
        onFinal(finalPartsRef.current.join(' ').trim())
      }
      const composed = [...finalPartsRef.current, interimText.trim()]
        .filter(Boolean)
        .join(' ')
        .trim()
      onInterim(composed)
    }

    recognition.onerror = (event) => {
      if (event.error === 'aborted' || event.error === 'no-speech') {
        return
      }
      onError(event.error)
    }

    recognition.onend = () => {
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null
      }
    }

    recognitionRef.current = recognition
    recognition.start()

    return () => {
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
      recognition.abort()
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null
      }
    }
  }, [active, languageTag, onError, onFinal, onInterim])

  return { stop }
}
