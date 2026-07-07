import { useQuery } from '@tanstack/react-query'
import {
  analyzeComplaintText,
  type ComplaintTextAnalysisResponse,
} from '../api/complaintAnalysis'
import { ApiError } from '../api/errors'
import { useAuthStore } from '../stores/useAuthStore'

const MIN_TEXT_LENGTH = 20

export function useComplaintInsights(complaintId: string | null, text: string) {
  const token = useAuthStore((s) => s.session?.accessToken)
  const trimmed = text.trim()

  const query = useQuery({
    queryKey: ['complaint-insights', complaintId],
    queryFn: async (): Promise<ComplaintTextAnalysisResponse> => {
      if (!token) throw new Error('Not authenticated')
      return analyzeComplaintText(token, trimmed)
    },
    enabled: Boolean(token && complaintId && trimmed.length >= MIN_TEXT_LENGTH),
    staleTime: 1000 * 60 * 10,
    retry: false,
  })

  const unavailable = query.error instanceof ApiError && query.error.status === 503

  return {
    insights: query.data ?? null,
    isLoading: query.isLoading && query.isFetching,
    isError: query.isError && !unavailable,
    unavailable,
    error: query.error,
  }
}
