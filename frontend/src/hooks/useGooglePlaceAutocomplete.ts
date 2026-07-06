import { useMapsLibrary } from '@vis.gl/react-google-maps'
import { useEffect, useRef, useState } from 'react'

export type PlaceSuggestion = {
  placeId: string
  label: string
}

type SearchBias = {
  lat: number
  lng: number
  cityName?: string
}

export function useGooglePlaceAutocomplete(query: string, bias?: SearchBias) {
  const placesLib = useMapsLibrary('places')
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const seqRef = useRef(0)

  useEffect(() => {
    const trimmed = query.trim()
    if (!placesLib || trimmed.length < 2) {
      setSuggestions([])
      setLoading(false)
      return
    }

    const seq = ++seqRef.current
    setLoading(true)

    const timer = window.setTimeout(() => {
      const service = new placesLib.AutocompleteService()
      const request: google.maps.places.AutocompletionRequest = {
        input: trimmed,
        componentRestrictions: { country: 'in' },
      }

      if (bias) {
        request.location = new google.maps.LatLng(bias.lat, bias.lng)
        request.radius = 50_000
      }

      service.getPlacePredictions(request, (predictions, status) => {
        if (seq !== seqRef.current) return

        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(
            predictions.map((prediction) => ({
              placeId: prediction.place_id,
              label: prediction.description,
            })),
          )
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          setSuggestions([])
        } else {
          setSuggestions([])
        }

        setLoading(false)
      })
    }, 300)

    return () => window.clearTimeout(timer)
  }, [placesLib, query, bias?.lat, bias?.lng, bias?.cityName])

  return { suggestions, loading, placesReady: Boolean(placesLib) }
}
