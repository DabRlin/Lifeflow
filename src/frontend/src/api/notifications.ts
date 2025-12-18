/**
 * Notifications API Client
 * Validates: Requirements 4.2
 */

import { api } from './client'

// Notification Types
export type NotificationType = 'habit_reminder' | 'achievement' | 'daily_complete' | 'system'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  data: {
    habit_id?: string
    habit_title?: string
    streak?: number
    milestone?: number
    at_risk?: boolean
    completed_count?: number
    date?: string
  } | null
  is_read: boolean
  created_at: string
  user_id: string
}

export interface NotificationListResponse {
  notifications: Notification[]
  total: number
  unread_count: number
}

export interface UnreadCountResponse {
  count: number
}

export interface NotificationCreate {
  type: NotificationType
  title: string
  message?: string
  data?: Record<string, unknown>
}

/**
 * Notifications API
 */
export const notificationsApi = {
  /**
   * Get notifications list
   */
  async getNotifications(params?: {
    limit?: number
    offset?: number
    unread_only?: boolean
  }): Promise<NotificationListResponse> {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.offset) searchParams.set('offset', params.offset.toString())
    if (params?.unread_only) searchParams.set('unread_only', 'true')
    
    const query = searchParams.toString()
    return api.get<NotificationListResponse>(`/notifications${query ? `?${query}` : ''}`)
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<UnreadCountResponse> {
    return api.get<UnreadCountResponse>('/notifications/unread-count')
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string): Promise<Notification> {
    return api.patch<Notification>(`/notifications/${id}/read`)
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ message: string; count: number }> {
    return api.post<{ message: string; count: number }>('/notifications/read-all')
  },

  /**
   * Delete a notification
   */
  async deleteNotification(id: string): Promise<void> {
    return api.delete(`/notifications/${id}`)
  },

  /**
   * Generate habit reminders (called on app load)
   */
  async generateReminders(): Promise<Notification[]> {
    return api.post<Notification[]>('/notifications/generate-reminders')
  },

  /**
   * Generate at-risk notifications
   */
  async generateAtRiskNotifications(): Promise<Notification[]> {
    return api.post<Notification[]>('/notifications/generate-at-risk')
  },
}
