/**
 * LifeFlow V2 - Electron Main Process
 * 
 * Main entry point for the Electron application.
 * Manages window creation, backend lifecycle, and IPC communication.
 */

import { app, BrowserWindow, ipcMain, Notification, dialog } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { getSidecarManager, cleanupSidecar, SidecarStatus } from './sidecar.js';
import { logger, electronLog } from './logger.js';
import { runDiagnostics, formatDiagnosticReport, DiagnosticReport } from './diagnostics.js';

// Performance optimizations for faster startup
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-software-rasterizer');
// Disable hardware acceleration if not needed (reduces memory usage)
// app.disableHardwareAcceleration();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global references
let mainWindow: BrowserWindow | null = null;

// Configuration
const isDev = process.env.NODE_ENV === 'development';
const VITE_DEV_SERVER_URL = 'http://localhost:5173';
const BACKEND_PORT = 51731;

/**
 * Create the main application window
 */
function createWindow(): void {
  electronLog.info('Creating main window');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    titleBarStyle: 'hiddenInset',
    show: false,
    backgroundColor: '#ffffff',
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    electronLog.info('Main window shown');
  });

  // Load content
  if (isDev && VITE_DEV_SERVER_URL) {
    electronLog.info(`Loading dev server: ${VITE_DEV_SERVER_URL}`);
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    electronLog.info(`Loading production build: ${indexPath}`);
    mainWindow.loadFile(indexPath);
  }

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
    electronLog.info('Main window closed');
  });
}

/**
 * Show error dialog for critical failures
 */
async function showErrorDialog(title: string, message: string, detail?: string): Promise<void> {
  await dialog.showMessageBox({
    type: 'error',
    title,
    message,
    detail,
    buttons: ['OK'],
  });
}

/**
 * Initialize the application
 */
async function initialize(): Promise<void> {
  electronLog.info('=' .repeat(60));
  electronLog.info('LifeFlow V2 Starting');
  electronLog.info('=' .repeat(60));
  electronLog.info(`Version: ${app.getVersion()}`);
  electronLog.info(`Platform: ${process.platform} (${process.arch})`);
  electronLog.info(`Electron: ${process.versions.electron}`);
  electronLog.info(`Packaged: ${app.isPackaged}`);
  electronLog.info(`User Data: ${app.getPath('userData')}`);

  // Get sidecar manager
  const sidecar = getSidecarManager({ port: BACKEND_PORT });

  // Setup sidecar event handlers
  sidecar.on('started', () => {
    electronLog.info('Backend started');
    mainWindow?.webContents.send('backend-status', sidecar.getStatus());
  });

  sidecar.on('stopped', () => {
    electronLog.info('Backend stopped');
    mainWindow?.webContents.send('backend-status', sidecar.getStatus());
  });

  sidecar.on('crashed', () => {
    electronLog.error('Backend crashed');
    mainWindow?.webContents.send('backend-status', sidecar.getStatus());
  });

  sidecar.on('restarted', () => {
    electronLog.info('Backend restarted');
    mainWindow?.webContents.send('backend-status', sidecar.getStatus());
  });

  // Start backend
  electronLog.info('Starting backend...');
  const backendStarted = await sidecar.start();

  if (!backendStarted) {
    electronLog.error('Failed to start backend');
    
    // Run diagnostics
    const diagnostics = await runDiagnostics(BACKEND_PORT);
    const report = formatDiagnosticReport(diagnostics);
    electronLog.error('Diagnostic Report:\n' + report);

    // Show error dialog
    await showErrorDialog(
      'Backend Error',
      'Failed to start the backend service.',
      `The application backend could not be started. This may be due to:\n\n` +
      `• Port ${BACKEND_PORT} is already in use\n` +
      `• Missing backend executable\n` +
      `• Insufficient permissions\n\n` +
      `Please check the logs for more details.`
    );

    app.quit();
    return;
  }

  electronLog.info('Backend started successfully');

  // Create main window
  createWindow();
}

// ============================================================================
// IPC Handlers
// ============================================================================

// Backend status
ipcMain.handle('get-backend-status', (): SidecarStatus => {
  return getSidecarManager().getStatus();
});

// Backend restart
ipcMain.handle('restart-backend', async (): Promise<boolean> => {
  return getSidecarManager().restart();
});

// Get backend logs
ipcMain.handle('get-backend-logs', (_event, lines?: number): string[] => {
  return getSidecarManager().getLogs(lines);
});

// Get application logs
ipcMain.handle('get-app-logs', (_event, lines?: number): string[] => {
  return logger.getFormattedLogs(lines);
});

// Run diagnostics
ipcMain.handle('run-diagnostics', async (): Promise<DiagnosticReport> => {
  return runDiagnostics(BACKEND_PORT);
});

// Get log file path
ipcMain.handle('get-log-file-path', (): string | null => {
  return logger.getLogFilePath();
});

// Notifications
ipcMain.handle('show-notification', (_event, options: { 
  title: string; 
  body: string; 
  taskId?: string;
}): boolean => {
  if (Notification.isSupported()) {
    const notification = new Notification({
      title: options.title,
      body: options.body,
    });

    notification.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
        mainWindow.focus();

        if (options.taskId) {
          mainWindow.webContents.send('notification-clicked', { taskId: options.taskId });
        }
      }
    });

    notification.show();
    return true;
  }
  return false;
});

ipcMain.handle('get-notification-permission', (): boolean => {
  return Notification.isSupported();
});

// App info
ipcMain.handle('get-app-info', () => ({
  version: app.getVersion(),
  platform: process.platform,
  arch: process.arch,
  electron: process.versions.electron,
  chrome: process.versions.chrome,
  node: process.versions.node,
  isPackaged: app.isPackaged,
  userDataPath: app.getPath('userData'),
}));

// ============================================================================
// App Lifecycle
// ============================================================================

app.whenReady().then(initialize);

app.on('window-all-closed', async () => {
  electronLog.info('All windows closed');
  
  // On macOS, don't cleanup sidecar here - wait for before-quit
  // This allows the app to stay in dock and restart properly
  if (process.platform !== 'darwin') {
    await cleanupSidecar();
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', async () => {
  electronLog.info('Application quitting');
  await cleanupSidecar();
  logger.close();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  electronLog.error('Uncaught exception', { error: error.message, stack: error.stack });
});

process.on('unhandledRejection', (reason) => {
  electronLog.error('Unhandled rejection', { reason: String(reason) });
});
