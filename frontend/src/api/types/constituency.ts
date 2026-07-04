export type ApiWardSummary = {
  id: number
  name: string
  code: string
  city?: string | null
  population: number | null
  registered_voters: number | null
  municipal_ward_number?: string | null
  ward_area_name?: string | null
  centroid_lat?: number | null
  centroid_lng?: number | null
  has_boundary?: boolean
}

export type ApiWardListResponse = {
  constituency_name: string
  total_population: number
  total_registered_voters: number
  wards: ApiWardSummary[]
}

export type ApiWardResolveResponse = {
  ward_id: number
  name: string
  code: string
  municipal_ward_number: string | null
  ward_area_name: string | null
  confidence: 'inside' | 'nearest'
  distance_m: number | null
}

export type ApiWardBoundariesResponse = {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    properties: {
      ward_id: number
      name: string
      code: string
      municipal_ward_number: string | null
      ward_area_name: string | null
    }
    geometry: Record<string, unknown>
  }>
}

export type ApiWardBoundaryResponse = {
  ward_id: number
  code: string
  name: string
  city: string | null
  geometry: Record<string, unknown>
  centroid_lat: number | null
  centroid_lng: number | null
}

export type ApiCitySummary = {
  city: string
  display_name: string
  default_lat: number
  default_lng: number
  default_zoom: number
  ward_count: number
}

export type ApiCityListResponse = {
  cities: ApiCitySummary[]
}

export type WardOption = {
  id: number
  name: string
  code: string
  city: string | null
  population: number | null
  registeredVoters: number | null
  municipalWardNumber: string | null
  wardAreaName: string | null
  centroidLat: number | null
  centroidLng: number | null
  hasBoundary: boolean
}

export type CityOption = {
  city: string
  displayName: string
  defaultLat: number
  defaultLng: number
  defaultZoom: number
  wardCount: number
}
