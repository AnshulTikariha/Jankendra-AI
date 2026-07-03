export type WardMapCategory = {
  label: string
  count: number
}

export type WardMapPoint = {
  wardId: string
  wardName: string
  lat: number
  lng: number
  openClusters: number
  openComplaints: number
  overdueCommitments: number
  resolvedThisWeek: number
  intensity: number
  topIssues: string[]
  categories: WardMapCategory[]
  infraAlerts: string[]
  recentSummary: string
}

/** Demo constituency — Bhopal area, Madhya Pradesh */
export const CONSTITUENCY_MAP_VIEW = {
  center: [23.2599, 77.4126] as [number, number],
  zoom: 12,
}

export const INDIA_MAP_VIEW = {
  center: [22.9734, 78.6569] as [number, number],
  zoom: 5,
}

export const constituencyBoundary: [number, number][] = [
  [23.238, 77.378],
  [23.278, 77.382],
  [23.284, 77.418],
  [23.272, 77.442],
  [23.248, 77.438],
  [23.242, 77.402],
]

const rawWards: Omit<WardMapPoint, 'intensity'>[] = [
  {
    wardId: '42',
    wardName: 'Ward 42',
    lat: 23.268,
    lng: 77.425,
    openClusters: 8,
    openComplaints: 19,
    overdueCommitments: 4,
    resolvedThisWeek: 3,
    topIssues: [
      'Drainage overflow near market road',
      'Irregular water supply — morning hours',
      'Standing water after monsoon showers',
    ],
    categories: [
      { label: 'Drainage', count: 9 },
      { label: 'Water', count: 6 },
      { label: 'Sanitation', count: 4 },
    ],
    infraAlerts: ['Drainage', 'Water'],
    recentSummary: 'Water supply interruption reported 2 hours ago',
  },
  {
    wardId: '12',
    wardName: 'Ward 12',
    lat: 23.252,
    lng: 77.398,
    openClusters: 4,
    openComplaints: 11,
    overdueCommitments: 1,
    resolvedThisWeek: 4,
    topIssues: [
      'Streetlight outage on main lane',
      'Potholes near bus stand',
    ],
    categories: [
      { label: 'Electricity', count: 5 },
      { label: 'Roads', count: 4 },
      { label: 'Other', count: 2 },
    ],
    infraAlerts: ['Electricity'],
    recentSummary: 'Streetlight outage logged on behalf of resident',
  },
  {
    wardId: '15',
    wardName: 'Ward 15',
    lat: 23.275,
    lng: 77.405,
    openClusters: 3,
    openComplaints: 8,
    overdueCommitments: 1,
    resolvedThisWeek: 5,
    topIssues: [
      'Health camp follow-up pending',
      'Road resurfacing estimate delayed',
    ],
    categories: [
      { label: 'Health', count: 3 },
      { label: 'Roads', count: 3 },
      { label: 'Water', count: 2 },
    ],
    infraAlerts: ['Roads'],
    recentSummary: 'Gram sabha transcript uploaded yesterday',
  },
  {
    wardId: '8',
    wardName: 'Ward 8',
    lat: 23.245,
    lng: 77.385,
    openClusters: 2,
    openComplaints: 5,
    overdueCommitments: 0,
    resolvedThisWeek: 2,
    topIssues: [
      'Footpath damage near school zone',
    ],
    categories: [
      { label: 'Roads', count: 3 },
      { label: 'Sanitation', count: 2 },
    ],
    infraAlerts: [],
    recentSummary: 'Development action flagged for school zone footpath',
  },
  {
    wardId: '51',
    wardName: 'Ward 51',
    lat: 23.255,
    lng: 77.432,
    openClusters: 5,
    openComplaints: 10,
    overdueCommitments: 2,
    resolvedThisWeek: 2,
    topIssues: [
      'Open manhole near community hall',
      'Garbage collection gaps in Block B',
    ],
    categories: [
      { label: 'Sanitation', count: 5 },
      { label: 'Drainage', count: 3 },
      { label: 'Health', count: 2 },
    ],
    infraAlerts: ['Sanitation'],
    recentSummary: 'Sanitation cluster weight increased this week',
  },
  {
    wardId: '63',
    wardName: 'Ward 63',
    lat: 23.262,
    lng: 77.415,
    openClusters: 3,
    openComplaints: 6,
    overdueCommitments: 1,
    resolvedThisWeek: 3,
    topIssues: [
      'Low voltage in evening peak hours',
      'Water tanker dependency in summer',
    ],
    categories: [
      { label: 'Electricity', count: 4 },
      { label: 'Water', count: 3 },
    ],
    infraAlerts: ['Electricity', 'Water'],
    recentSummary: 'Voltage complaints clustered in Block D',
  },
]

function computeIntensity(ward: Omit<WardMapPoint, 'intensity'>, maxScore: number): number {
  const score =
    ward.openClusters * 12 +
    ward.openComplaints * 2 +
    ward.overdueCommitments * 8
  return Math.round((score / maxScore) * 100)
}

const maxScore = Math.max(
  ...rawWards.map((w) => w.openClusters * 12 + w.openComplaints * 2 + w.overdueCommitments * 8),
)

export const wardMapPoints: WardMapPoint[] = rawWards
  .map((ward) => ({
    ...ward,
    intensity: computeIntensity(ward, maxScore),
  }))
  .sort((a, b) => b.intensity - a.intensity)

export function getWardBounds(wards: WardMapPoint[]): [number, number][] {
  return wards.map((w) => [w.lat, w.lng])
}

export function getIntensityColor(intensity: number): string {
  if (intensity >= 80) return '#b91c1c'
  if (intensity >= 60) return '#dc2626'
  if (intensity >= 45) return '#ea580c'
  if (intensity >= 30) return '#eab308'
  if (intensity >= 15) return '#84cc16'
  return '#22d3ee'
}

export function getIntensityLabel(intensity: number): string {
  if (intensity >= 80) return 'Critical'
  if (intensity >= 60) return 'High'
  if (intensity >= 45) return 'Elevated'
  if (intensity >= 30) return 'Moderate'
  if (intensity >= 15) return 'Low'
  return 'Minimal'
}

export const intensityLegend = [
  { label: 'Minimal', color: '#22d3ee', min: 0 },
  { label: 'Low', color: '#84cc16', min: 15 },
  { label: 'Moderate', color: '#eab308', min: 30 },
  { label: 'Elevated', color: '#ea580c', min: 45 },
  { label: 'High', color: '#dc2626', min: 60 },
  { label: 'Critical', color: '#b91c1c', min: 80 },
] as const
