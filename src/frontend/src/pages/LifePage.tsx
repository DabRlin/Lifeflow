/**
 * LifePage Component
 * Main page for life entries with timeline display
 * Validates: Requirements 6.1-6.6
 */

import { useCallback, useState } from 'react'
import { useInfiniteLifeEntries, useCreateLifeEntry, useUpdateLifeEntry, useDeleteLifeEntry } from '@/hooks/useLifeEntries'
import { InfiniteTimeline, TimelineSkeleton, EntryInput } from '@/components/life'
import { EmptyState } from '@/components/common/EmptyState'
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
      {deleteConfirmId && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Backdrop */}
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }}
            onClick={cancelDelete}
          />
          
          {/* Modal */}
          <div 
            style={{
              position: 'relative',
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              maxWidth: '24rem',
              width: '100%',
              margin: '0 1rem',
            }}
            className="shadow-elevation-4"
          >
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#171717' }}>
              确认删除
            </h3>
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#525252' }}>
              确定要删除这条记录吗？此操作无法撤销。
            </p>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={cancelDelete}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  borderRadius: '0.5rem',
                  color: '#404040',
                  backgroundColor: '#f5f5f5',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  borderRadius: '0.5rem',
                  color: 'white',
                  backgroundColor: deleteMutation.isPending ? '#fca5a5' : '#ef4444',
                  border: 'none',
                  cursor: deleteMutation.isPending ? 'not-allowed' : 'pointer',
                  opacity: deleteMutation.isPending ? 0.5 : 1,
                }}
              >
                {deleteMutation.isPending ? '删除中...' : '删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
