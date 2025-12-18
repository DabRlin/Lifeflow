/**
 * TaskCreateForm Component
 * Inline form for creating new tasks with smooth animation
 * Requirements: 4.2
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, X, Loader2 } from 'lucide-react'
import type { TaskCreate } from '@/api/types'

export interface TaskCreateFormProps {
  listId?: string | null
  onSubmit: (data: TaskCreate) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  className?: string
}

export function TaskCreateForm({
  listId,
  onSubmit,
  onCancel,
  isLoading = false,
  className,
}: TaskCreateFormProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [title, setTitle] = React.useState('')
  const [isHabit, setIsHabit] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Focus input when expanded
  React.useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isExpanded])

  const handleExpand = React.useCallback(() => {
    setIsExpanded(true)
  }, [])

  const handleCollapse = React.useCallback(() => {
    setIsExpanded(false)
    setTitle('')
    setIsHabit(false)
    onCancel?.()
  }, [onCancel])

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      
      const trimmedTitle = title.trim()
      if (!trimmedTitle || isLoading) return

      try {
        await onSubmit({
          title: trimmedTitle,
          list_id: listId,
          is_habit: isHabit,
        })
        
        // Reset form after successful submission
        setTitle('')
        setIsHabit(false)
        // Keep expanded for quick consecutive additions
        inputRef.current?.focus()
      } catch {
        // Error handling is done by parent component
      }
    },
    [title, listId, isHabit, isLoading, onSubmit]
  )

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCollapse()
      }
    },
    [handleCollapse]
  )

  // Collapsed state - show add button
  if (!isExpanded) {
    return (
      <button
        onClick={handleExpand}
        className={cn(
          'w-full flex items-center gap-2 px-4 py-3',
          'text-neutral-500 hover:text-neutral-700',
          'bg-neutral-50 hover:bg-neutral-100',
          'rounded-lg border border-dashed border-neutral-200',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          className
        )}
      >
        <Plus className="w-5 h-5" />
        <span className="text-sm font-medium">添加任务</span>
      </button>
    )
  }

  // Expanded state - show form
  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      className={cn(
        'bg-white rounded-lg border border-neutral-200',
        'shadow-elevation-2 animate-scale-in',
        'overflow-hidden',
        className
      )}
    >
      <div className="p-4 space-y-3">
        {/* Title Input */}
        <Input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="输入任务标题..."
          disabled={isLoading}
          className="w-full"
          aria-label="任务标题"
        />

        {/* Options Row */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isHabit}
              onChange={(e) => setIsHabit(e.target.checked)}
              disabled={isLoading}
              className={cn(
                'w-4 h-4 rounded border-neutral-300',
                'text-primary-600 focus:ring-primary-500',
                'transition-colors'
              )}
            />
            <span className="text-sm text-neutral-600">设为习惯</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 px-4 py-3 bg-neutral-50 border-t border-neutral-100">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCollapse}
          disabled={isLoading}
        >
          <X className="w-4 h-4 mr-1" />
          取消
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={!title.trim() || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              创建中...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-1" />
              创建任务
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
