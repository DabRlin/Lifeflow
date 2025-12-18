/**
 * Hooks - Unified exports
 */

// Tasks hooks
export {
  useTasks,
  useTask,
  useTaskCheckins,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useCheckinTask,
  taskKeys,
} from './useTasks'

// Lists hooks
export {
  useLists,
  useList,
  useCreateList,
  useUpdateList,
  useDeleteList,
  listKeys,
} from './useLists'

// Life Entries hooks
export {
  useLifeEntries,
  useLifeEntriesGrouped,
  useInfiniteLifeEntries,
  useLifeEntry,
  useCreateLifeEntry,
  useUpdateLifeEntry,
  useDeleteLifeEntry,
  lifeEntryKeys,
} from './useLifeEntries'

// Stats hooks
export {
  useStatsOverview,
  useDailyRing,
  useStreaks,
  statsKeys,
} from './useStats'
