import { useCallback, useEffect, useRef, useState } from 'react'
import { analyzeComplaintText } from '../api/complaintAnalysis'
import { ApiError } from '../api/errors'
import { geocodePlaceByText, type GeocodeBias } from '../lib/geocodePlaceByText'
import {
  buildFormPatches,
  mapAnalysisToSuggestions,
  type ComplaintAnalysisSuggestions,
} from '../lib/complaintAnalysisMapper'
import type { RaiseComplaintForm } from '../types/raiseComplaint'

const ANALYSIS_DEBOUNCE_MS = 1200
const MIN_TEXT_LENGTH = 20

export type ComplaintFieldTouchKey = keyof RaiseComplaintForm | 'map'

type UseComplaintTextAnalysisOptions = {
  description: string
  form: RaiseComplaintForm
  token: string | null
  enabled?: boolean
  geocodeBias?: GeocodeBias | null
  onApplyPatches: (patch: Partial<RaiseComplaintForm>) => void
  onMapSearchSeed?: (query: string) => void
}

export function useComplaintTextAnalysis({
  description,
  form,
  token,
  enabled = true,
  geocodeBias,
  onApplyPatches,
  onMapSearchSeed,
}: UseComplaintTextAnalysisOptions) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [lastSuggestions, setLastSuggestions] = useState<ComplaintAnalysisSuggestions | null>(
    null,
  )
  const lastAnalyzedRef = useRef('')
  const inFlightRef = useRef(false)
  const touchedRef = useRef<Set<ComplaintFieldTouchKey>>(new Set())
  const formRef = useRef(form)
  formRef.current = form

  const markTouched = useCallback((field: ComplaintFieldTouchKey) => {
    touchedRef.current.add(field)
  }, [])

  const runAnalysis = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!enabled || !token || trimmed.length < MIN_TEXT_LENGTH) {
        return
      }
      if (trimmed === lastAnalyzedRef.current || inFlightRef.current) {
        return
      }

      inFlightRef.current = true
      setIsAnalyzing(true)
      setAnalysisError(null)

      try {
        const analysis = await analyzeComplaintText(token, trimmed)
        lastAnalyzedRef.current = trimmed
        const suggestions = mapAnalysisToSuggestions(analysis)
        setLastSuggestions(suggestions)

        const currentForm = formRef.current
        const patch = buildFormPatches({
          form: currentForm,
          suggestions,
          touched: touchedRef.current,
        })

        if (Object.keys(patch).length > 0) {
          onApplyPatches(patch)
        }

        if (
          suggestions.geocodeQuery &&
          !touchedRef.current.has('map') &&
          currentForm.latitude == null &&
          currentForm.longitude == null
        ) {
          onMapSearchSeed?.(suggestions.geocodeQuery)
          const geocoded = await geocodePlaceByText(
            suggestions.geocodeQuery,
            geocodeBias ?? undefined,
          )
          if (geocoded) {
            onApplyPatches({
              latitude: geocoded.latitude,
              longitude: geocoded.longitude,
              locationDetail:
                currentForm.locationDetail.trim() || patch.locationDetail || geocoded.label,
            })
            onMapSearchSeed?.(geocoded.label)
          }
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 503) {
          setAnalysisError(null)
        } else {
          setAnalysisError(
            err instanceof ApiError ? err.message : 'Could not analyze description',
          )
        }
      } finally {
        inFlightRef.current = false
        setIsAnalyzing(false)
      }
    },
    [enabled, geocodeBias, onApplyPatches, onMapSearchSeed, token],
  )

  useEffect(() => {
    if (!enabled) {
      return
    }

    const trimmed = description.trim()
    if (trimmed.length < MIN_TEXT_LENGTH) {
      return
    }

    const timer = window.setTimeout(() => {
      void runAnalysis(trimmed)
    }, ANALYSIS_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [description, enabled, runAnalysis])

  const analyzeNow = useCallback(
    (text?: string) => {
      lastAnalyzedRef.current = ''
      void runAnalysis(text ?? description)
    },
    [description, runAnalysis],
  )

  return {
    isAnalyzing,
    analysisError,
    lastSuggestions,
    markTouched,
    analyzeNow,
  }
}
