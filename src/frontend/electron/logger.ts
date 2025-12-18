/**
 * LifeFlow V2 - Logger Service
 * 
 * Provides comprehensive logging for debugging backend connection issues.
 * Logs are stored in memory and can be retrieved for display in the UI.
 */

import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  category: string;
  message: string;
  data?: unknown;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private logFile: string | null = null;
  private fileStream: fs.WriteStream | null = null;

  constructor() {
    // Initialize log file in user data directory
    if (app.isPackaged) {
      const logDir = path.join(app.getPath('userData'), 'logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      this.logFile = path.join(logDir, `lifeflow-${timestamp}.log`);
      this.fileStream = fs.createWriteStream(this.logFile, { flags: 'a' });
    }
  }

  private formatMessage(entry: LogEntry): string {
    const ts = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    const data = entry.data ? ` | ${JSON.stringify(entry.data)}` : '';
    return `[${ts}] [${level}] [${entry.category}] ${entry.message}${data}`;
  }

  private log(level: LogLevel, category: string, message: string, data?: unknown): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      category,
      message,
      data,
    };

    // Store in memory
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Format and output
    const formatted = this.formatMessage(entry);

    // Console output with colors
    switch (level) {
      case 'debug':
        console.debug(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }

    // File output
    if (this.fileStream) {
      this.fileStream.write(formatted + '\n');
    }
  }

  debug(category: string, message: string, data?: unknown): void {
    this.log('debug', category, message, data);
  }

  info(category: string, message: string, data?: unknown): void {
    this.log('info', category, message, data);
  }

  warn(category: string, message: string, data?: unknown): void {
    this.log('warn', category, message, data);
  }

  error(category: string, message: string, data?: unknown): void {
    this.log('error', category, message, data);
  }

  /**
   * Get recent logs, optionally filtered by level or category
   */
  getLogs(options?: {
    level?: LogLevel;
    category?: string;
    limit?: number;
  }): LogEntry[] {
    let filtered = this.logs;

    if (options?.level) {
      filtered = filtered.filter(l => l.level === options.level);
    }

    if (options?.category) {
      filtered = filtered.filter(l => l.category === options.category);
    }

    const limit = options?.limit ?? 100;
    return filtered.slice(-limit);
  }

  /**
   * Get logs as formatted strings
   */
  getFormattedLogs(limit = 100): string[] {
    return this.getLogs({ limit }).map(e => this.formatMessage(e));
  }

  /**
   * Get the log file path (production only)
   */
  getLogFilePath(): string | null {
    return this.logFile;
  }

  /**
   * Close the file stream
   */
  close(): void {
    if (this.fileStream) {
      this.fileStream.end();
      this.fileStream = null;
    }
  }
}

// Singleton instance
export const logger = new Logger();

// Convenience functions for common categories
export const backendLog = {
  debug: (msg: string, data?: unknown) => logger.debug('Backend', msg, data),
  info: (msg: string, data?: unknown) => logger.info('Backend', msg, data),
  warn: (msg: string, data?: unknown) => logger.warn('Backend', msg, data),
  error: (msg: string, data?: unknown) => logger.error('Backend', msg, data),
};

export const electronLog = {
  debug: (msg: string, data?: unknown) => logger.debug('Electron', msg, data),
  info: (msg: string, data?: unknown) => logger.info('Electron', msg, data),
  warn: (msg: string, data?: unknown) => logger.warn('Electron', msg, data),
  error: (msg: string, data?: unknown) => logger.error('Electron', msg, data),
};
