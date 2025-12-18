/**
 * Tasks API Module
 * Validates: Requirements 1.4
 */

import { api } from './client'
import type { Task, TaskCreate, TaskUpdate, CheckinRecord, CheckinRequest } from './types'

export interface GetTasksParams {
  list_id?: string
  include_deleted?: boolean
}

export const tasksApi = {
  /**
   * Get all tasks, optionally filtered by list_id
   */
  async getAll(params?: GetTasksParams): Promise<Task[]> {
    const searchParams = new URLSearchParams()
    if (params?.list_id) {
      searchParams.set('list_id', params.list_id)
    }
    if (params?.include_deleted) {
      searchParams.set('include_deleted', 'true')
    }
    const query = searchParams.toString()
    return api.get<Task[]>(`/tasks${query ? `?${query}` : ''}`)
  },

  /**
   * Get a single task by ID
   */
  async getById(taskId: string): Promise<Task> {
    return api.get<Task>(`/tasks/${taskId}`)
  },

  /**
   * Create a new task
   */
  async create(data: TaskCreate): Promise<Task> {
    return api.post<Task>('/tasks', data)
  },

  /**
   * Update an existing task
   */
  async update(taskId: string, data: TaskUpdate): Promise<Task> {
    return api.put<Task>(`/tasks/${taskId}`, data)
  },

  /**
   * Delete a task (soft delete by default)
   */
  async delete(taskId: string, hardDelete = false): Promise<void> {
    const query = hardDelete ? '?hard_delete=true' : ''
    return api.delete<void>(`/tasks/${taskId}${query}`)
  },

  /**
   * Check in on a habit task
   */
  async checkin(taskId: string, data?: CheckinRequest): Promise<Task> {
    return api.post<Task>(`/tasks/${taskId}/checkin`, data)
  },

  /**
   * Get check-in records for a task
   */
  async getCheckins(taskId: string, limit = 30): Promise<CheckinRecord[]> {
    return api.get<CheckinRecord[]>(`/tasks/${taskId}/checkins?limit=${limit}`)
  },
}
