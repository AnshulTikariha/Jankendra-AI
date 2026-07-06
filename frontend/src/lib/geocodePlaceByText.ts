import type { GeocodingResult } from './geocoding'

export type GeocodeBias = {
  lat: number
  lng: number
  cityName?: string
}

let placesServiceHost: HTMLDivElement | null = null

function getPlacesService(): google.maps.places.PlacesService {
  if (!placesServiceHost) {
    placesServiceHost = document.createElement('div')
  }
  return new google.maps.places.PlacesService(placesServiceHost)
}

function googleReady(): boolean {
  return typeof google !== 'undefined' && Boolean(google.maps?.places)
}

function buildSearchInput(query: string, bias?: GeocodeBias): string {
  const trimmed = query.trim()
  if (!trimmed) {
    return ''
  }
  if (bias?.cityName && !trimmed.toLowerCase().includes(bias.cityName.toLowerCase())) {
    return `${trimmed}, ${bias.cityName}, India`
  }
  return `${trimmed}, India`
}

function autocompleteBestMatch(
  input: string,
  bias?: GeocodeBias,
): Promise<{ placeId: string; label: string } | null> {
  return new Promise((resolve) => {
    const service = new google.maps.places.AutocompleteService()
    const request: google.maps.places.AutocompletionRequest = {
      input,
      componentRestrictions: { country: 'in' },
    }

    if (bias) {
      request.location = new google.maps.LatLng(bias.lat, bias.lng)
      request.radius = 50_000
    }

    service.getPlacePredictions(request, (predictions, status) => {
      if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions?.length) {
        resolve(null)
        return
      }

      const best = predictions[0]
      resolve({
        placeId: best.place_id,
        label: best.description,
      })
    })
  })
}

function fetchPlaceDetails(placeId: string): Promise<GeocodingResult | null> {
  const service = getPlacesService()

  return new Promise((resolve) => {
    service.getDetails(
      {
        placeId,
        fields: ['geometry', 'formatted_address', 'name'],
      },
      (place, status) => {
        const location = place?.geometry?.location
        if (status !== google.maps.places.PlacesServiceStatus.OK || !location) {
          resolve(null)
          return
        }

        resolve({
          placeId,
          label: place.formatted_address ?? place.name ?? '',
          latitude: location.lat(),
          longitude: location.lng(),
        })
      },
    )
  })
}

function geocodeWithGeocoder(address: string): Promise<GeocodingResult | null> {
  return new Promise((resolve) => {
    const geocoder = new google.maps.Geocoder()
    geocoder.geocode(
      {
        address,
        componentRestrictions: { country: 'in' },
      },
      (results, status) => {
        if (status !== 'OK' || !results?.[0]?.geometry?.location) {
          resolve(null)
          return
        }

        const location = results[0].geometry.location
        resolve({
          placeId: results[0].place_id ?? '',
          label: results[0].formatted_address ?? address,
          latitude: location.lat(),
          longitude: location.lng(),
        })
      },
    )
  })
}

/**
 * Resolve a free-text place name to coordinates.
 * Tries Google Places Autocomplete (best match) first, then Geocoder.
 */
export async function geocodePlaceByText(
  query: string,
  bias?: GeocodeBias,
): Promise<GeocodingResult | null> {
  const searchInput = buildSearchInput(query, bias)
  if (!searchInput || searchInput.length < 2) {
    return null
  }

  if (!googleReady()) {
    return null
  }

  const prediction = await autocompleteBestMatch(searchInput, bias)
  if (prediction) {
    const fromPlaces = await fetchPlaceDetails(prediction.placeId)
    if (fromPlaces) {
      return fromPlaces
    }
  }

  return geocodeWithGeocoder(searchInput)
}
