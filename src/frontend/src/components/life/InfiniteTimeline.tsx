/**
 * InfiniteTimeline Component
 * Displays life entries with infinite scroll pagination
 * Validates: Requirements 6.3
 */

import { useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { DateSeparator } from './DateSeparator'
import { LifeEntry } from './LifeEntry'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import type { LifeEntry as LifeEntryType } from '@/api/types'
import { getDateString } from '@/lib/relative-time'
import { Loader2 } from 'lucide-react'

interface InfiniteTimelineProps {
  /** Flat list of all loaded entries */
  entries: LifeEntryType[]
  /** Whether more data is being fetched */
  isFetchingNextPage: boolean
  /** Whether there are more pages to load */
  hasNextPage: boolean
  /** Function to fetch the next page */
  fetchNextPage: () => void
  /** Callback when an entry is updated */
  onUpdateEntry?: (entryId: string, content: string) => Promise<void>
  /** Callback when an entry is deleted */
  onDeleteEntry?: (entryId: string) => void
  /** Additional class names */
  className?: string
}

interface DateGroup {
  date: string
  entries: LifeEntryType[]
}

/**
 * Group entries by date for display
 */
function groupEntriesForDisplay(entries: LifeEntryType[]): DateGroup[] {
  const groupMap = new Map<string, LifeEntryType[]>()
  
  for (const entry of entries) {
    const date = getDateString(new Date(entry.created_at))
    const existing = groupMap.get(date) || []
    existing.push(entry)
    groupMap.set(date, existing)
  }
  
  // Convert to array, maintaining order from original entries
  const groups: DateGroup[] = []
  const seenDates = new Set<string>()
  
  for (const entry of entries) {
    const date = getDateString(new Date(entry.created_at))
    if (!seenDates.has(date)) {
      seenDates.add(date)
      groups.push({
        date,
        entries: groupMap.get(date) || [],
      })
    }
  }
  
  return groups
}

export function InfiniteTimeline({
  entries,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  onUpdateEntry,
  onDeleteEntry,
  className,
}: InfiniteTimelineProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  )

  useEffect(() => {
    const element = loadMoreRef.current
    if (!element) return

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0,
    })

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [handleObserver])

  const groups = groupEntriesForDisplay(entries)

  if (groups.length === 0 && !isFetchingNextPage) {
    return null
  }

  return (
    <div className={cn('space-y-2', className)}>
      {groups.map((group) => (
        <div key={group.date}>
          <DateSeparator date={group.date} />
          <div className="space-y-3 pl-2">
            {group.entries.map((entry) => (
              <LifeEntry
                key={entry.id}
                entry={entry}
                onUpdate={onUpdateEntry}
                onDelete={onDeleteEntry}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Load more trigger element */}
      <div ref={loadMoreRef} className="py-4">
        {isFetchingNextPage && (
          <div className="flex items-center justify-center gap-2 text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">加载更多...</span>
          </div>
        )}
      </div>

      {/* End of list indicator */}
      {!hasNextPage && entries.length > 0 && (
        <div className="text-center py-4">
          <span className="text-sm text-neutral-400">已加载全部记录</span>
        </div>
      )}
    </div>
  )
}

/**
 * Loading skeleton for initial load
 */
export function TimelineSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="space-y-3">
          {i === 0 && (
            <div className="flex items-center gap-4 py-4">
              <div className="h-px flex-1 bg-neutral-200" />
              <LoadingSkeleton variant="text" width={80} height={16} />
              <div className="h-px flex-1 bg-neutral-200" />
            </div>
          )}
          <div className="bg-white rounded-lg p-4 shadow-elevation-1 border border-outline-variant ml-2">
            <LoadingSkeleton variant="text" width="100%" height={16} />
            <LoadingSkeleton variant="text" width="80%" height={16} className="mt-2" />
            <LoadingSkeleton variant="text" width={60} height={12} className="mt-3" />
          </div>
        </div>
      ))}
    </div>
  )
}
