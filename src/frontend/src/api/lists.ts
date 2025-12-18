/**
 * Lists API Module
 * Validates: Requirements 1.4
 */

import { api } from './client'
import type { CardList, CardListCreate, CardListUpdate } from './types'

export const listsApi = {
  /**
   * Get all card lists ordered by sort_order
   */
  async getAll(): Promise<CardList[]> {
    return api.get<CardList[]>('/lists')
  },

  /**
   * Get a single card list by ID
   */
  async getById(listId: string): Promise<CardList> {
    return api.get<CardList>(`/lists/${listId}`)
  },

  /**
   * Create a new card list
   */
  async create(data: CardListCreate): Promise<CardList> {
    return api.post<CardList>('/lists', data)
  },

  /**
   * Update an existing card list
   */
  async update(listId: string, data: CardListUpdate): Promise<CardList> {
    return api.put<CardList>(`/lists/${listId}`, data)
  },

  /**
   * Delete a card list
   */
  async delete(listId: string): Promise<void> {
    return api.delete<void>(`/lists/${listId}`)
  },
}
