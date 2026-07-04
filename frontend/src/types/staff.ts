import type { ApiCommitment } from '../api/types/staff'

export type Commitment = {
  id: string
  title: string
  description: string
  wardId: number | null
  wardName: string | null
  assignee: string | null
  deadline: string
  weight: number
  weightTier: string
  status: string
  daysOverdue: number
  sourceMeetingId: string | null
  createdAt: string
}

export type WardOption = {
  id: number
  name: string
  code: string
  population: number | null
  registeredVoters: number | null
}

export type DevelopmentPriority = {
  id: string
  wardId: number
  wardName: string
  title: string
  category: string
  sourceType: string
  score: number
  rank: number
  reasons: string[]
  citizenImpact: number
  urgency: number
  commitmentPressure: number
  populationFactor: number
}

export type WardPrioritySummary = {
  wardId: number
  wardName: string
  totalScore: number
  openClusters: number
  openComplaints: number
  overdueCommitments: number
  infraAlerts: number
  population: number | null
  topAction: string | null
}

export type DigestTotals = {
  complaintsOpened: number
  activeCommitments: number
  overdueCommitments: number
  completedCommitments: number
  openClusters: number
  criticalInfraAlerts: number
  totalPopulation: number
  totalRegisteredVoters: number
}

export type WardDigestMetrics = {
  wardId: number
  wardName: string
  population: number | null
  registeredVoters: number | null
  complaintsOpened: number
  complaintsByCategory: Record<string, number>
  activeCommitments: number
  overdueCommitments: number
  completedCommitments: number
  openClusters: number
  criticalInfraAlerts: number
}

export function mapCommitment(item: ApiCommitment): Commitment {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    wardId: item.ward_id,
    wardName: item.ward_name,
    assignee: item.assignee,
    deadline: item.deadline,
    weight: item.weight,
    weightTier: item.weight_tier,
    status: item.status,
    daysOverdue: item.days_overdue,
    sourceMeetingId: item.source_meeting_id,
    createdAt: item.created_at,
  }
}
