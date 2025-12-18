/**
 * Life Entries React Query Hooks
 * Validates: Requirements 2.5
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { lifeEntriesApi, type GetLifeEntriesParams } from '../api/life-entries'
import type { LifeEntryCreate, LifeEntryUpdate } from '../api/types'

// Query keys
export const lifeEntryKeys = {
  all: ['life-entries'] as const,
  lists: () => [...lifeEntryKeys.all, 'list'] as const,
  list: (params?: GetLifeEntriesParams) => [...lifeEntryKeys.lists(), params] as const,
  grouped: (params?: GetLifeEntriesParams) => [...lifeEntryKeys.all, 'grouped', params] as const,
  infinite: () => [...lifeEntryKeys.all, 'infinite'] as const,
  details: () => [...lifeEntryKeys.all, 'detail'] as const,
  detail: (id: string) => [...lifeEntryKeys.details(), id] as const,
}

/**
 * Hook to fetch life entries with pagination
 */
export function useLifeEntries(params?: GetLifeEntriesParams) {
  return useQuery({
    queryKey: lifeEntryKeys.list(params),
    queryFn: () => lifeEntriesApi.getAll(params),
  })
}

/**
 * Hook to fetch life entries grouped by date
 */
export function useLifeEntriesGrouped(params?: GetLifeEntriesParams) {
  return useQuery({
    queryKey: lifeEntryKeys.grouped(params),
    queryFn: () => lifeEntriesApi.getGrouped(params),
  })
}

/**
 * Hook for infinite scroll of life entries
 */
export function useInfiniteLifeEntries(pageSize = 20) {
  return useInfiniteQuery({
    queryKey: lifeEntryKeys.infinite(),
    queryFn: ({ pageParam = 1 }) =>
      lifeEntriesApi.getAll({ page: pageParam, page_size: pageSize }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.total_pages) {
        return lastPage.page + 1
      }
      return undefined
    },
  })
}

/**
 * Hook to fetch a single life entry by ID
 */
export function useLifeEntry(entryId: string) {
  return useQuery({
    queryKey: lifeEntryKeys.detail(entryId),
    queryFn: () => lifeEntriesApi.getById(entryId),
    enabled: !!entryId,
  })
}

/**
 * Hook to create a new life entry
 */
export function useCreateLifeEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: LifeEntryCreate) => lifeEntriesApi.create(data),
    onSuccess: () => {
      // Invalidate all life entry queries to refetch
      queryClient.invalidateQueries({ queryKey: lifeEntryKeys.all })
    },
  })
}

/**
 * Hook to update an existing life entry
 */
export function useUpdateLifeEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ entryId, data }: { entryId: string; data: LifeEntryUpdate }) =>
      lifeEntriesApi.update(entryId, data),
    onSuccess: (updatedEntry) => {
      // Update the specific entry in cache
      queryClient.setQueryData(lifeEntryKeys.detail(updatedEntry.id), updatedEntry)
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: lifeEntryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: lifeEntryKeys.infinite() })
    },
  })
}

/**
 * Hook to delete a life entry
 */
export function useDeleteLifeEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ entryId, hardDelete = false }: { entryId: string; hardDelete?: boolean }) =>
      lifeEntriesApi.delete(entryId, hardDelete),
    onSuccess: async (_, { entryId }) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: lifeEntryKeys.detail(entryId) })
      // Force refetch all life entry queries immediately and wait for completion
      await queryClient.refetchQueries({ queryKey: lifeEntryKeys.all })
    },
  })
}
