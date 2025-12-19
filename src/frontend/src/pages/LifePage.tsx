/**
 * LifePage Component
 * Main page for life entries with timeline display
 * Validates: Requirements 6.1-6.6
 */

import { useCallback, useState } from 'react'
import { useInfiniteLifeEntries, useCreateLifeEntry, useUpdateLifeEntry, useDeleteLifeEntry } from '@/hooks/useLifeEntries'
import { InfiniteTimeline, TimelineSkeleton, EntryInput } from '@/components/life'
import { EmptyState } from '@/components/common/EmptyState'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import type { LifeEntry } from '@/api/types'

export function LifePage() {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  
  // Fetch life entries with infinite scroll
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteLifeEntries(20)

  // Mutations
  const createMutation = useCreateLifeEntry()
  const updateMutation = useUpdateLifeEntry()
  const deleteMutation = useDeleteLifeEntry()

  // Flatten pages into single array
  const entries: LifeEntry[] = data?.pages.flatMap(page => page.items) ?? []

  // Handle create entry
  const handleCreateEntry = useCallback(async (content: string) => {
    await createMutation.mutateAsync({ content })
  }, [createMutation])

  // Handle update entry
  const handleUpdateEntry = useCallback(async (entryId: string, content: string) => {
    await updateMutation.mutateAsync({ entryId, data: { content } })
  }, [updateMutation])

  // Handle delete entry
  const handleDeleteEntry = useCallback((entryId: string) => {
    setDeleteConfirmId(entryId)
  }, [])

  // Confirm delete
  const confirmDelete = useCallback(async () => {
    if (deleteConfirmId) {
      try {
        await deleteMutation.mutateAsync({ entryId: deleteConfirmId })
        setDeleteConfirmId(null)
      } catch (err) {
        console.error('Failed to delete entry:', err)
        // Still close the modal on error
        setDeleteConfirmId(null)
      }
    }
  }, [deleteConfirmId, deleteMutation])

  // Cancel delete
  const cancelDelete = useCallback(() => {
    setDeleteConfirmId(null)
  }, [])

  return (
    <div style={{ width: '100%' }}>
      {/* Page Description */}
      <div style={{ marginBottom: '1.5rem' }}>
        <p className="text-sm text-neutral-500">记录生活中的点滴时刻</p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '42rem', marginLeft: 'auto', marginRight: 'auto' }}>
          {/* Entry Input */}
          <EntryInput
            onSubmit={handleCreateEntry}
            disabled={createMutation.isPending}
            className="mb-6"
          />

          {/* Error State */}
          {isError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">加载失败</p>
                <p className="text-sm text-red-600">
                  {error instanceof Error ? error.message : '无法加载生活记录'}
                </p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && <TimelineSkeleton count={5} />}

          {/* Empty State */}
          {!isLoading && !isError && entries.length === 0 && (
            <EmptyState
              type="life"
              title="还没有记录"
              description="开始记录你的生活点滴吧"
            />
          )}

          {/* Timeline */}
          {!isLoading && entries.length > 0 && (
            <InfiniteTimeline
              entries={entries}
              isFetchingNextPage={isFetchingNextPage}
              hasNextPage={hasNextPage ?? false}
              fetchNextPage={fetchNextPage}
              onUpdateEntry={handleUpdateEntry}
              onDeleteEntry={handleDeleteEntry}
            />
          )}
        </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={cancelDelete}
        title="确认删除"
        footer={
          <>
            <Button variant="outline" onClick={cancelDelete}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? '删除中...' : '删除'}
            </Button>
          </>
        }
      >
        <p>确定要删除这条记录吗？此操作无法撤销。</p>
      </Modal>
    </div>
  )
}
