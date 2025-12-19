/**
 * TaskCard Component
 * Displays a single task card with hover/focus states and completion animation
 * Requirements: 4.1, 4.5
 */

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn, getLocalDateString } from '@/lib/utils'
import type { Task, TaskUpdate } from '@/api/types'
import { Check, GripVertical, Flame, Clock, Edit2, Trash2, X, Save } from 'lucide-react'

export interface TaskCardProps {
  task: Task
  onComplete?: (task: Task) => void
  onSave?: (taskId: string, data: TaskUpdate) => Promise<void>
  onDelete?: (task: Task) => void | Promise<void>
  isDragging?: boolean
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
  className?: string
}

export function TaskCard({
  task,
  onComplete,
  onSave,
  onDelete,
  isDragging = false,
  dragHandleProps,
  className,
}: TaskCardProps) {
  const [isCompleting, setIsCompleting] = React.useState(false)
  const [showCompleted, setShowCompleted] = React.useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  
  // Inline editing state
  const [isEditing, setIsEditing] = React.useState(false)
  const [editTitle, setEditTitle] = React.useState(task.title)
  const [editContent, setEditContent] = React.useState(task.content || '')
  const [isSaving, setIsSaving] = React.useState(false)
  const titleInputRef = React.useRef<HTMLInputElement>(null)

  // Check if habit was completed today
  const isCompletedToday = React.useMemo(() => {
    if (!task.is_habit || !task.last_checkin_date) return false
    const today = getLocalDateString()
    return task.last_checkin_date === today
  }, [task.is_habit, task.last_checkin_date])

  const handleComplete = React.useCallback(() => {
    if (isCompleting || isCompletedToday) return
    
    setIsCompleting(true)
    setShowCompleted(true)
    
    // Trigger completion callback after animation starts
    setTimeout(() => {
      onComplete?.(task)
      setIsCompleting(false)
      // For habits, keep completed state visible; for tasks, they will be removed
      if (task.is_habit) {
        setTimeout(() => {
          setShowCompleted(false)
        }, 500)
      }
    }, 300)
  }, [task, onComplete, isCompleting, isCompletedToday])

  // Start editing
  const handleStartEdit = React.useCallback(() => {
    setEditTitle(task.title)
    setEditContent(task.content || '')
    setIsEditing(true)
    // Focus input after render
    setTimeout(() => titleInputRef.current?.focus(), 0)
  }, [task])

  // Cancel editing
  const handleCancelEdit = React.useCallback(() => {
    setIsEditing(false)
    setEditTitle(task.title)
    setEditContent(task.content || '')
  }, [task])

  // Save editing
  const handleSaveEdit = React.useCallback(async () => {
    if (!onSave || isSaving || !editTitle.trim()) return
    
    setIsSaving(true)
    try {
      await onSave(task.id, {
        title: editTitle.trim(),
        content: editContent.trim() || undefined,
      })
      setIsEditing(false)
    } catch {
      // Error handled by parent
    } finally {
      setIsSaving(false)
    }
  }, [task.id, editTitle, editContent, onSave, isSaving])

  // Handle key press in edit mode
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancelEdit()
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSaveEdit()
    }
  }, [handleCancelEdit, handleSaveEdit])

  const handleDeleteClick = React.useCallback(() => {
    setShowDeleteConfirm(true)
  }, [])

  const handleDeleteConfirm = React.useCallback(async () => {
    if (!onDelete || isDeleting) return
    setIsDeleting(true)
    try {
      await onDelete(task)
    } catch (error) {
      console.error('Delete failed:', error)
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }, [task, onDelete, isDeleting])

  const handleDeleteCancel = React.useCallback(() => {
    setShowDeleteConfirm(false)
  }, [])

  return (
    <div
      className={cn(
        'group relative bg-surface-container rounded-xl border border-neutral-300',
        'shadow-elevation-1 hover:shadow-elevation-2',
        'transition-all duration-200 ease-out',
        'focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2',
        isDragging && 'shadow-elevation-3 scale-[1.02] rotate-1',
        isCompleting && 'scale-[0.98]',
        className
      )}
      tabIndex={0}
      role="article"
      aria-label={`任务: ${task.title}`}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Drag Handle */}
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            className={cn(
              'flex-shrink-0 cursor-grab active:cursor-grabbing',
              'text-neutral-300 hover:text-neutral-500',
              'opacity-0 group-hover:opacity-100 transition-opacity',
              '-ml-1 mt-0.5'
            )}
          >
            <GripVertical className="w-5 h-5" />
          </div>
        )}

        {/* Completion Button */}
        <button
          onClick={handleComplete}
          disabled={isCompleting || (task.is_habit && isCompletedToday)}
          className={cn(
            'flex-shrink-0 w-6 h-6 rounded-full border-2',
            'flex items-center justify-center',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            task.is_habit
              ? isCompletedToday
                ? 'bg-primary-100 border-primary-200 text-primary-600'
                : 'border-neutral-400 hover:bg-primary-50 hover:border-primary-300'
              : 'border-neutral-400 hover:bg-primary-50 hover:border-primary-300',
            isCompleting && 'animate-pulse'
          )}
          aria-label={task.is_habit ? '打卡' : '完成任务'}
        >
          {(showCompleted || isCompletedToday) && (
            <Check className="w-4 h-4 animate-scale-in" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            // Edit Mode
            <div className="space-y-2" onKeyDown={handleKeyDown}>
              <input
                ref={titleInputRef}
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="任务标题"
                disabled={isSaving}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  border: '1px solid #e5e5e5',
                  borderRadius: '0.375rem',
                  outline: 'none',
                }}
              />
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="任务描述（可选）"
                disabled={isSaving}
                rows={2}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  fontSize: '0.875rem',
                  border: '1px solid #e5e5e5',
                  borderRadius: '0.375rem',
                  outline: 'none',
                  resize: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  style={{
                    padding: '0.375rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    borderRadius: '0.375rem',
                    color: '#525252',
                    backgroundColor: '#f5f5f5',
                    border: 'none',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <X style={{ width: '0.875rem', height: '0.875rem' }} />
                  取消
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving || !editTitle.trim()}
                  style={{
                    padding: '0.375rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    borderRadius: '0.375rem',
                    color: 'white',
                    backgroundColor: isSaving || !editTitle.trim() ? '#93c5fd' : '#3b82f6',
                    border: 'none',
                    cursor: isSaving || !editTitle.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <Save style={{ width: '0.875rem', height: '0.875rem' }} />
                  {isSaving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          ) : (
            // View Mode
            <>
              <h3
                className={cn(
                  'text-neutral-700 font-medium leading-snug',
                  'transition-colors duration-200',
                  showCompleted && !task.is_habit && 'line-through text-neutral-500'
                )}
              >
                {task.title}
              </h3>
              
              {task.content && (
                <p className="text-neutral-600 text-sm mt-1 line-clamp-2">
                  {task.content}
                </p>
              )}

              {/* Meta Info */}
              <div className="flex items-center gap-3 mt-2">
                {/* Streak Badge for Habits */}
                {task.is_habit && task.current_streak > 0 && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 text-xs font-medium',
                      'px-2 py-0.5 rounded-full',
                      task.current_streak >= 7
                        ? 'bg-secondary-50 text-primary-600'
                        : 'bg-surface-container-high text-neutral-600'
                    )}
                  >
                    <Flame className="w-3 h-3" />
                    {task.current_streak} 天
                  </span>
                )}

                {/* Reminder Time */}
                {task.reminder_time && (
                  <span className="inline-flex items-center gap-1 text-xs text-neutral-400">
                    <Clock className="w-3 h-3" />
                    {task.reminder_time}
                  </span>
                )}

                {/* Habit Badge */}
                {task.is_habit && (
                  <span className="text-xs text-primary-500 font-medium">
                    习惯
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Action Buttons - Only show when not editing */}
        {!isEditing && (
          <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            {/* Edit Button */}
            {onSave && (
              <button
                onClick={handleStartEdit}
                className={cn(
                  'p-2 rounded-md',
                  'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100',
                  'transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500'
                )}
                aria-label="编辑任务"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            
            {/* Delete Button */}
            {onDelete && (
              <button
                onClick={handleDeleteClick}
                className={cn(
                  'p-2 rounded-md',
                  'text-neutral-400 hover:text-red-500 hover:bg-red-50',
                  'transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-red-500'
                )}
                aria-label="删除任务"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Completion Animation Overlay */}
      {isCompleting && (
        <div
          className={cn(
            'absolute inset-0 rounded-lg',
            'bg-success-500/10 animate-fade-in',
            'pointer-events-none'
          )}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && createPortal(
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
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
            onClick={handleDeleteCancel}
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
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#171717' }}>
              确认删除
            </h3>
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#525252' }}>
              确定要删除任务 "{task.title}" 吗？此操作无法撤销。
            </p>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={handleDeleteCancel}
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
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  borderRadius: '0.5rem',
                  color: 'white',
                  backgroundColor: isDeleting ? '#fca5a5' : '#ef4444',
                  border: 'none',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.5 : 1,
                }}
              >
                {isDeleting ? '删除中...' : '删除'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
