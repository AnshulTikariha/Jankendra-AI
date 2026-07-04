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

function findMapTemplate(wardName: string): WardMapPoint | undefined {
  return (
    wardMapPoints.find((w) => w.wardName === wardName) ??
    wardMapPoints.find((w) => wardName.includes(w.wardId))
  )
}

export function mapWardRowsToMapPoints(rows: WardRow[]): WardMapPoint[] {
  const scores = rows.map(
    (r) => r.openClusters * 12 + r.openClusters * 2 + r.overdueCommitments * 8,
  )
  const maxScore = Math.max(...scores, 1)

  return rows.map((row, index) => {
    const template = findMapTemplate(row.wardName)
    const lat = template?.lat ?? CONSTITUENCY_MAP_VIEW.center[0] + (index % 3) * 0.008
    const lng = template?.lng ?? CONSTITUENCY_MAP_VIEW.center[1] + Math.floor(index / 3) * 0.008
    const openComplaints = row.openClusters

    return {
      wardId: row.wardId,
      wardName: row.wardName,
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

export function mapPriorityWardsToMapPoints(rows: WardPrioritySummary[]): WardMapPoint[] {
  const scores = rows.map(
    (r) => r.openClusters * 12 + r.openComplaints * 2 + r.overdueCommitments * 8,
  )
  const maxScore = Math.max(...scores, 1)

  return rows.map((row, index) => {
    const template = findMapTemplate(row.wardName)
    const lat = template?.lat ?? CONSTITUENCY_MAP_VIEW.center[0] + (index % 3) * 0.008
    const lng = template?.lng ?? CONSTITUENCY_MAP_VIEW.center[1] + Math.floor(index / 3) * 0.008

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
