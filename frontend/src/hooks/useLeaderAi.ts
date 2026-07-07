import { useQuery } from '@tanstack/react-query'
import {
  fetchComplaintThemes,
  fetchPriorityInsights,
  fetchWeeklyBriefing,
} from '../api/leaderAi'
import { useAuthStore } from '../stores/useAuthStore'

const AI_STALE_TIME = 5 * 60 * 1000

export function useWeeklyBriefing(enabled = true) {
  const token = useAuthStore((s) => s.session?.accessToken)

  return useQuery({
    queryKey: ['leader-ai', 'weekly-briefing'],
    queryFn: async () => {
      if (!token) throw new Error('Not authenticated')
      return fetchWeeklyBriefing(token)
    },
    enabled: Boolean(token) && enabled,
    staleTime: AI_STALE_TIME,
    retry: false,
  })
}

export function usePriorityInsights(enabled = true) {
  const token = useAuthStore((s) => s.session?.accessToken)

  return useQuery({
    queryKey: ['leader-ai', 'priority-insights'],
    queryFn: async () => {
      if (!token) throw new Error('Not authenticated')
      return fetchPriorityInsights(token)
    },
    enabled: Boolean(token) && enabled,
    staleTime: AI_STALE_TIME,
    retry: false,
  })
}

export function useComplaintThemes(days = 14, enabled = true) {
  const token = useAuthStore((s) => s.session?.accessToken)

  return useQuery({
    queryKey: ['leader-ai', 'complaint-themes', days],
    queryFn: async () => {
      if (!token) throw new Error('Not authenticated')
      return fetchComplaintThemes(token, days)
    },
    enabled: Boolean(token) && enabled,
    staleTime: AI_STALE_TIME,
    retry: false,
  })
}
