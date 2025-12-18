/**
 * TasksPage Component
 * Main page for task management with list filtering and CRUD operations
 * Requirements: 4.1-4.6
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useCheckinTask } from '@/hooks/useTasks'
import { useLists } from '@/hooks/useLists'
import { TaskList, TaskCreateForm } from '@/components/task'
import { LoadingSkeleton, EmptyState } from '@/components/common'
import type { Task, TaskCreate, TaskUpdate } from '@/api/types'
import { ListFilter, CheckCircle2, Flame } from 'lucide-react'

export function TasksPage() {
  const [selectedListId, setSelectedListId] = React.useState<string | null>(null)
  const [filter, setFilter] = React.useState<'all' | 'tasks' | 'habits'>('all')

  // Data fetching
  const { data: tasks, isLoading: tasksLoading, error: tasksError } = useTasks({
    list_id: selectedListId || undefined,
  })
  const { data: lists, isLoading: listsLoading } = useLists()

  // Mutations
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const checkinTask = useCheckinTask()

  // Filter tasks based on selected filter
  const filteredTasks = React.useMemo(() => {
    if (!tasks) return []
    
    switch (filter) {
      case 'tasks':
        return tasks.filter(t => !t.is_habit)
      case 'habits':
        return tasks.filter(t => t.is_habit)
      default:
        return tasks
    }
  }, [tasks, filter])

  // Handlers
  const handleCreateTask = React.useCallback(async (data: TaskCreate) => {
    await createTask.mutateAsync(data)
  }, [createTask])

  const handleSaveTask = React.useCallback(async (taskId: string, data: TaskUpdate) => {
    await updateTask.mutateAsync({ taskId, data })
  }, [updateTask])

  const handleCompleteTask = React.useCallback(async (task: Task) => {
    if (task.is_habit) {
      // Check in for habits
      await checkinTask.mutateAsync({ 
        taskId: task.id,
        data: { timezone_offset: new Date().getTimezoneOffset() }
      })
    } else {
      // For regular tasks, soft delete them when completed
      await deleteTask.mutateAsync({ taskId: task.id })
    }
  }, [checkinTask, deleteTask])

  const handleReorderTasks = React.useCallback((reorderedTasks: Task[]) => {
    // In a full implementation, this would persist the order to the backend
    // For now, the order is maintained locally in TaskList
    console.log('Tasks reordered:', reorderedTasks.map(t => t.id))
  }, [])

  // Loading state
  if (tasksLoading || listsLoading) {
    return (
      <div className="p-6 space-y-4">
        <LoadingSkeleton className="h-10 w-48" />
        <div className="space-y-3">
          <LoadingSkeleton className="h-20" />
          <LoadingSkeleton className="h-20" />
          <LoadingSkeleton className="h-20" />
        </div>
      </div>
    )
  }

  // Error state
  if (tasksError) {
    return (
      <div className="p-6">
        <EmptyState
          type="default"
          title="加载失败"
          description="无法加载任务列表，请稍后重试"
          actionLabel="重新加载"
          onAction={() => window.location.reload()}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-neutral-300 bg-surface">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-neutral-700">任务管理</h1>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-surface-container-high rounded-full">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-full transition-colors',
                filter === 'all'
                  ? 'bg-secondary-50 text-primary-500 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-700'
              )}
            >
              全部
            </button>
            <button
              onClick={() => setFilter('tasks')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-full transition-colors flex items-center gap-1',
                filter === 'tasks'
                  ? 'bg-secondary-50 text-primary-500 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-700'
              )}
            >
              <CheckCircle2 className="w-4 h-4" />
              任务
            </button>
            <button
              onClick={() => setFilter('habits')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-full transition-colors flex items-center gap-1',
                filter === 'habits'
                  ? 'bg-secondary-50 text-primary-500 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-700'
              )}
            >
              <Flame className="w-4 h-4" />
              习惯
            </button>
          </div>
        </div>

        {/* List Filter */}
        {lists && lists.length > 0 && (
          <div className="flex items-center gap-2 mt-4">
            <ListFilter className="w-4 h-4 text-neutral-500" />
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setSelectedListId(null)}
                className={cn(
                  'px-3 py-1 text-sm rounded-full transition-colors',
                  selectedListId === null
                    ? 'bg-secondary-50 text-primary-500'
                    : 'bg-surface-container-high text-neutral-600 hover:bg-surface-container-highest'
                )}
              >
                全部列表
              </button>
              {lists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => setSelectedListId(list.id)}
                  className={cn(
                    'px-3 py-1 text-sm rounded-full transition-colors',
                    selectedListId === list.id
                      ? 'bg-secondary-50 text-primary-500'
                      : 'bg-surface-container-high text-neutral-600 hover:bg-surface-container-highest'
                  )}
                >
                  {list.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Create Form */}
        <TaskCreateForm
          listId={selectedListId}
          onSubmit={handleCreateTask}
          isLoading={createTask.isPending}
          className="mb-6"
        />

        {/* Task List */}
        {filteredTasks.length === 0 ? (
          <EmptyState
            type={filter === 'habits' ? 'habits' : 'tasks'}
            title={
              filter === 'habits'
                ? '暂无习惯'
                : filter === 'tasks'
                ? '暂无任务'
                : '暂无任务'
            }
            description={
              filter === 'habits'
                ? '创建一个习惯开始追踪你的日常'
                : '创建一个任务开始你的工作'
            }
          />
        ) : (
          <TaskList
            tasks={filteredTasks}
            onComplete={handleCompleteTask}
            onSave={handleSaveTask}
            onDelete={async (task) => {
              await deleteTask.mutateAsync({ taskId: task.id })
            }}
            onReorder={handleReorderTasks}
          />
        )}
      </div>
    </div>
  )
}
