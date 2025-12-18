/**
 * useElectron Hook
 * Provides access to Electron APIs in the renderer process
 * Requirements: 1.6
 */

import { useEffect, useState, useCallback } from 'react'
import type {
  BackendStatus,
  AppInfo,
  NotificationOptions,
  DiagnosticReport,
} from '@/types/electron'

// Re-export types
export type { BackendStatus, AppInfo, NotificationOptions, DiagnosticReport }

/**
 * Check if running in Electron environment
 */
export function isElectron(): boolean {
  return typeof window !== 'undefined' && window.electron !== undefined
}

/**
 * Get Electron API safely
 */
function getElectronAPI() {
  return window.electron
}

/**
 * Hook to access Electron APIs
 */
export function useElectron() {
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null)
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null)
  const [isElectronEnv] = useState(isElectron())

  // Fetch initial status
  useEffect(() => {
    if (!isElectronEnv) return

    const api = getElectronAPI()
    if (!api) return

    // Get initial backend status
    api.getBackendStatus().then(setBackendStatus)

    // Get app info
    api.getAppInfo().then(setAppInfo)

    // Subscribe to backend status updates
    const unsubscribe = api.onBackendStatus(setBackendStatus)

    return () => {
      unsubscribe()
    }
  }, [isElectronEnv])

  // Restart backend
  const restartBackend = useCallback(async (): Promise<boolean> => {
    const api = getElectronAPI()
    if (!isElectronEnv || !api) return false
    return api.restartBackend()
  }, [isElectronEnv])

  // Show notification
  const showNotification = useCallback(
    async (options: NotificationOptions): Promise<boolean> => {
      const api = getElectronAPI()
      if (!isElectronEnv || !api) {
        // Fallback to browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(options.title, { body: options.body })
          return true
        }
        return false
      }
      return api.showNotification(options)
    },
    [isElectronEnv]
  )

  // Get backend logs
  const getBackendLogs = useCallback(
    async (lines?: number): Promise<string[]> => {
      const api = getElectronAPI()
      if (!isElectronEnv || !api) return []
      return api.getBackendLogs(lines)
    },
    [isElectronEnv]
  )

  // Get app logs
  const getAppLogs = useCallback(
    async (lines?: number): Promise<string[]> => {
      const api = getElectronAPI()
      if (!isElectronEnv || !api) return []
      return api.getAppLogs(lines)
    },
    [isElectronEnv]
  )

  // Run diagnostics
  const runDiagnostics = useCallback(async (): Promise<DiagnosticReport | null> => {
    const api = getElectronAPI()
    if (!isElectronEnv || !api) return null
    return api.runDiagnostics()
  }, [isElectronEnv])

  return {
    isElectron: isElectronEnv,
    backendStatus,
    appInfo,
    restartBackend,
    showNotification,
    getBackendLogs,
    getAppLogs,
    runDiagnostics,
  }
}

/**
 * Hook to subscribe to notification clicks
 */
export function useNotificationClick(
  callback: (data: { taskId: string }) => void
) {
  const isElectronEnv = isElectron()

  useEffect(() => {
    if (!isElectronEnv) return

    const api = getElectronAPI()
    if (!api) return

    const unsubscribe = api.onNotificationClicked(callback)
    return () => {
      unsubscribe()
    }
  }, [isElectronEnv, callback])
}
