import { useMemo } from 'react'
import { useComplaints } from './useComplaints'
import type { Complaint } from '../types/complaint'

export type CitizenStats = {
  open: number
  inProgress: number
  resolved: number
  total: number
  maxClusterCount: number
  recent: Complaint[]
}

export function useCitizenDashboard() {
  const { data, isLoading, isError, error, refetch } = useComplaints()
  const complaints = data?.complaints ?? []

  const stats = useMemo((): CitizenStats => {
    const open = complaints.filter((c) => c.status !== 'resolved').length
    const inProgress = complaints.filter(
      (c) => c.status === 'in_progress' || c.status === 'under_review',
    ).length
    const resolved = complaints.filter((c) => c.status === 'resolved').length
    const maxClusterCount = complaints.reduce((max, c) => Math.max(max, c.clusterCount), 0)
    const recent = [...complaints]
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 3)

    return {
      open,
      inProgress,
      resolved,
      total: complaints.length,
      maxClusterCount,
      recent,
    }
  }, [complaints])

  return {
    complaints,
    stats,
    isLoading,
    isError,
    error,
    refetch,
  }
}
