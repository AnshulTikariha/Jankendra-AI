import { useQuery } from '@tanstack/react-query'
import {
  fetchExploreComplaintById,
  fetchExploreComplaints,
  type ExploreComplaintsParams,
} from '../api/complaints'
import { mapComplaint } from '../lib/complaintMappers'
import { useAuthStore } from '../stores/useAuthStore'
import type { Complaint } from '../types/complaint'

export function useExploreComplaints(
  params: ExploreComplaintsParams | null,
  enabled = true,
) {
  const token = useAuthStore((s) => s.session?.accessToken)

  return useQuery({
    queryKey: ['complaints', 'explore', params],
    queryFn: async () => {
      if (!token || !params) throw new Error('Missing explore parameters')
      const response = await fetchExploreComplaints(token, params)
      return {
        total: response.total,
        complaints: response.complaints.map(mapComplaint),
      }
    },
    enabled: Boolean(token && params && enabled),
  })
}

export function useExploreComplaint(
  complaintId: string | null,
  location: { latitude: number; longitude: number } | null,
) {
  const token = useAuthStore((s) => s.session?.accessToken)

  return useQuery({
    queryKey: ['complaints', 'explore', complaintId, location],
    queryFn: async (): Promise<Complaint> => {
      if (!token || !complaintId || !location) throw new Error('Missing explore complaint context')
      const response = await fetchExploreComplaintById(
        token,
        complaintId,
        location.latitude,
        location.longitude,
      )
      return mapComplaint(response)
    },
    enabled: Boolean(token && complaintId && location),
  })
}
