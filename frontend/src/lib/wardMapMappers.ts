import type { WardOption } from '../api/types/constituency'
import type { WardRow } from '../types/dashboard'
import type { WardPrioritySummary } from '../types/staff'
import {
  CONSTITUENCY_MAP_VIEW,
  type WardMapPoint,
  wardMapPoints,
} from '../data/wardMapData'

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

function findMapTemplate(wardName: string): WardMapPoint | undefined {
  return (
    wardMapPoints.find((w) => w.wardName === wardName) ??
    wardMapPoints.find((w) => wardName.includes(w.wardId))
  )
}

function resolveCoordinates(
  row: { wardId: string; wardName: string },
  geoWards: WardOption[] | undefined,
  index: number,
): { lat: number; lng: number } {
  const geo = findGeoWard(row, geoWards)
  if (geo?.centroidLat != null && geo.centroidLng != null) {
    return { lat: geo.centroidLat, lng: geo.centroidLng }
  }

  const template = findMapTemplate(row.wardName)
  if (template) {
    return { lat: template.lat, lng: template.lng }
  }

  return {
    lat: CONSTITUENCY_MAP_VIEW.center[0] + (index % 3) * 0.008,
    lng: CONSTITUENCY_MAP_VIEW.center[1] + Math.floor(index / 3) * 0.008,
  }
}

export function mapWardRowsToMapPoints(
  rows: WardRow[],
  geoWards?: WardOption[],
): WardMapPoint[] {
  const scores = rows.map(
    (r) => r.openClusters * 12 + r.openClusters * 2 + r.overdueCommitments * 8,
  )
  const maxScore = Math.max(...scores, 1)

  return rows.map((row, index) => {
    const { lat, lng } = resolveCoordinates(row, geoWards, index)
    const openComplaints = row.openClusters
    const geo = findGeoWard(row, geoWards)

    return {
      wardId: row.wardId,
      wardName: geo?.wardAreaName ? `${row.wardName} (${geo.wardAreaName})` : row.wardName,
      lat,
      lng,
      openClusters: row.openClusters,
      openComplaints,
      overdueCommitments: row.overdueCommitments,
      resolvedThisWeek: 0,
      intensity: computeIntensity(row.openClusters, openComplaints, row.overdueCommitments, maxScore),
      topIssues: row.infraAlerts,
      categories: row.infraAlerts.map((label) => ({ label, count: 1 })),
      infraAlerts: row.infraAlerts,
      recentSummary: `${row.openClusters} open clusters · ${row.overdueCommitments} overdue commitments`,
    }
  })
}

export function mapPriorityWardsToMapPoints(
  rows: WardPrioritySummary[],
  geoWards?: WardOption[],
): WardMapPoint[] {
  const scores = rows.map(
    (r) => r.openClusters * 12 + r.openComplaints * 2 + r.overdueCommitments * 8,
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
