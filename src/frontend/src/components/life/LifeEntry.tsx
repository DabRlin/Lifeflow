/**
 * LifeEntry Component
 * Displays a single life entry in the timeline
 * Validates: Requirements 6.1, 6.4, 6.5
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/relative-time'
import type { LifeEntry as LifeEntryType } from '@/api/types'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LifeEntryProps {
  entry: LifeEntryType
  onUpdate?: (entryId: string, content: string) => Promise<void>
  onDelete?: (entryId: string) => void
  className?: string
}

export function LifeEntry({ entry, onUpdate, onDelete, className }: LifeEntryProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(entry.content)
  const [isSaving, setIsSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showFullDate, setShowFullDate] = useState(false)

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [])

  useEffect(() => {
    if (isEditing) {
      adjustTextareaHeight()
      textareaRef.current?.focus()
    }
  }, [isEditing, adjustTextareaHeight])

  useEffect(() => {
    setEditContent(entry.content)
  }, [entry.content])

  const handleStartEdit = () => {
    setEditContent(entry.content)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setEditContent(entry.content)
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!onUpdate || editContent.trim() === entry.content) {
      setIsEditing(false)
      return
    }

    const trimmedContent = editContent.trim()
    if (!trimmedContent) {
      return
    }

    setIsSaving(true)
    try {
      await onUpdate(entry.id, trimmedContent)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save entry:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancelEdit()
    }
    // Cmd/Ctrl + Enter to save
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSave()
    }
  }

  const relativeTime = formatRelativeTime(entry.created_at)
  const fullDate = new Date(entry.created_at).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div
      className={cn(
        'group relative bg-surface-container rounded-xl p-4',
        'shadow-elevation-1 hover:shadow-elevation-2',
        'transition-shadow duration-200',
        'border border-neutral-300',
        className
      )}
    >
      {/* Content */}
      {isEditing ? (
        <div className="space-y-3">
          <textarea
            ref={textareaRef}
            value={editContent}
            onChange={(e) => {
              setEditContent(e.target.value)
              adjustTextareaHeight()
            }}
            onKeyDown={handleKeyDown}
            className={cn(
              'w-full resize-none rounded-md border border-neutral-200',
              'p-2 text-neutral-900 text-sm leading-relaxed',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              'min-h-[60px]'
            )}
            placeholder="写点什么..."
            disabled={isSaving}
          />
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelEdit}
              disabled={isSaving}
            >
              <X className="h-4 w-4 mr-1" />
              取消
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !editContent.trim()}
            >
              <Check className="h-4 w-4 mr-1" />
              {isSaving ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-neutral-900 text-sm leading-relaxed whitespace-pre-wrap">
            {entry.content}
          </p>

          {/* Timestamp */}
          <div
            className="mt-3 relative inline-block"
            onMouseEnter={() => setShowFullDate(true)}
            onMouseLeave={() => setShowFullDate(false)}
          >
            <span className="text-xs text-neutral-400 cursor-default">
              {relativeTime}
            </span>
            {showFullDate && (
              <div className="absolute bottom-full left-0 mb-1 px-2 py-1 bg-neutral-800 text-white text-xs rounded whitespace-nowrap z-10">
                {fullDate}
              </div>
            )}
          </div>

          {/* Action buttons - show on hover */}
          <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onUpdate && (
              <button
                onClick={handleStartEdit}
                className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
                title="编辑"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(entry.id)}
                className="p-1.5 rounded-md text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="删除"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
