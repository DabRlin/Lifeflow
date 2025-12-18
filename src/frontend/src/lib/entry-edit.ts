/**
 * Life Entry Edit Utilities
 * Validates: Requirements 6.4
 */

import type { LifeEntry, LifeEntryUpdate } from '@/api/types'

/**
 * Represents the result of an edit operation
 */
export interface EditResult {
  /** The updated entry */
  entry: LifeEntry
  /** Whether created_at was preserved */
  createdAtPreserved: boolean
  /** Whether updated_at was changed */
  updatedAtChanged: boolean
}

/**
 * Simulate an edit operation on a life entry
 * This function models the expected behavior of the backend API
 * 
 * @param original - The original entry before edit
 * @param update - The update data
 * @param newUpdatedAt - The new updated_at timestamp (simulating server time)
 * @returns The edit result with validation flags
 */
export function simulateEdit(
  original: LifeEntry,
  update: LifeEntryUpdate,
  newUpdatedAt: string
): EditResult {
  // created_at should never change
  const createdAt = original.created_at
  
  // updated_at should be set to the new timestamp
  const updatedAt = newUpdatedAt
  
  // Content is updated if provided
  const content = update.content !== undefined 
    ? update.content.trim() 
    : original.content
  
  const updatedEntry: LifeEntry = {
    ...original,
    content,
    created_at: createdAt,
    updated_at: updatedAt,
  }
  
  return {
    entry: updatedEntry,
    createdAtPreserved: updatedEntry.created_at === original.created_at,
    updatedAtChanged: updatedEntry.updated_at !== original.updated_at,
  }
}

/**
 * Validate that an edit operation preserved timestamps correctly
 * 
 * @param original - The original entry before edit
 * @param updated - The entry after edit
 * @returns True if timestamps are valid
 */
export function validateEditTimestamps(
  original: LifeEntry,
  updated: LifeEntry
): boolean {
  // created_at must be preserved
  if (updated.created_at !== original.created_at) {
    return false
  }
  
  // updated_at must be >= original updated_at
  const originalTime = new Date(original.updated_at).getTime()
  const updatedTime = new Date(updated.updated_at).getTime()
  
  if (updatedTime < originalTime) {
    return false
  }
  
  return true
}

/**
 * Check if content was actually changed
 * 
 * @param original - Original content
 * @param updated - Updated content
 * @returns True if content changed
 */
export function contentChanged(original: string, updated: string): boolean {
  return original.trim() !== updated.trim()
}
