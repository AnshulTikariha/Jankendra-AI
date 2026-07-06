import type { GeocodingResult } from './geocoding'

let placesServiceHost: HTMLDivElement | null = null

function getPlacesService(placesLib: google.maps.PlacesLibrary): google.maps.places.PlacesService {
  if (!placesServiceHost) {
    placesServiceHost = document.createElement('div')
  }
  return new placesLib.PlacesService(placesServiceHost)
}

export function fetchGooglePlaceDetails(
  placesLib: google.maps.PlacesLibrary,
  placeId: string,
): Promise<GeocodingResult> {
  const service = getPlacesService(placesLib)

  return new Promise((resolve, reject) => {
    service.getDetails(
      {
        placeId,
        fields: ['geometry', 'formatted_address', 'name'],
      },
      (place, status) => {
        const location = place?.geometry?.location
        if (status !== google.maps.places.PlacesServiceStatus.OK || !location) {
          reject(new Error(`Place details failed: ${status}`))
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

export function reverseGeocodeWithGoogle(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  return new Promise((resolve) => {
    const geocoder = new google.maps.Geocoder()
    geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
      if (status === 'OK' && results?.[0]?.formatted_address) {
        resolve(results[0].formatted_address)
        return
      }
      resolve(null)
    })
  })
}
