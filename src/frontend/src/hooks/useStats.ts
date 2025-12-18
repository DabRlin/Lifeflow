/**
 * Stats React Query Hooks
 * Validates: Requirements 2.5
 */

import { useQuery } from '@tanstack/react-query'
import { statsApi, type GetDailyRingParams } from '../api/stats'

// Query keys
export const statsKeys = {
  all: ['stats'] as const,
  overview: () => [...statsKeys.all, 'overview'] as const,
  dailyRing: (params?: GetDailyRingParams) => [...statsKeys.all, 'daily-ring', params] as const,
  streaks: () => [...statsKeys.all, 'streaks'] as const,
}

/**
 * Hook to fetch statistics overview
 */
export function useStatsOverview(timezoneOffset?: number) {
  return useQuery({
    queryKey: statsKeys.overview(),
    queryFn: () => statsApi.getOverview(timezoneOffset),
  })
}

/**
 * Hook to fetch daily ring data
 */
export function useDailyRing(params?: GetDailyRingParams) {
  return useQuery({
    queryKey: statsKeys.dailyRing(params),
    queryFn: () => statsApi.getDailyRing(params),
  })
}

/**
 * Hook to fetch streak information
 */
export function useStreaks() {
  return useQuery({
    queryKey: statsKeys.streaks(),
    queryFn: () => statsApi.getStreaks(),
  })
}
