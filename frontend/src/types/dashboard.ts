import type { UserRole } from './auth'

export type DashboardKpis = {
  openComplaints: number
  openComplaintsTrend: number
  activeCommitments: number
  overdueCommitments: number
  resolvedThisWeek: number
  onTimeRatePct: number
  citizenComplaintsWeek: number
  hotWard: { id: string; name: string }
}

export type PriorityItem = {
  id: string
  type: 'complaint' | 'commitment' | 'development'
  title: string
  wardName: string
  weight: number
  source?: 'citizen' | 'staff'
}

export type CommitmentAtRisk = {
  id: string
  title: string
  wardName: string
  deadline: string
  weightTier: string
  daysOverdue: number
}

export type WardRow = {
  wardId: string
  wardName: string
  openClusters: number
  openComplaints: number
  overdueCommitments: number
  infraAlerts: string[]
}

export type RecentActivity = {
  id: string
  timestamp: string
  type: 'citizen_complaint' | 'staff_complaint' | 'meeting' | 'commitment'
  summary: string
  wardName: string
}

export type DashboardData = {
  constituencyName: string
  kpis: DashboardKpis
  priorities: PriorityItem[]
  commitmentsAtRisk: CommitmentAtRisk[]
  wardComparison: WardRow[]
  recentActivity: RecentActivity[]
}

export function getDashboardGreeting(role: UserRole): string {
  if (role === 'leader') return 'Constituency overview'
  if (role === 'staff') return 'Your workspace today'
  return 'Citizen portal'
}
