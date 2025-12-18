/**
 * TaskList Component
 * Displays a sortable list of task cards with drag-and-drop functionality
 * Requirements: 4.1, 4.4
 */

import * as React from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import type { Task } from '@/api/types'
import { TaskCard } from './TaskCard'

import type { TaskUpdate } from '@/api/types'

export interface TaskListProps {
  tasks: Task[]
  onReorder?: (tasks: Task[]) => void
  onComplete?: (task: Task) => void
  onSave?: (taskId: string, data: TaskUpdate) => Promise<void>
  onDelete?: (task: Task) => void | Promise<void>
  emptyMessage?: string
  className?: string
}

interface SortableTaskItemProps {
  task: Task
  onComplete?: (task: Task) => void
  onSave?: (taskId: string, data: TaskUpdate) => Promise<void>
  onDelete?: (task: Task) => void | Promise<void>
}

function SortableTaskItem({ task, onComplete, onSave, onDelete }: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TaskCard
        task={task}
        onComplete={onComplete}
        onSave={onSave}
        onDelete={onDelete}
        isDragging={isDragging}
        dragHandleProps={listeners}
      />
    </div>
  )
}

export function TaskList({
  tasks,
  onReorder,
  onComplete,
  onSave,
  onDelete,
  emptyMessage = '暂无任务',
  className,
}: TaskListProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [localTasks, setLocalTasks] = React.useState(tasks)

  // Sync local tasks with props
  React.useEffect(() => {
    setLocalTasks(tasks)
  }, [tasks])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const activeTask = React.useMemo(
    () => localTasks.find((t) => t.id === activeId),
    [localTasks, activeId]
  )

  const handleDragStart = React.useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event

      setActiveId(null)

      if (over && active.id !== over.id) {
        const oldIndex = localTasks.findIndex((t) => t.id === active.id)
        const newIndex = localTasks.findIndex((t) => t.id === over.id)

        const newTasks = arrayMove(localTasks, oldIndex, newIndex)
        setLocalTasks(newTasks)
        onReorder?.(newTasks)
      }
    },
    [localTasks, onReorder]
  )

  const handleDragCancel = React.useCallback(() => {
    setActiveId(null)
  }, [])

  if (localTasks.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center py-12',
          'text-neutral-400',
          className
        )}
      >
        <p className="text-sm">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={localTasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className={cn('space-y-3', className)}>
          {localTasks.map((task) => (
            <SortableTaskItem
              key={task.id}
              task={task}
              onComplete={onComplete}
              onSave={onSave}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>

      {/* Drag Overlay - shows the dragged item */}
      <DragOverlay>
        {activeTask ? (
          <TaskCard
            task={activeTask}
            isDragging
            className="shadow-elevation-4"
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
