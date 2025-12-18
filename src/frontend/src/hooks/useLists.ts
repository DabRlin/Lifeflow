/**
 * Lists React Query Hooks
 * Validates: Requirements 2.5
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listsApi } from '../api/lists'
import type { CardListCreate, CardListUpdate } from '../api/types'

// Query keys
export const listKeys = {
  all: ['lists'] as const,
  lists: () => [...listKeys.all, 'list'] as const,
  list: () => [...listKeys.lists()] as const,
  details: () => [...listKeys.all, 'detail'] as const,
  detail: (id: string) => [...listKeys.details(), id] as const,
}

/**
 * Hook to fetch all card lists
 */
export function useLists() {
  return useQuery({
    queryKey: listKeys.list(),
    queryFn: () => listsApi.getAll(),
  })
}

/**
 * Hook to fetch a single card list by ID
 */
export function useList(listId: string) {
  return useQuery({
    queryKey: listKeys.detail(listId),
    queryFn: () => listsApi.getById(listId),
    enabled: !!listId,
  })
}

/**
 * Hook to create a new card list
 */
export function useCreateList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CardListCreate) => listsApi.create(data),
    onSuccess: () => {
      // Invalidate all lists to refetch
      queryClient.invalidateQueries({ queryKey: listKeys.lists() })
    },
  })
}

/**
 * Hook to update an existing card list
 */
export function useUpdateList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ listId, data }: { listId: string; data: CardListUpdate }) =>
      listsApi.update(listId, data),
    onSuccess: (updatedList) => {
      // Update the specific list in cache
      queryClient.setQueryData(listKeys.detail(updatedList.id), updatedList)
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: listKeys.lists() })
    },
  })
}

/**
 * Hook to delete a card list
 */
export function useDeleteList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (listId: string) => listsApi.delete(listId),
    onSuccess: (_, listId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: listKeys.detail(listId) })
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: listKeys.lists() })
      // Also invalidate tasks since they may reference this list
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
