/**
 * CategoryFilter Component
 * Filter buttons for category-based task filtering with inline management
 * 
 * Requirements: 6.1, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Plus, Pencil, Trash2, ListFilter } from 'lucide-react'
import type { CardList } from '@/api/types'

export interface CategoryFilterProps {
  /** Available categories */
  lists: CardList[]
  /** Currently selected category ID, null for "All" */
  selectedListId: string | null
  /** Callback when a category is selected */
  onSelectList: (listId: string | null) => void
  /** Callback to open create category modal */
  onCreateList: () => void
  /** Callback to open edit category modal */
  onEditList: (list: CardList) => void
  /** Callback to open delete category modal */
  onDeleteList: (list: CardList) => void
  /** Additional CSS classes */
  className?: string
}

/**
 * CategoryFilter - Filter buttons for category-based filtering
 * 
 * Features:
 * - Displays "全部" (All) button and all category buttons
 * - Shows edit/delete icons on hover
 * - Displays add category button
 * - Visual indication of selected filter
 */
export function CategoryFilter({
  lists,
  selectedListId,
  onSelectList,
  onCreateList,
  onEditList,
  onDeleteList,
  className,
}: CategoryFilterProps) {
  const [hoveredListId, setHoveredListId] = React.useState<string | null>(null)

  const handleSelectAll = React.useCallback(() => {
    onSelectList(null)
  }, [onSelectList])

  const handleSelectList = React.useCallback((listId: string) => {
    onSelectList(listId)
  }, [onSelectList])

  const handleEditClick = React.useCallback((e: React.MouseEvent, list: CardList) => {
    e.stopPropagation()
    onEditList(list)
  }, [onEditList])

  const handleDeleteClick = React.useCallback((e: React.MouseEvent, list: CardList) => {
    e.stopPropagation()
    onDeleteList(list)
  }, [onDeleteList])

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <ListFilter className="w-4 h-4 text-neutral-500 flex-shrink-0" />
      <div className="flex items-center gap-2 flex-wrap">
        {/* "All" filter button */}
        <button
          onClick={handleSelectAll}
          className={cn(
            'px-3 py-1.5 text-sm rounded-full transition-colors',
            selectedListId === null
              ? 'bg-secondary-50 text-primary-500'
              : 'bg-surface-container-high text-neutral-600 hover:bg-surface-container-highest'
          )}
          aria-pressed={selectedListId === null}
          aria-label="显示全部任务"
        >
          全部
        </button>

        {/* Category filter buttons */}
        {lists.map((list) => (
          <div
            key={list.id}
            className="relative"
            onMouseEnter={() => setHoveredListId(list.id)}
            onMouseLeave={() => setHoveredListId(null)}
          >
            <button
              onClick={() => handleSelectList(list.id)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-full transition-colors',
                selectedListId === list.id
                  ? 'bg-secondary-50 text-primary-500'
                  : 'bg-surface-container-high text-neutral-600 hover:bg-surface-container-highest',
                // Add padding for action buttons when hovered
                hoveredListId === list.id && 'pr-14'
              )}
              aria-pressed={selectedListId === list.id}
              aria-label={`筛选 ${list.name} 分类`}
            >
              {list.name}
            </button>

            {/* Edit/Delete action buttons - shown on hover */}
            {hoveredListId === list.id && (
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                <button
                  onClick={(e) => handleEditClick(e, list)}
                  className={cn(
                    'p-1 rounded-full transition-colors',
                    'text-neutral-500 hover:text-primary-600 hover:bg-primary-50'
                  )}
                  aria-label={`编辑 ${list.name} 分类`}
                  title="编辑分类"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => handleDeleteClick(e, list)}
                  className={cn(
                    'p-1 rounded-full transition-colors',
                    'text-neutral-500 hover:text-primary-600 hover:bg-primary-50'
                  )}
                  aria-label={`删除 ${list.name} 分类`}
                  title="删除分类"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Add category button */}
        <button
          onClick={onCreateList}
          className={cn(
            'px-2 py-1.5 text-sm rounded-full transition-colors',
            'bg-surface-container-high text-neutral-500',
            'hover:bg-surface-container-highest hover:text-primary-500',
            'flex items-center gap-1'
          )}
          aria-label="添加分类"
          title="添加分类"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

/**
 * Filters tasks by category
 * Returns all tasks when listId is null, otherwise returns tasks matching the listId
 * 
 * @param tasks - Array of tasks to filter
 * @param listId - Category ID to filter by, or null for all tasks
 * @returns Filtered array of tasks
 */
export function filterTasksByCategory<T extends { list_id: string | null }>(
  tasks: T[],
  listId: string | null
): T[] {
  if (listId === null) {
    return tasks
  }
  return tasks.filter(task => task.list_id === listId)
}

export default CategoryFilter
