/**
 * DeleteCategoryModal Component
 * Confirmation dialog for deleting categories
 * 
 * Requirements: 3.1, 3.2
 */

import * as React from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import type { CardList } from '@/api/types'

export interface DeleteCategoryModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback when modal is closed */
  onClose: () => void
  /** Category to delete */
  list: CardList | null
  /** Callback when deletion is confirmed */
  onConfirm: () => Promise<void>
  /** Whether the deletion is in progress */
  isLoading?: boolean
  /** Number of tasks associated with this category */
  taskCount?: number
}

/**
 * DeleteCategoryModal - Confirmation dialog for category deletion
 * 
 * Features:
 * - Displays confirmation message with category name
 * - Shows count of associated tasks that will become uncategorized
 * - Confirm/Cancel buttons
 * - Loading state during deletion
 */
export function DeleteCategoryModal({
  isOpen,
  onClose,
  list,
  onConfirm,
  isLoading = false,
  taskCount = 0,
}: DeleteCategoryModalProps) {
  const handleConfirm = React.useCallback(async () => {
    try {
      await onConfirm()
      onClose()
    } catch {
      // Error handling is done by the parent component
    }
  }, [onConfirm, onClose])

  if (!list) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="删除分类"
      footer={
        <>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? '删除中...' : '删除'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p>
          确定要删除分类 <span className="font-semibold text-neutral-700">"{list.name}"</span> 吗？
        </p>
        {taskCount > 0 && (
          <p className="text-sm text-warning-600 bg-warning-50 px-3 py-2 rounded-lg">
            该分类下有 {taskCount} 个任务，删除后这些任务将变为未分类状态。
          </p>
        )}
        <p className="text-sm text-neutral-500">
          此操作无法撤销。
        </p>
      </div>
    </Modal>
  )
}

export default DeleteCategoryModal
