export function extendBoundsWithCoords(
  bounds: google.maps.LatLngBounds,
  coords: unknown,
): void {
  if (!Array.isArray(coords)) return
  if (coords.length >= 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
    bounds.extend({ lat: coords[1], lng: coords[0] })
    return
  }
  coords.forEach((item) => extendBoundsWithCoords(bounds, item))
}

export function boundsFromGeoJsonGeometry(
  geometry: Record<string, unknown>,
): google.maps.LatLngBounds | null {
  const bounds = new google.maps.LatLngBounds()
  const coordinates = geometry.coordinates
  if (!coordinates) return null
  extendBoundsWithCoords(bounds, coordinates)
  return bounds.isEmpty() ? null : bounds
}
