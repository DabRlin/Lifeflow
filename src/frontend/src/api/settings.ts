/**
 * Settings API Module
 * Validates: Requirements 1.4
 */

import { api } from './client'
import type { Settings, ExportData } from './types'

export const settingsApi = {
  /**
   * Get all settings
   */
  async getAll(): Promise<Settings> {
    return api.get<Settings>('/settings')
  },

  /**
   * Update settings
   */
  async update(updates: Partial<Settings>): Promise<Settings> {
    return api.put<Settings>('/settings', updates)
  },

  /**
   * Export all user data as JSON
   */
  async exportData(): Promise<ExportData> {
    return api.get<ExportData>('/settings/export')
  },
}
