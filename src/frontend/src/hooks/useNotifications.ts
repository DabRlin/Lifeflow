/**
 * Notifications React Query Hooks
 * Validates: Requirements 3.1, 3.2, 3.3
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '../api/notifications'

// Query keys
export const notificationKeys = {
  all: ['notifications'] as const,
  list: (params?: { limit?: number; offset?: number; unread_only?: boolean }) =>
    [...notificationKeys.all, 'list', params] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
}

/**
 * Hook to fetch notifications
 */
export function useNotifications(params?: {
  limit?: number
  offset?: number
  unread_only?: boolean
}) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => notificationsApi.getNotifications(params),
  })
}

/**
 * Hook to fetch unread notification count
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationsApi.getUnreadCount(),
    // Poll every 30 seconds for new notifications
    refetchInterval: 30000,
  })
}

/**
 * Hook to mark a notification as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: async () => {
      // Refetch all notification queries to ensure UI is updated
      await queryClient.refetchQueries({ queryKey: notificationKeys.all })
    },
  })
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: async () => {
      // Refetch all notification queries to ensure UI is updated
      await queryClient.refetchQueries({ queryKey: notificationKeys.all })
    },
  })
}

/**
 * Hook to delete a notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => notificationsApi.deleteNotification(id),
    onSuccess: async () => {
      // Refetch all notification queries to ensure UI is updated
      await queryClient.refetchQueries({ queryKey: notificationKeys.all })
    },
  })
}

/**
 * Hook to generate habit reminders
 */
export function useGenerateReminders() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => notificationsApi.generateReminders(),
    onSuccess: () => {
      // Refetch notifications
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

/**
 * Hook to generate at-risk notifications
 */
export function useGenerateAtRiskNotifications() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => notificationsApi.generateAtRiskNotifications(),
    onSuccess: () => {
      // Refetch notifications
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}
