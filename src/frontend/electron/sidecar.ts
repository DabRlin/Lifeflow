/**
 * LifeFlow V2 - Sidecar Process Manager
 * 
 * Manages the backend process lifecycle with robust error handling,
 * automatic restart, and health monitoring.
 */

import { app } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { backendLog } from './logger.js';
import { runDiagnostics, formatDiagnosticReport } from './diagnostics.js';

// Configuration
export interface SidecarConfig {
  port: number;
  host: string;
  maxRestartAttempts: number;
  healthCheckInterval: number;
  startupTimeout: number;
  healthCheckTimeout: number;
}

// Status types
export type SidecarState = 
  | 'stopped'
  | 'starting'
  | 'running'
  | 'crashed'
  | 'failed'
  | 'stopping';

export interface SidecarStatus {
  state: SidecarState;
  pid?: number;
  uptime?: number;
  restartCount: number;
  lastError?: string;
  port: number;
}

// Event types
export type SidecarEvent = 
  | 'started'
  | 'stopped'
  | 'crashed'
  | 'restarted'
  | 'health-check-failed'
  | 'health-check-passed';

type EventCallback = () => void;

// Default configuration
const DEFAULT_CONFIG: SidecarConfig = {
  port: 51731,
  host: '127.0.0.1',
  maxRestartAttempts: 3,
  healthCheckInterval: 30000, // 30 seconds
  startupTimeout: 30000, // 30 seconds
  healthCheckTimeout: 5000, // 5 seconds
};

/**
 * Sidecar Manager Class
 * 
 * Manages the backend process with:
 * - Automatic startup and shutdown
 * - Health monitoring
 * - Automatic restart on crash (up to maxRestartAttempts)
 * - Detailed logging
 */
export class SidecarManager {
  private config: SidecarConfig;
  private process: ChildProcess | null = null;
  private state: SidecarState = 'stopped';
  private restartCount = 0;
  private startTime: Date | null = null;
  private lastError: string | null = null;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private eventListeners: Map<SidecarEvent, EventCallback[]> = new Map();
  private logs: string[] = [];
  private maxLogLines = 500;

  constructor(config: Partial<SidecarConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    backendLog.info('SidecarManager initialized', this.config);
  }

  /**
   * Get the path to the backend executable
   */
  private getBackendPath(): string | null {
    const exeName = process.platform === 'win32' ? 'lifeflow-backend.exe' : 'lifeflow-backend';
    
    // Possible locations for the backend executable
    const possiblePaths = [
      // Production: in resources directory
      path.join(process.resourcesPath, 'backend', exeName),
      // Alternative production location
      path.join(app.getAppPath(), 'backend', exeName),
      // Development: in backend dist directory
      path.join(app.getAppPath(), '..', 'backend', 'dist', exeName),
    ];

    backendLog.debug('Searching for backend executable', { possiblePaths });

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        backendLog.info(`Found backend executable at: ${p}`);
        return p;
      }
    }

    backendLog.warn('Backend executable not found in any expected location');
    return null;
  }

  /**
   * Get the database path in user data directory
   */
  private getDatabasePath(): string {
    const dbPath = path.join(app.getPath('userData'), 'lifeflow.db');
    backendLog.debug(`Database path: ${dbPath}`);
    return dbPath;
  }

  /**
   * Check if running in development mode
   */
  private isDevMode(): boolean {
    return !app.isPackaged || process.env.NODE_ENV === 'development';
  }

  /**
   * Find Python executable for development mode
   */
  private findPythonPath(): string {
    const venvPaths = [
      // Project root venv
      path.join(app.getAppPath(), '..', '..', '.venv', 'bin', 'python'),
      path.join(app.getAppPath(), '..', '..', '.venv', 'Scripts', 'python.exe'),
      // Fallback
      process.platform === 'win32' ? 'python' : 'python3',
    ];

    for (const p of venvPaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }

    return process.platform === 'win32' ? 'python' : 'python3';
  }

  /**
   * Start the backend process
   */
  async start(): Promise<boolean> {
    if (this.state === 'running' || this.state === 'starting') {
      backendLog.warn('Backend already running or starting');
      return true;
    }

    this.state = 'starting';
    backendLog.info('Starting backend process...');

    // Run diagnostics first
    const diagnostics = await runDiagnostics(this.config.port);
    if (diagnostics.summary.failed > 0) {
      backendLog.error('Diagnostics failed', diagnostics.summary);
      backendLog.error(formatDiagnosticReport(diagnostics));
    }

    const dbPath = this.getDatabasePath();
    const isDevMode = this.isDevMode();
    const backendPath = this.getBackendPath();

    // Ensure user data directory exists
    const userDataDir = app.getPath('userData');
    if (!fs.existsSync(userDataDir)) {
      fs.mkdirSync(userDataDir, { recursive: true });
    }

    try {
      if (backendPath && !isDevMode) {
        // Production mode: use bundled executable
        backendLog.info('Starting bundled backend', { backendPath, dbPath });
        
        this.process = spawn(
          backendPath,
          [
            '--port', String(this.config.port),
            '--host', this.config.host,
            '--db-path', dbPath,
            '--packaged',
          ],
          {
            stdio: ['ignore', 'pipe', 'pipe'],
            env: { ...process.env },
          }
        );
      } else {
        // Development mode: use Python
        const pythonPath = this.findPythonPath();
        const backendDir = path.join(app.getAppPath(), '..', 'backend');
        
        backendLog.info('Starting development backend', { pythonPath, backendDir });
        
        this.process = spawn(
          pythonPath,
          [
            '-m', 'uvicorn',
            'app.main:app',
            '--host', this.config.host,
            '--port', String(this.config.port),
          ],
          {
            cwd: backendDir,
            stdio: ['ignore', 'pipe', 'pipe'],
            env: {
              ...process.env,
              PYTHONUNBUFFERED: '1',
              PYTHONPATH: backendDir,
              LIFEFLOW_DATABASE_PATH: dbPath,
              LIFEFLOW_DATABASE_URL: `sqlite+aiosqlite:///${dbPath}`,
            },
            shell: process.platform === 'win32',
          }
        );
      }

      this.setupProcessHandlers();
      
      // Wait for backend to be ready
      const ready = await this.waitForReady();
      
      if (ready) {
        this.state = 'running';
        this.startTime = new Date();
        this.emit('started');
        this.startHealthCheck();
        backendLog.info('Backend started successfully', { pid: this.process?.pid });
        return true;
      } else {
        this.state = 'failed';
        this.lastError = 'Backend failed to start within timeout';
        backendLog.error(this.lastError);
        return false;
      }
    } catch (error) {
      this.state = 'failed';
      this.lastError = String(error);
      backendLog.error('Failed to start backend', { error: this.lastError });
      return false;
    }
  }

  /**
   * Setup process event handlers
   */
  private setupProcessHandlers(): void {
    if (!this.process) return;

    this.process.stdout?.on('data', (data: Buffer) => {
      const line = data.toString().trim();
      this.addLog(line);
      backendLog.debug(line);
    });

    this.process.stderr?.on('data', (data: Buffer) => {
      const line = data.toString().trim();
      this.addLog(`[ERROR] ${line}`);
      backendLog.error(line);
    });

    this.process.on('error', (err: Error) => {
      this.lastError = err.message;
      backendLog.error('Backend process error', { error: err.message });
    });

    this.process.on('close', (code: number | null) => {
      backendLog.info(`Backend process exited with code ${code}`);
      this.stopHealthCheck();
      
      if (this.state === 'stopping') {
        this.state = 'stopped';
        this.emit('stopped');
      } else if (this.state === 'running' || this.state === 'starting') {
        this.state = 'crashed';
        this.lastError = `Process exited with code ${code}`;
        this.emit('crashed');
        this.handleCrash();
      }
      
      this.process = null;
    });
  }

  /**
   * Handle process crash with automatic restart
   */
  private async handleCrash(): Promise<void> {
    if (this.restartCount >= this.config.maxRestartAttempts) {
      backendLog.error(`Max restart attempts (${this.config.maxRestartAttempts}) reached`);
      this.state = 'failed';
      return;
    }

    this.restartCount++;
    backendLog.info(`Attempting restart ${this.restartCount}/${this.config.maxRestartAttempts}`);
    
    // Wait a bit before restarting
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const success = await this.start();
    if (success) {
      this.emit('restarted');
    }
  }

  /**
   * Wait for backend to be ready
   */
  private async waitForReady(): Promise<boolean> {
    const startTime = Date.now();
    const maxWait = this.config.startupTimeout;
    const checkInterval = 500;

    while (Date.now() - startTime < maxWait) {
      if (await this.healthCheck()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }

    return false;
  }

  /**
   * Perform health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.healthCheckTimeout
      );

      const response = await fetch(
        `http://${this.config.host}:${this.config.port}/api/health`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'healthy') {
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Start periodic health checks
   */
  private startHealthCheck(): void {
    this.stopHealthCheck();
    
    this.healthCheckTimer = setInterval(async () => {
      const healthy = await this.healthCheck();
      if (healthy) {
        this.emit('health-check-passed');
      } else {
        backendLog.warn('Health check failed');
        this.emit('health-check-failed');
      }
    }, this.config.healthCheckInterval);
  }

  /**
   * Stop periodic health checks
   */
  private stopHealthCheck(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  /**
   * Stop the backend process
   */
  async stop(): Promise<void> {
    if (!this.process || this.state === 'stopped' || this.state === 'stopping') {
      return;
    }

    this.state = 'stopping';
    this.stopHealthCheck();
    backendLog.info('Stopping backend process...');

    const pid = this.process.pid;

    // Send SIGTERM for graceful shutdown
    this.process.kill('SIGTERM');

    // Set up force kill timeout
    const forceKillTimeout = setTimeout(() => {
      if (this.process && this.process.pid === pid) {
        backendLog.warn('Force killing backend process');
        this.process.kill('SIGKILL');
      }
    }, 5000);

    // Wait for process to exit
    await new Promise<void>(resolve => {
      if (this.process) {
        this.process.once('close', () => {
          clearTimeout(forceKillTimeout);
          resolve();
        });
      } else {
        clearTimeout(forceKillTimeout);
        resolve();
      }
    });

    this.state = 'stopped';
    this.process = null;
    backendLog.info('Backend process stopped');
  }

  /**
   * Restart the backend process
   */
  async restart(): Promise<boolean> {
    backendLog.info('Restarting backend...');
    await this.stop();
    this.restartCount = 0; // Reset restart count for manual restart
    return this.start();
  }

  /**
   * Get current status
   */
  getStatus(): SidecarStatus {
    return {
      state: this.state,
      pid: this.process?.pid,
      uptime: this.startTime ? Date.now() - this.startTime.getTime() : undefined,
      restartCount: this.restartCount,
      lastError: this.lastError ?? undefined,
      port: this.config.port,
    };
  }

  /**
   * Check if backend is running
   */
  isRunning(): boolean {
    return this.state === 'running';
  }

  /**
   * Get the backend port
   */
  getPort(): number {
    return this.config.port;
  }

  /**
   * Get backend logs
   */
  getLogs(lines?: number): string[] {
    const limit = lines ?? this.maxLogLines;
    return this.logs.slice(-limit);
  }

  /**
   * Add a log line
   */
  private addLog(line: string): void {
    this.logs.push(line);
    if (this.logs.length > this.maxLogLines) {
      this.logs.shift();
    }
  }

  /**
   * Register event listener
   */
  on(event: SidecarEvent, callback: EventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  off(event: SidecarEvent, callback: EventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  private emit(event: SidecarEvent): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback());
    }
  }
}

// Singleton instance
let sidecarInstance: SidecarManager | null = null;

/**
 * Get or create the sidecar manager instance
 */
export function getSidecarManager(config?: Partial<SidecarConfig>): SidecarManager {
  if (!sidecarInstance) {
    sidecarInstance = new SidecarManager(config);
  }
  return sidecarInstance;
}

/**
 * Cleanup sidecar manager
 */
export async function cleanupSidecar(): Promise<void> {
  if (sidecarInstance) {
    await sidecarInstance.stop();
    sidecarInstance = null;
  }
}
