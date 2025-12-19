/**
 * CategorySelector Component
 * Dropdown selector for choosing a category for tasks/habits
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 5.1
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'
import type { CardList } from '@/api/types'

export interface CategorySelectorProps {
  /** Currently selected category ID, null for uncategorized */
  value: string | null
  /** Callback when selection changes */
  onChange: (listId: string | null) => void
  /** Available categories to choose from */
  lists: CardList[]
  /** Whether the selector is disabled */
  disabled?: boolean
  /** Additional CSS classes */
  className?: string
  /** Placeholder text when no category is selected */
  placeholder?: string
}

/**
 * CategorySelector - A controlled dropdown for selecting task/habit categories
 * 
 * Features:
 * - Displays all available categories
 * - Includes "未分类" (uncategorized) option
 * - Supports controlled value/onChange pattern
 * - Shows placeholder when list is empty
 */
export function CategorySelector({
  value,
  onChange,
  lists,
  disabled = false,
  className,
  placeholder = '选择分类',
}: CategorySelectorProps) {
  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedValue = e.target.value
      // Empty string means "uncategorized" (null)
      onChange(selectedValue === '' ? null : selectedValue)
    },
    [onChange]
  )

  return (
    <div className={cn('relative', className)}>
      <select
        value={value ?? ''}
        onChange={handleChange}
        disabled={disabled}
        className={cn(
          'w-full h-10 px-3 pr-10 py-2 text-sm',
          'rounded-lg border border-outline-variant',
          'bg-surface-container-lowest text-neutral-700',
          'appearance-none cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-100',
          'transition-colors duration-200'
        )}
        aria-label={placeholder}
      >
        {/* Uncategorized option - always available */}
        <option value="">未分类</option>
        
        {/* Category options */}
        {lists.map((list) => (
          <option key={list.id} value={list.id}>
            {list.name}
          </option>
        ))}
      </select>
      
      {/* Custom dropdown arrow */}
      <ChevronDown
        className={cn(
          'absolute right-3 top-1/2 -translate-y-1/2',
          'w-4 h-4 text-neutral-500 pointer-events-none',
          disabled && 'opacity-50'
        )}
      />
    </div>
  )
}

export default CategorySelector
