/**
 * Stats API Module
 * Validates: Requirements 1.4
 */

import { api } from './client'
import type { DailyRingData, StatsOverview } from './types'

/**
 * Get the current timezone offset in minutes
 * Positive values are west of UTC (e.g., 300 for UTC-5)
 * Negative values are east of UTC (e.g., -480 for UTC+8)
 */
export function getTimezoneOffset(): number {
  return new Date().getTimezoneOffset()
}

export interface GetDailyRingParams {
  timezone_offset?: number
  target_date?: string
}

export const statsApi = {
  /**
   * Get statistics overview
   */
  async getOverview(timezoneOffset?: number): Promise<StatsOverview> {
    const offset = timezoneOffset ?? getTimezoneOffset()
    return api.get<StatsOverview>(`/stats/overview?timezone_offset=${offset}`)
  },

  /**
   * Get daily ring data showing habit completion progress
   */
  async getDailyRing(params?: GetDailyRingParams): Promise<DailyRingData> {
    const searchParams = new URLSearchParams()
    const offset = params?.timezone_offset ?? getTimezoneOffset()
    searchParams.set('timezone_offset', offset.toString())
    if (params?.target_date) {
      searchParams.set('target_date', params.target_date)
    }
    return api.get<DailyRingData>(`/stats/daily-ring?${searchParams.toString()}`)
  },

  /**
   * Get streak information
   */
  async getStreaks(): Promise<unknown[]> {
    return api.get<unknown[]>('/stats/streaks')
  },
}
