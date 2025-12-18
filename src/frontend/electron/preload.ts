/**
 * LifeFlow V2 - Electron Preload Script
 * 
 * Exposes safe APIs to the renderer process via contextBridge.
 * This script runs in a sandboxed environment with access to Node.js APIs.
 */

import { contextBridge, ipcRenderer } from 'electron';

// Type definitions for exposed APIs
export interface BackendStatus {
  state: 'stopped' | 'starting' | 'running' | 'crashed' | 'failed' | 'stopping';
  pid?: number;
  uptime?: number;
  restartCount: number;
  lastError?: string;
  port: number;
}

export interface DiagnosticResult {
  category: string;
  check: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: unknown;
}

export interface DiagnosticReport {
  timestamp: Date;
  environment: {
    platform: string;
    arch: string;
    nodeVersion: string;
    electronVersion: string;
    appVersion: string;
    isPackaged: boolean;
    resourcesPath: string;
    userDataPath: string;
    appPath: string;
    execPath: string;
  };
  results: DiagnosticResult[];
  summary: {
    passed: number;
    failed: number;
    warnings: number;
  };
}

export interface AppInfo {
  version: string;
  platform: string;
  arch: string;
  electron: string;
  chrome: string;
  node: string;
  isPackaged: boolean;
  userDataPath: string;
}

export interface NotificationOptions {
  title: string;
  body: string;
  taskId?: string;
}

// API exposed to renderer
export interface ElectronAPI {
  // Backend management
  getBackendStatus: () => Promise<BackendStatus>;
  restartBackend: () => Promise<boolean>;
  getBackendLogs: (lines?: number) => Promise<string[]>;
  
  // Diagnostics
  runDiagnostics: () => Promise<DiagnosticReport>;
  getAppLogs: (lines?: number) => Promise<string[]>;
  getLogFilePath: () => Promise<string | null>;
  
  // Notifications
  showNotification: (options: NotificationOptions) => Promise<boolean>;
  getNotificationPermission: () => Promise<boolean>;
  
  // App info
  getAppInfo: () => Promise<AppInfo>;
  
  // Event listeners
  onBackendStatus: (callback: (status: BackendStatus) => void) => () => void;
  onNotificationClicked: (callback: (data: { taskId: string }) => void) => () => void;
}

// Expose APIs to renderer
const electronAPI: ElectronAPI = {
  // Backend management
  getBackendStatus: () => ipcRenderer.invoke('get-backend-status'),
  restartBackend: () => ipcRenderer.invoke('restart-backend'),
  getBackendLogs: (lines?: number) => ipcRenderer.invoke('get-backend-logs', lines),
  
  // Diagnostics
  runDiagnostics: () => ipcRenderer.invoke('run-diagnostics'),
  getAppLogs: (lines?: number) => ipcRenderer.invoke('get-app-logs', lines),
  getLogFilePath: () => ipcRenderer.invoke('get-log-file-path'),
  
  // Notifications
  showNotification: (options: NotificationOptions) => 
    ipcRenderer.invoke('show-notification', options),
  getNotificationPermission: () => 
    ipcRenderer.invoke('get-notification-permission'),
  
  // App info
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  
  // Event listeners
  onBackendStatus: (callback: (status: BackendStatus) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, status: BackendStatus) => {
      callback(status);
    };
    ipcRenderer.on('backend-status', handler);
    return () => {
      ipcRenderer.removeListener('backend-status', handler);
    };
  },
  
  onNotificationClicked: (callback: (data: { taskId: string }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { taskId: string }) => {
      callback(data);
    };
    ipcRenderer.on('notification-clicked', handler);
    return () => {
      ipcRenderer.removeListener('notification-clicked', handler);
    };
  },
};

// Expose to renderer
contextBridge.exposeInMainWorld('electron', electronAPI);

// Type declaration for window object
declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
