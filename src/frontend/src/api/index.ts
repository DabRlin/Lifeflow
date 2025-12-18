/**
 * API Module - Unified exports
 */

// Client
export { api, fetchWithRetry, ApiError, TimeoutError, API_BASE } from './client'
export type { FetchConfig } from './client'

// Types
export * from './types'

// API Modules
export { tasksApi } from './tasks'
export { listsApi } from './lists'
export { lifeEntriesApi } from './life-entries'
export { statsApi, getTimezoneOffset } from './stats'
export { settingsApi } from './settings'
export { notificationsApi } from './notifications'
export type { Notification, NotificationType, NotificationListResponse, UnreadCountResponse } from './notifications'
