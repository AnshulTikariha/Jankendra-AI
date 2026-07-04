import type {
  CommitmentAtRisk,
  DashboardKpis,
  PriorityItem,
  RecentActivity,
  WardRow,
} from '../types/dashboard'

export const demoKpis: DashboardKpis = {
  openComplaints: 47,
  openComplaintsTrend: 12,
  activeCommitments: 23,
  overdueCommitments: 6,
  resolvedThisWeek: 18,
  onTimeRatePct: 78,
  citizenComplaintsWeek: 24,
  hotWard: { id: '42', name: 'Ward 42' },
}

export const demoPriorityItems: PriorityItem[] = [
  {
    id: 'p1',
    type: 'complaint',
    title: 'Drainage overflow near market road',
    wardName: 'Ward 42',
    weight: 12,
    source: 'citizen',
  },
  {
    id: 'p2',
    type: 'commitment',
    title: 'Complete streetlight repair on Block C',
    wardName: 'Ward 15',
    weight: 8,
  },
  {
    id: 'p3',
    type: 'complaint',
    title: 'Irregular water supply — morning hours',
    wardName: 'Ward 42',
    weight: 7,
    source: 'citizen',
  },
  {
    id: 'p4',
    type: 'development',
    title: 'Prioritise footpath along school zone',
    wardName: 'Ward 8',
    weight: 6,
  },
  {
    id: 'p5',
    type: 'commitment',
    title: 'Submit PWD estimate for road resurfacing',
    wardName: 'Ward 12',
    weight: 5,
  },
]

export const demoCommitmentsAtRisk: CommitmentAtRisk[] = [
  {
    id: 'c1',
    title: 'Drainage channel clearing — monsoon prep',
    wardName: 'Ward 42',
    deadline: '2026-06-28',
    weightTier: 'W5',
    daysOverdue: 5,
  },
  {
    id: 'c2',
    title: 'Health camp follow-up for Ward 15',
    wardName: 'Ward 15',
    deadline: '2026-07-01',
    weightTier: 'W3',
    daysOverdue: 2,
  },
]

export const demoWardComparison: WardRow[] = [
  { wardId: '42', wardName: 'Ward 42', openClusters: 8, overdueCommitments: 4, infraAlerts: ['Drainage', 'Water'] },
  { wardId: '15', wardName: 'Ward 15', openClusters: 3, overdueCommitments: 1, infraAlerts: ['Roads'] },
  { wardId: '8', wardName: 'Ward 8', openClusters: 2, overdueCommitments: 0, infraAlerts: [] },
  { wardId: '12', wardName: 'Ward 12', openClusters: 4, overdueCommitments: 1, infraAlerts: ['Electricity'] },
]

export const demoRecentActivity: RecentActivity[] = [
  {
    id: 'a1',
    timestamp: '2026-07-03T10:32:00',
    type: 'citizen_complaint',
    summary: 'Water supply interruption reported',
    wardName: 'Ward 42',
  },
  {
    id: 'a2',
    timestamp: '2026-07-03T09:15:00',
    type: 'meeting',
    summary: 'Gram sabha transcript uploaded',
    wardName: 'Ward 15',
  },
  {
    id: 'a3',
    timestamp: '2026-07-02T16:40:00',
    type: 'staff_complaint',
    summary: 'Streetlight outage logged on behalf of resident',
    wardName: 'Ward 12',
  },
]
