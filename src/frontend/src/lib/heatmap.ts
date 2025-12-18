/**
 * Heatmap Data Aggregation Utilities
 * Requirements: 5.4
 */

import type { CheckinRecord } from '@/api/types'

export interface HeatmapDataPoint {
  date: string
  count: number
}

/**
 * Aggregate check-in records by date for heatmap display
 * 
 * @param records - Array of check-in records
 * @returns Array of [date, count] tuples for ECharts heatmap
 */
export function aggregateCheckinsByDate(
  records: CheckinRecord[]
): Array<[string, number]> {
  // Group records by date
  const dateCountMap = new Map<string, number>()
  
  for (const record of records) {
    const date = record.checkin_date
    const currentCount = dateCountMap.get(date) || 0
    dateCountMap.set(date, currentCount + 1)
  }
  
  // Convert to array format for ECharts
  const result: Array<[string, number]> = []
  for (const [date, count] of dateCountMap) {
    result.push([date, count])
  }
  
  // Sort by date
  result.sort((a, b) => a[0].localeCompare(b[0]))
  
  return result
}

/**
 * Get the total check-in count for a specific date
 * 
 * @param records - Array of check-in records
 * @param targetDate - Date to get count for (YYYY-MM-DD format)
 * @returns Number of check-ins on that date
 */
export function getCheckinCountForDate(
  records: CheckinRecord[],
  targetDate: string
): number {
  return records.filter(record => record.checkin_date === targetDate).length
}

/**
 * Get the maximum check-in count across all dates
 * 
 * @param records - Array of check-in records
 * @returns Maximum check-in count on any single date
 */
export function getMaxCheckinCount(records: CheckinRecord[]): number {
  const aggregated = aggregateCheckinsByDate(records)
  if (aggregated.length === 0) return 0
  return Math.max(...aggregated.map(([, count]) => count))
}

/**
 * Fill in missing dates with zero counts for a date range
 * 
 * @param data - Existing heatmap data
 * @param startDate - Start date (YYYY-MM-DD format)
 * @param endDate - End date (YYYY-MM-DD format)
 * @returns Complete data with all dates filled in
 */
export function fillMissingDates(
  data: Array<[string, number]>,
  startDate: string,
  endDate: string
): Array<[string, number]> {
  const dataMap = new Map(data)
  const result: Array<[string, number]> = []
  
  let currentDate = new Date(startDate + 'T00:00:00Z')
  const end = new Date(endDate + 'T00:00:00Z')
  
  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0]
    const count = dataMap.get(dateStr) || 0
    result.push([dateStr, count])
    currentDate.setUTCDate(currentDate.getUTCDate() + 1)
  }
  
  return result
}

/**
 * Get check-in records for a specific year
 * 
 * @param records - Array of check-in records
 * @param year - Year to filter by
 * @returns Filtered records for the specified year
 */
export function getRecordsForYear(
  records: CheckinRecord[],
  year: number
): CheckinRecord[] {
  const yearStr = year.toString()
  return records.filter(record => record.checkin_date.startsWith(yearStr))
}

/**
 * Calculate intensity level (0-4) for a count value
 * 
 * @param count - Check-in count
 * @param maxCount - Maximum count for normalization
 * @returns Intensity level from 0 to 4
 */
export function calculateIntensityLevel(count: number, maxCount: number): number {
  if (count === 0) return 0
  if (maxCount === 0) return 0
  
  const ratio = count / maxCount
  if (ratio <= 0.25) return 1
  if (ratio <= 0.5) return 2
  if (ratio <= 0.75) return 3
  return 4
}
