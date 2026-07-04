import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createComplaint, fetchComplaintById, fetchComplaints } from '../api/complaints'
import type { CreateComplaintPayload } from '../api/types/complaints'
import { mapComplaint } from '../lib/complaintMappers'
import { useAuthStore } from '../stores/useAuthStore'
import type { Complaint } from '../types/complaint'

export function useComplaints(wardId?: number) {
  const token = useAuthStore((s) => s.session?.accessToken)

  return useQuery({
    queryKey: ['complaints', wardId ?? 'all'],
    queryFn: async () => {
      if (!token) throw new Error('Not authenticated')
      const response = await fetchComplaints(token, wardId)
      return {
        total: response.total,
        complaints: response.complaints.map(mapComplaint),
      }
    },
    enabled: Boolean(token),
  })
}

export function useComplaint(complaintId: string | null) {
  const token = useAuthStore((s) => s.session?.accessToken)

  return useQuery({
    queryKey: ['complaints', complaintId],
    queryFn: async () => {
      if (!token || !complaintId) throw new Error('Missing complaint id')
      const response = await fetchComplaintById(token, complaintId)
      return mapComplaint(response)
    },
    enabled: Boolean(token && complaintId),
  })
}

export function useCreateComplaint() {
  const token = useAuthStore((s) => s.session?.accessToken)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateComplaintPayload): Promise<Complaint> => {
      if (!token) throw new Error('Not authenticated')
      const response = await createComplaint(token, payload)
      return mapComplaint(response)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['complaints'] })
    },
  })
}
