/**
 * TaskEditor Component
 * Slide-over panel for editing tasks with Markdown support
 * Requirements: 4.3
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Save, Trash2, Loader2, Clock, Flame } from 'lucide-react'
import type { Task, TaskUpdate } from '@/api/types'

export interface TaskEditorProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (taskId: string, data: TaskUpdate) => Promise<void>
  onDelete?: (taskId: string) => Promise<void>
  isLoading?: boolean
}

export function TaskEditor({
  task,
  open,
  onOpenChange,
  onSave,
  onDelete,
  isLoading = false,
}: TaskEditorProps) {
  const [title, setTitle] = React.useState('')
  const [content, setContent] = React.useState('')
  const [isHabit, setIsHabit] = React.useState(false)
  const [reminderTime, setReminderTime] = React.useState('')
  const [isDirty, setIsDirty] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)

  // Sync form state with task prop
  React.useEffect(() => {
    if (task) {
      setTitle(task.title)
      setContent(task.content || '')
      setIsHabit(task.is_habit)
      setReminderTime(task.reminder_time || '')
      setIsDirty(false)
    }
  }, [task])

  const handleTitleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
    setIsDirty(true)
  }, [])

  const handleContentChange = React.useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    setIsDirty(true)
  }, [])

  const handleIsHabitChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setIsHabit(e.target.checked)
    setIsDirty(true)
  }, [])

  const handleReminderTimeChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setReminderTime(e.target.value)
    setIsDirty(true)
  }, [])

  const handleSave = React.useCallback(async () => {
    if (!task || !title.trim() || isSaving) return

    setIsSaving(true)
    try {
      await onSave(task.id, {
        title: title.trim(),
        content: content.trim() || undefined,
        is_habit: isHabit,
        reminder_time: reminderTime || undefined,
        clear_reminder: !reminderTime && !!task.reminder_time,
      })
      setIsDirty(false)
      onOpenChange(false)
    } catch {
      // Error handling done by parent
    } finally {
      setIsSaving(false)
    }
  }, [task, title, content, isHabit, reminderTime, isSaving, onSave, onOpenChange])

  const handleDeleteClick = React.useCallback(() => {
    setShowDeleteConfirm(true)
  }, [])

  const handleDeleteConfirm = React.useCallback(async () => {
    if (!task || !onDelete || isDeleting) return

    setIsDeleting(true)
    try {
      await onDelete(task.id)
      setShowDeleteConfirm(false)
      onOpenChange(false)
    } catch {
      // Error handling done by parent
      setShowDeleteConfirm(false)
    } finally {
      setIsDeleting(false)
    }
  }, [task, onDelete, isDeleting, onOpenChange])

  const handleDeleteCancel = React.useCallback(() => {
    setShowDeleteConfirm(false)
  }, [])

  const handleClose = React.useCallback(() => {
    if (isDirty) {
      const confirmed = window.confirm('有未保存的更改，确定要关闭吗？')
      if (!confirmed) return
    }
    onOpenChange(false)
  }, [isDirty, onOpenChange])

  if (!task) return null

  return (
    <>
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full max-w-lg">
        <SheetHeader>
          <SheetTitle>编辑任务</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">
              标题
            </label>
            <Input
              value={title}
              onChange={handleTitleChange}
              placeholder="任务标题"
              disabled={isLoading || isSaving}
            />
          </div>

          {/* Content (Markdown) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">
              详细内容
            </label>
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="支持 Markdown 格式..."
              disabled={isLoading || isSaving}
              rows={8}
              className={cn(
                'w-full px-3 py-2 rounded-md border border-neutral-200',
                'bg-white text-neutral-900 placeholder:text-neutral-400',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'resize-y min-h-[120px]',
                'font-mono text-sm'
              )}
            />
            <p className="text-xs text-neutral-400">
              支持 Markdown 语法
            </p>
          </div>

          {/* Habit Toggle */}
          <div className="flex items-center justify-between py-3 border-t border-neutral-100">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-warning-500" />
              <span className="text-sm font-medium text-neutral-700">设为习惯</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isHabit}
                onChange={handleIsHabitChange}
                disabled={isLoading || isSaving}
                className="sr-only peer"
              />
              <div className={cn(
                'w-11 h-6 bg-neutral-200 rounded-full peer',
                'peer-focus:ring-2 peer-focus:ring-primary-500',
                'peer-checked:bg-primary-600',
                'after:content-[""] after:absolute after:top-0.5 after:left-[2px]',
                'after:bg-white after:rounded-full after:h-5 after:w-5',
                'after:transition-all peer-checked:after:translate-x-full'
              )} />
            </label>
          </div>

          {/* Reminder Time */}
          <div className="space-y-2 py-3 border-t border-neutral-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-neutral-500" />
              <label className="text-sm font-medium text-neutral-700">
                提醒时间
              </label>
            </div>
            <Input
              type="time"
              value={reminderTime}
              onChange={handleReminderTimeChange}
              disabled={isLoading || isSaving}
            />
          </div>

          {/* Streak Info (for habits) */}
          {task.is_habit && (
            <div className="py-3 border-t border-neutral-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">当前连胜</span>
                <span className={cn(
                  'font-semibold',
                  task.current_streak >= 7 ? 'text-warning-600' : 'text-neutral-700'
                )}>
                  {task.current_streak} 天
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-neutral-500">最长连胜</span>
                <span className="font-semibold text-neutral-700">
                  {task.longest_streak} 天
                </span>
              </div>
              {task.last_checkin_date && (
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-neutral-500">上次打卡</span>
                  <span className="text-neutral-700">
                    {task.last_checkin_date}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Meta Info */}
          <div className="py-3 border-t border-neutral-100 text-xs text-neutral-400 space-y-1">
            <p>创建于: {new Date(task.created_at).toLocaleString('zh-CN')}</p>
            <p>更新于: {new Date(task.updated_at).toLocaleString('zh-CN')}</p>
          </div>
        </div>

        <SheetFooter>
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteClick}
              disabled={isLoading || isSaving || isDeleting}
              className="mr-auto"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              <span className="ml-1">删除</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={isLoading || isSaving}
          >
            取消
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!title.trim() || !isDirty || isLoading || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                保存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1" />
                保存
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>

    </Sheet>

    {/* Delete Confirmation Modal */}
    <Modal
      isOpen={showDeleteConfirm}
      onClose={handleDeleteCancel}
      title="确认删除"
      footer={
        <>
          <Button variant="outline" onClick={handleDeleteCancel}>
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? '删除中...' : '删除'}
          </Button>
        </>
      }
    >
      <p>确定要删除这个任务吗？此操作无法撤销。</p>
    </Modal>
    </>
  )
}
