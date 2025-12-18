/**
 * Life Entries API Module
 * Validates: Requirements 1.4
 */

import { api } from './client'
import type {
  LifeEntry,
  LifeEntryCreate,
  LifeEntryUpdate,
  LifeEntryPaginatedResponse,
  LifeEntryGroupedResponse,
} from './types'

export interface GetLifeEntriesParams {
  page?: number
  page_size?: number
  include_deleted?: boolean
}

export const lifeEntriesApi = {
  /**
   * Get all life entries with pagination
   */
  async getAll(params?: GetLifeEntriesParams): Promise<LifeEntryPaginatedResponse> {
    const searchParams = new URLSearchParams()
    if (params?.page) {
      searchParams.set('page', params.page.toString())
    }
    if (params?.page_size) {
      searchParams.set('page_size', params.page_size.toString())
    }
    if (params?.include_deleted) {
      searchParams.set('include_deleted', 'true')
    }
    const query = searchParams.toString()
    return api.get<LifeEntryPaginatedResponse>(`/life-entries${query ? `?${query}` : ''}`)
  },

  /**
   * Get life entries grouped by date with pagination
   */
  async getGrouped(params?: GetLifeEntriesParams): Promise<LifeEntryGroupedResponse> {
    const searchParams = new URLSearchParams()
    if (params?.page) {
      searchParams.set('page', params.page.toString())
    }
    if (params?.page_size) {
      searchParams.set('page_size', params.page_size.toString())
    }
    if (params?.include_deleted) {
      searchParams.set('include_deleted', 'true')
    }
    const query = searchParams.toString()
    return api.get<LifeEntryGroupedResponse>(`/life-entries/grouped${query ? `?${query}` : ''}`)
  },

  /**
   * Get a single life entry by ID
   */
  async getById(entryId: string): Promise<LifeEntry> {
    return api.get<LifeEntry>(`/life-entries/${entryId}`)
  },

  /**
   * Create a new life entry
   */
  async create(data: LifeEntryCreate): Promise<LifeEntry> {
    return api.post<LifeEntry>('/life-entries', data)
  },

  /**
   * Update an existing life entry
   */
  async update(entryId: string, data: LifeEntryUpdate): Promise<LifeEntry> {
    return api.put<LifeEntry>(`/life-entries/${entryId}`, data)
  },

  /**
   * Delete a life entry (soft delete by default)
   */
  async delete(entryId: string, hardDelete = false): Promise<void> {
    const query = hardDelete ? '?hard_delete=true' : ''
    return api.delete<void>(`/life-entries/${entryId}${query}`)
  },
}
