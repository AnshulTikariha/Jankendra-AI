import { useMemo } from 'react'
import { useComplaints } from './useComplaints'
import {
  applyComplaintOverride,
  useComplaintOverridesStore,
} from '../stores/useComplaintOverridesStore'
import type { Complaint, ComplaintCategory, CitizenComplaintStatus } from '../types/complaint'

export type StaffComplaint = Complaint & {
  hasLocalOverride: boolean
  staffNote?: string
}

export type ComplaintQueueFilters = {
  wardId?: number
  category: ComplaintCategory | 'all'
  status: CitizenComplaintStatus | 'all'
  source: 'citizen' | 'staff' | 'all'
  search: string
}

export function useStaffComplaintsQueue(filters: ComplaintQueueFilters) {
  const overrides = useComplaintOverridesStore((s) => s.overrides)
  const { data, isLoading, isError, error, refetch } = useComplaints(filters.wardId)

  const complaints = useMemo((): StaffComplaint[] => {
    if (!data?.complaints) return []

    let items = data.complaints.map((c) =>
      applyComplaintOverride(c, overrides[c.id]),
    )

    if (filters.category !== 'all') {
      items = items.filter((c) => c.category === filters.category)
    }
    if (filters.status !== 'all') {
      items = items.filter((c) => c.status === filters.status)
    }
    if (filters.source !== 'all') {
      items = items.filter((c) => c.source === filters.source)
    }
    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase()
      items = items.filter(
        (c) =>
          c.publicReference.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.wardName.toLowerCase().includes(q) ||
          c.reporterPhone.includes(q),
      )
    }

    return items.sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    )
  }, [data?.complaints, overrides, filters])

  return {
    complaints,
    total: data?.total ?? 0,
    isLoading,
    isError,
    error,
    refetch,
  }
}
