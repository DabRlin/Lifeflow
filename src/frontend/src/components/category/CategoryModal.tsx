/**
 * CategoryModal Component
 * Modal dialog for creating and editing categories
 * 
 * Requirements: 1.1, 1.2, 2.1, 2.2
 */

import * as React from 'react'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { CardList, CardListCreate, CardListUpdate } from '@/api/types'

export interface CategoryModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback when modal is closed */
  onClose: () => void
  /** Category to edit (undefined for create mode) */
  list?: CardList
  /** Callback when form is submitted */
  onSubmit: (data: CardListCreate | CardListUpdate) => Promise<void>
  /** Whether the form is submitting */
  isLoading?: boolean
}

/**
 * Validates category name
 * Returns error message if invalid, null if valid
 */
export function validateCategoryName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return '分类名称不能为空'
  }
  return null
}

/**
 * CategoryModal - Modal for creating/editing categories
 * 
 * Features:
 * - Create mode: empty form for new category
 * - Edit mode: pre-filled form with current name
 * - Form validation: name cannot be empty or whitespace-only
 * - Auto-closes on successful submit
 */
export function CategoryModal({
  isOpen,
  onClose,
  list,
  onSubmit,
  isLoading = false,
}: CategoryModalProps) {
  const [name, setName] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  
  const isEditMode = !!list
  const title = isEditMode ? '编辑分类' : '创建分类'

  // Reset form when modal opens/closes or list changes
  React.useEffect(() => {
    if (isOpen) {
      setName(list?.name ?? '')
      setError(null)
    }
  }, [isOpen, list])

  const handleNameChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
    // Clear error when user starts typing
    if (error) {
      setError(null)
    }
  }, [error])

  const handleSubmit = React.useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate name
    const validationError = validateCategoryName(name)
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      await onSubmit({ name: name.trim() })
      onClose()
    } catch {
      // Error handling is done by the parent component
    }
  }, [name, onSubmit, onClose])

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }, [handleSubmit])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
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
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? '保存中...' : '保存'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div>
          <label 
            htmlFor="category-name" 
            className="block text-sm font-medium text-neutral-700 mb-3"
          >
            分类名称
          </label>
          <Input
            id="category-name"
            type="text"
            value={name}
            onChange={handleNameChange}
            onKeyDown={handleKeyDown}
            placeholder="输入分类名称"
            disabled={isLoading}
            autoFocus
            className={error ? 'border-error-500 focus:ring-error-500' : ''}
          />
          {error && (
            <p className="text-sm text-error-600 mt-2">{error}</p>
          )}
        </div>
      </form>
    </Modal>
  )
}

export default CategoryModal
