import { useMemo } from 'react'
import { useComplaintStore } from '../stores/useComplaintStore'
import type { Complaint } from '../types/complaint'

export type CitizenStats = {
  open: number
  inProgress: number
  resolved: number
  total: number
  maxClusterCount: number
  recent: Complaint[]
}

export function useCitizenDashboard(phone: string | undefined) {
  const complaints = useComplaintStore((s) => s.complaints)

  return useMemo(() => {
    if (!phone) {
      return {
        complaints: [] as Complaint[],
        stats: {
          open: 0,
          inProgress: 0,
          resolved: 0,
          total: 0,
          maxClusterCount: 0,
          recent: [],
        } satisfies CitizenStats,
      }
    }

    const mine = complaints.filter((c) => c.reporterPhone === phone)
    const open = mine.filter((c) => c.status !== 'resolved').length
    const inProgress = mine.filter(
      (c) => c.status === 'in_progress' || c.status === 'under_review',
    ).length
    const resolved = mine.filter((c) => c.status === 'resolved').length
    const maxClusterCount = mine.reduce((max, c) => Math.max(max, c.clusterCount), 0)
    const recent = [...mine]
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 3)

    return {
      complaints: mine,
      stats: {
        open,
        inProgress,
        resolved,
        total: mine.length,
        maxClusterCount,
        recent,
      },
    }
  }, [complaints, phone])
}
