import { useMemo } from 'react'
import { useComplaints } from './useComplaints'
import type { ComplaintCategory } from '../types/complaint'

export function useSimilarComplaints(wardId: number | '', category: ComplaintCategory) {
  const { data, isLoading } = useComplaints()

  const similar = useMemo(() => {
    if (wardId === '' || !data?.complaints) return []
    return data.complaints.filter(
      (c) => c.wardId === String(wardId) && c.category === category,
    )
  }, [data?.complaints, wardId, category])

  const clusterCount = similar.reduce((max, c) => Math.max(max, c.clusterCount), similar.length)

  return {
    count: similar.length,
    clusterCount,
    isLoading,
    hasSimilar: similar.length > 0,
  }
}
