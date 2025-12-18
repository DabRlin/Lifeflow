/**
 * Tasks React Query Hooks
 * Validates: Requirements 2.5
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi, type GetTasksParams } from '../api/tasks'
import type { TaskCreate, TaskUpdate, CheckinRequest } from '../api/types'

// Query keys
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (params?: GetTasksParams) => [...taskKeys.lists(), params] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  checkins: (id: string) => [...taskKeys.all, 'checkins', id] as const,
}

/**
 * Hook to fetch all tasks
 */
export function useTasks(params?: GetTasksParams) {
  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: () => tasksApi.getAll(params),
  })
}

/**
 * Hook to fetch a single task by ID
 */
export function useTask(taskId: string) {
  return useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: () => tasksApi.getById(taskId),
    enabled: !!taskId,
  })
}

/**
 * Hook to fetch check-in records for a task
 */
export function useTaskCheckins(taskId: string, limit = 30) {
  return useQuery({
    queryKey: taskKeys.checkins(taskId),
    queryFn: () => tasksApi.getCheckins(taskId, limit),
    enabled: !!taskId,
  })
}

/**
 * Hook to create a new task
 */
export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: TaskCreate) => tasksApi.create(data),
    onSuccess: () => {
      // Force refetch task lists immediately
      queryClient.refetchQueries({ queryKey: taskKeys.lists() })
      // Also invalidate stats since new habit affects daily ring
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}

/**
 * Hook to update an existing task
 */
export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: TaskUpdate }) =>
      tasksApi.update(taskId, data),
    onSuccess: (updatedTask) => {
      // Update the specific task in cache
      queryClient.setQueryData(taskKeys.detail(updatedTask.id), updatedTask)
      // Invalidate task lists to refetch
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
    },
  })
}

/**
 * Hook to delete a task
 */
export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, hardDelete = false }: { taskId: string; hardDelete?: boolean }) =>
      tasksApi.delete(taskId, hardDelete),
    onSuccess: async (_, { taskId }) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: taskKeys.detail(taskId) })
      // Force refetch all task queries immediately and wait for completion
      await queryClient.refetchQueries({ queryKey: taskKeys.all })
      // Also invalidate stats since deletion affects daily ring
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      // Invalidate all-checkins for heatmap
      queryClient.invalidateQueries({ queryKey: ['all-checkins'] })
    },
  })
}

/**
 * Hook to check in on a habit task
 */
export function useCheckinTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data?: CheckinRequest }) =>
      tasksApi.checkin(taskId, data),
    onSuccess: (updatedTask) => {
      // Update the specific task in cache
      queryClient.setQueryData(taskKeys.detail(updatedTask.id), updatedTask)
      // Invalidate task lists and checkins to refetch
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
      queryClient.invalidateQueries({ queryKey: taskKeys.checkins(updatedTask.id) })
      // Also invalidate stats since check-in affects daily ring
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      // Refresh notifications since check-in may generate achievement/daily complete notifications
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
