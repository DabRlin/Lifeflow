/**
 * Electron API Type Declarations
 * Extends Window interface with Electron APIs exposed via preload script
 */

export interface BackendStatus {
  state: 'stopped' | 'starting' | 'running' | 'crashed' | 'failed' | 'stopping'
  pid?: number
  uptime?: number
  restartCount: number
  lastError?: string
  port: number
}

export interface DiagnosticResult {
  category: string
  check: string
  status: 'pass' | 'fail' | 'warn'
  message: string
  details?: unknown
}

export interface DiagnosticReport {
  timestamp: Date
  environment: {
    platform: string
    arch: string
    nodeVersion: string
    electronVersion: string
    appVersion: string
    isPackaged: boolean
    resourcesPath: string
    userDataPath: string
    appPath: string
    execPath: string
  }
  results: DiagnosticResult[]
  summary: {
    passed: number
    failed: number
    warnings: number
  }
}

export interface AppInfo {
  version: string
  platform: string
  arch: string
  electron: string
  chrome: string
  node: string
  isPackaged: boolean
  userDataPath: string
}

export interface NotificationOptions {
  title: string
  body: string
  taskId?: string
}

export interface ElectronAPI {
  // Backend management
  getBackendStatus: () => Promise<BackendStatus>
  restartBackend: () => Promise<boolean>
  getBackendLogs: (lines?: number) => Promise<string[]>

  // Diagnostics
  runDiagnostics: () => Promise<DiagnosticReport>
  getAppLogs: (lines?: number) => Promise<string[]>
  getLogFilePath: () => Promise<string | null>

  // Notifications
  showNotification: (options: NotificationOptions) => Promise<boolean>
  getNotificationPermission: () => Promise<boolean>

  // App info
  getAppInfo: () => Promise<AppInfo>

  // Event listeners
  onBackendStatus: (callback: (status: BackendStatus) => void) => () => void
  onNotificationClicked: (callback: (data: { taskId: string }) => void) => () => void
}

declare global {
  interface Window {
    electron?: ElectronAPI
  }
}

export {}
