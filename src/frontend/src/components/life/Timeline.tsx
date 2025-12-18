/**
 * Timeline Component
 * Displays life entries in a timeline with date grouping
 * Validates: Requirements 6.1, 6.6
 */

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { DateSeparator } from './DateSeparator'
import { LifeEntry } from './LifeEntry'
import type { LifeEntry as LifeEntryType, DateGroupedEntries } from '@/api/types'
import { getDateString } from '@/lib/relative-time'

interface TimelineProps {
  /** Pre-grouped entries from API */
  groups?: DateGroupedEntries[]
  /** Flat list of entries (will be grouped automatically) */
  entries?: LifeEntryType[]
  /** Callback when an entry is updated */
  onUpdateEntry?: (entryId: string, content: string) => Promise<void>
  /** Callback when an entry is deleted */
  onDeleteEntry?: (entryId: string) => void
  /** Additional class names */
  className?: string
}

/**
 * Group entries by date
 * @param entries - Flat list of entries
 * @returns Grouped entries by date
 */
export function groupEntriesByDate(entries: LifeEntryType[]): DateGroupedEntries[] {
  const groupMap = new Map<string, LifeEntryType[]>()
  
  // Sort entries by created_at descending (newest first)
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  
  for (const entry of sortedEntries) {
    const date = getDateString(new Date(entry.created_at))
    const existing = groupMap.get(date) || []
    existing.push(entry)
    groupMap.set(date, existing)
  }
  
  // Convert to array and sort by date descending
  const groups: DateGroupedEntries[] = []
  for (const [date, dateEntries] of groupMap) {
    groups.push({ date, entries: dateEntries })
  }
  
  // Sort groups by date descending
  groups.sort((a, b) => b.date.localeCompare(a.date))
  
  return groups
}

export function Timeline({
  groups: providedGroups,
  entries,
  onUpdateEntry,
  onDeleteEntry,
  className,
}: TimelineProps) {
  // Use provided groups or group entries automatically
  const groups = useMemo(() => {
    if (providedGroups) {
      return providedGroups
    }
    if (entries) {
      return groupEntriesByDate(entries)
    }
    return []
  }, [providedGroups, entries])

  if (groups.length === 0) {
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
    </div>
  )
}
