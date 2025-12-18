/**
 * API Types - Frontend type definitions matching backend schemas
 */

// Task Card Types
export interface Task {
  id: string
  title: string
  content: string
  list_id: string | null
  is_habit: boolean
  reminder_time: string | null
  current_streak: number
  longest_streak: number
  last_checkin_date: string | null
  created_at: string
  updated_at: string
  is_deleted: boolean
}

export interface TaskCreate {
  title: string
  content?: string
  list_id?: string | null
  is_habit?: boolean
  reminder_time?: string | null
}

export interface TaskUpdate {
  title?: string
  content?: string
  list_id?: string | null
  is_habit?: boolean
  reminder_time?: string | null
  clear_reminder?: boolean
}

// Card List Types
export interface CardList {
  id: string
  name: string
  color: string
  sort_order: number
  created_at: string
}

export interface CardListCreate {
  name: string
  color?: string
  sort_order?: number
}

export interface CardListUpdate {
  name?: string
  color?: string
  sort_order?: number
}

// Life Entry Types
export interface LifeEntry {
  id: string
  content: string
  created_at: string
  updated_at: string
  is_deleted: boolean
}

export interface LifeEntryCreate {
  content: string
}

export interface LifeEntryUpdate {
  content?: string
}

export interface LifeEntryPaginatedResponse {
  items: LifeEntry[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface DateGroupedEntries {
  date: string
  entries: LifeEntry[]
}

export interface LifeEntryGroupedResponse {
  groups: DateGroupedEntries[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

// Check-in Types
export interface CheckinRecord {
  id: string
  task_id: string
  checkin_date: string
  checkin_time: string
}

export interface CheckinRequest {
  timezone_offset?: number
}

// Stats Types
export interface DailyRingData {
  date: string
  total_habits: number
  completed_habits: number
  percentage: number
}

export interface StatsOverview {
  total_tasks: number
  completed_tasks: number
  pending_tasks: number
  completion_rate: number
  longest_streak: number
  today_checkins: number
}

// Settings Types
export interface Settings {
  notificationsEnabled: boolean
  theme: 'light' | 'dark' | 'system'
  [key: string]: unknown
}

export interface ExportData {
  exportVersion: string
  exportDate: string
  cardLists: CardList[]
  taskCards: Task[]
  checkinRecords: CheckinRecord[]
  lifeEntries: LifeEntry[]
  settings: Record<string, unknown>
}
