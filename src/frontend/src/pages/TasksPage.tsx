/**
 * TasksPage Component
 * Main page for task management with list filtering and CRUD operations
 * Requirements: 4.1-4.6, 6.1, 7.1
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useCheckinTask } from '@/hooks/useTasks'
import { useLists, useCreateList, useUpdateList, useDeleteList } from '@/hooks/useLists'
import { TaskList, TaskCreateForm } from '@/components/task'
import { LoadingSkeleton, EmptyState } from '@/components/common'
import { CategoryFilter, CategoryModal, DeleteCategoryModal } from '@/components/category'
import type { Task, TaskCreate, TaskUpdate, CardList, CardListCreate, CardListUpdate } from '@/api/types'
import { CheckCircle2, Flame } from 'lucide-react'

export function TasksPage() {
  const [selectedListId, setSelectedListId] = React.useState<string | null>(null)
  const [filter, setFilter] = React.useState<'all' | 'tasks' | 'habits'>('all')
  
  // Category modal states
  const [showCategoryModal, setShowCategoryModal] = React.useState(false)
  const [editingCategory, setEditingCategory] = React.useState<CardList | undefined>(undefined)
  const [showDeleteModal, setShowDeleteModal] = React.useState(false)
  const [deletingCategory, setDeletingCategory] = React.useState<CardList | null>(null)

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
  const createList = useCreateList()
  const updateList = useUpdateList()
  const deleteList = useDeleteList()

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

  // Category handlers
  const handleOpenCreateCategory = React.useCallback(() => {
    setEditingCategory(undefined)
    setShowCategoryModal(true)
  }, [])

  const handleOpenEditCategory = React.useCallback((list: CardList) => {
    setEditingCategory(list)
    setShowCategoryModal(true)
  }, [])

  const handleOpenDeleteCategory = React.useCallback((list: CardList) => {
    setDeletingCategory(list)
    setShowDeleteModal(true)
  }, [])

  const handleCloseCategoryModal = React.useCallback(() => {
    setShowCategoryModal(false)
    setEditingCategory(undefined)
  }, [])

  const handleCloseDeleteModal = React.useCallback(() => {
    setShowDeleteModal(false)
    setDeletingCategory(null)
  }, [])

  const handleSubmitCategory = React.useCallback(async (data: CardListCreate | CardListUpdate) => {
    if (editingCategory) {
      await updateList.mutateAsync({ listId: editingCategory.id, data })
    } else {
      await createList.mutateAsync(data as CardListCreate)
    }
  }, [editingCategory, createList, updateList])

  const handleConfirmDeleteCategory = React.useCallback(async () => {
    if (!deletingCategory) return
    await deleteList.mutateAsync(deletingCategory.id)
    // If the deleted category was selected, reset to "All"
    if (selectedListId === deletingCategory.id) {
      setSelectedListId(null)
    }
  }, [deletingCategory, deleteList, selectedListId])

  // Count tasks in the category being deleted
  const deletingCategoryTaskCount = React.useMemo(() => {
    if (!deletingCategory || !tasks) return 0
    return tasks.filter(t => t.list_id === deletingCategory.id).length
  }, [deletingCategory, tasks])

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
      <div className="flex-shrink-0 px-6 py-4 border-b border-outline-variant bg-white">
        <div className="flex items-center justify-between">
          <h1 className="text-headline-md font-semibold text-neutral-700">任务管理</h1>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-full">
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

        {/* Category Filter */}
        <CategoryFilter
          lists={lists ?? []}
          selectedListId={selectedListId}
          onSelectList={setSelectedListId}
          onCreateList={handleOpenCreateCategory}
          onEditList={handleOpenEditCategory}
          onDeleteList={handleOpenDeleteCategory}
          className="mt-4"
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Create Form */}
        <TaskCreateForm
          listId={selectedListId}
          lists={lists ?? []}
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
            lists={lists ?? []}
          />
        )}
      </div>

      {/* Category Modal (Create/Edit) */}
      <CategoryModal
        isOpen={showCategoryModal}
        onClose={handleCloseCategoryModal}
        list={editingCategory}
        onSubmit={handleSubmitCategory}
        isLoading={createList.isPending || updateList.isPending}
      />

      {/* Delete Category Modal */}
      <DeleteCategoryModal
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
        list={deletingCategory}
        onConfirm={handleConfirmDeleteCategory}
        isLoading={deleteList.isPending}
        taskCount={deletingCategoryTaskCount}
      />
    </div>
  )
}
