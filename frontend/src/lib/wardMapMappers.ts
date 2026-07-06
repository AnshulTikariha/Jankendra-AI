import type { WardOption } from '../api/types/constituency'
import type { WardRow } from '../types/dashboard'
import type { WardPrioritySummary } from '../types/staff'
import { FALLBACK_CITY_OPTIONS } from '../data/cityOptions'
import { type WardMapPoint } from '../data/wardMapData'

function computeIntensity(
  openClusters: number,
  openComplaints: number,
  overdueCommitments: number,
  maxScore: number,
): number {
  const score = openClusters * 12 + openComplaints * 2 + overdueCommitments * 8
  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
}

function findGeoWard(
  row: { wardId: string; wardName: string },
  geoWards?: WardOption[],
): WardOption | undefined {
  if (!geoWards?.length) return undefined

  return (
    geoWards.find((ward) => String(ward.id) === row.wardId) ??
    geoWards.find((ward) => ward.name === row.wardName) ??
    geoWards.find((ward) => row.wardName.includes(ward.code.replace('W', '')))
  )
}

function cityDefaultCoords(city: string | null | undefined): { lat: number; lng: number } {
  const match = FALLBACK_CITY_OPTIONS.find((option) => option.city === city)
  if (match) {
    return { lat: match.defaultLat, lng: match.defaultLng }
  }

  return { lat: FALLBACK_CITY_OPTIONS[0].defaultLat, lng: FALLBACK_CITY_OPTIONS[0].defaultLng }
}

function resolveCoordinates(
  row: { wardId: string; wardName: string },
  geoWards: WardOption[] | undefined,
  index: number,
): { lat: number; lng: number } {
  const geo = findGeoWard(row, geoWards)
  if (geo?.centroidLat != null && geo?.centroidLng != null) {
    return { lat: geo.centroidLat, lng: geo.centroidLng }
  }

  const cityCenter = cityDefaultCoords(geo?.city)
  const wardNum = Number.parseInt(row.wardId, 10)
  const offsetSeed = Number.isFinite(wardNum) ? wardNum : index
  return {
    lat: cityCenter.lat + ((offsetSeed % 5) - 2) * 0.004,
    lng: cityCenter.lng + (Math.floor(offsetSeed / 5) % 5 - 2) * 0.004,
  }
}

export function filterActiveWardRows(rows: WardRow[]): WardRow[] {
  return rows.filter(
    (row) =>
      row.openComplaints > 0 ||
      row.openClusters > 0 ||
      row.overdueCommitments > 0 ||
      row.infraAlerts.length > 0,
  )
}

export function mapWardRowsToMapPoints(
  rows: WardRow[],
  geoWards?: WardOption[],
): WardMapPoint[] {
  const scores = rows.map(
    (row) => row.openClusters * 12 + row.openComplaints * 2 + row.overdueCommitments * 8,
  )
  const maxScore = Math.max(...scores, 1)

  return rows.map((row, index) => {
    const { lat, lng } = resolveCoordinates(row, geoWards, index)
    const geo = findGeoWard(row, geoWards)

    return {
      wardId: row.wardId,
      wardName: geo?.wardAreaName ? `${row.wardName} (${geo.wardAreaName})` : row.wardName,
      lat,
      lng,
      openClusters: row.openClusters,
      openComplaints: row.openComplaints,
      overdueCommitments: row.overdueCommitments,
      resolvedThisWeek: 0,
      intensity: computeIntensity(
        row.openClusters,
        row.openComplaints,
        row.overdueCommitments,
        maxScore,
      ),
      topIssues: row.infraAlerts,
      categories: row.infraAlerts.map((label) => ({ label, count: 1 })),
      infraAlerts: row.infraAlerts,
      recentSummary: `${row.openComplaints} open complaints · ${row.openClusters} clusters · ${row.overdueCommitments} overdue commitments`,
    }
  })
}

export function mapPriorityWardsToMapPoints(
  rows: WardPrioritySummary[],
  geoWards?: WardOption[],
): WardMapPoint[] {
  const scores = rows.map(
    (row) => row.openClusters * 12 + row.openComplaints * 2 + row.overdueCommitments * 8,
  )
  const maxScore = Math.max(...scores, 1)

  return rows.map((row, index) => {
    const { lat, lng } = resolveCoordinates(
      { wardId: String(row.wardId), wardName: row.wardName },
      geoWards,
      index,
    )

    return {
      wardId: String(row.wardId),
      wardName: row.wardName,
      lat,
      lng,
      openClusters: row.openClusters,
      openComplaints: row.openComplaints,
      overdueCommitments: row.overdueCommitments,
      resolvedThisWeek: 0,
      intensity: computeIntensity(
        row.openClusters,
        row.openComplaints,
        row.overdueCommitments,
        maxScore,
      ),
      topIssues: row.topAction ? [row.topAction] : [],
      categories: [],
      infraAlerts: Array.from({ length: row.infraAlerts }, (_, i) => `Alert ${i + 1}`),
      recentSummary: row.topAction ?? 'No top action recorded',
    }
  })
}
