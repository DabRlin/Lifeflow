/**
 * LifeFlow V2 - Diagnostics Module
 * 
 * Provides comprehensive diagnostics for backend connection issues.
 * This module helps identify why the backend might fail to start or connect.
 */

import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as net from 'net';
import { execSync } from 'child_process';
import { backendLog } from './logger.js';

export interface DiagnosticResult {
  category: string;
  check: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: unknown;
}

export interface DiagnosticReport {
  timestamp: Date;
  environment: EnvironmentInfo;
  results: DiagnosticResult[];
  summary: {
    passed: number;
    failed: number;
    warnings: number;
  };
}

export interface EnvironmentInfo {
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
}

/**
 * Collect environment information
 */
export function getEnvironmentInfo(): EnvironmentInfo {
  return {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    electronVersion: process.versions.electron || 'unknown',
    appVersion: app.getVersion(),
    isPackaged: app.isPackaged,
    resourcesPath: process.resourcesPath,
    userDataPath: app.getPath('userData'),
    appPath: app.getAppPath(),
    execPath: process.execPath,
  };
}

/**
 * Check if the bundled backend executable exists
 */
function checkBackendExecutable(): DiagnosticResult {
  const exeName = process.platform === 'win32' ? 'lifeflow-backend.exe' : 'lifeflow-backend';
  const possiblePaths = [
    path.join(process.resourcesPath, 'backend', exeName),
    path.join(app.getAppPath(), 'backend', exeName),
    path.join(app.getAppPath(), '..', 'backend', exeName),
  ];

  backendLog.info('Checking backend executable paths', { possiblePaths });

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      const stats = fs.statSync(p);
      const isExecutable = (stats.mode & fs.constants.X_OK) !== 0 || process.platform === 'win32';
      
      if (isExecutable) {
        return {
          category: 'Backend',
          check: 'Executable exists',
          status: 'pass',
          message: `Backend executable found at: ${p}`,
          details: { path: p, size: stats.size, mode: stats.mode.toString(8) },
        };
      } else {
        return {
          category: 'Backend',
          check: 'Executable exists',
          status: 'fail',
          message: `Backend found but not executable: ${p}`,
          details: { path: p, mode: stats.mode.toString(8) },
        };
      }
    }
  }

  return {
    category: 'Backend',
    check: 'Executable exists',
    status: app.isPackaged ? 'fail' : 'warn',
    message: app.isPackaged 
      ? 'Backend executable not found in any expected location'
      : 'Backend executable not found (expected in development mode)',
    details: { searchedPaths: possiblePaths },
  };
}

/**
 * Check if the user data directory is writable
 */
function checkUserDataDirectory(): DiagnosticResult {
  const userDataPath = app.getPath('userData');
  
  try {
    // Ensure directory exists
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }

    // Test write access
    const testFile = path.join(userDataPath, '.write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);

    return {
      category: 'Storage',
      check: 'User data directory writable',
      status: 'pass',
      message: `User data directory is writable: ${userDataPath}`,
      details: { path: userDataPath },
    };
  } catch (error) {
    return {
      category: 'Storage',
      check: 'User data directory writable',
      status: 'fail',
      message: `Cannot write to user data directory: ${userDataPath}`,
      details: { path: userDataPath, error: String(error) },
    };
  }
}

/**
 * Check if the default port is available
 */
async function checkPortAvailability(port: number): Promise<DiagnosticResult> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        resolve({
          category: 'Network',
          check: `Port ${port} availability`,
          status: 'fail',
          message: `Port ${port} is already in use`,
          details: { port, error: err.code },
        });
      } else {
        resolve({
          category: 'Network',
          check: `Port ${port} availability`,
          status: 'warn',
          message: `Could not check port ${port}: ${err.message}`,
          details: { port, error: err.message },
        });
      }
    });

    server.once('listening', () => {
      server.close();
      resolve({
        category: 'Network',
        check: `Port ${port} availability`,
        status: 'pass',
        message: `Port ${port} is available`,
        details: { port },
      });
    });

    server.listen(port, '127.0.0.1');
  });
}

/**
 * Check system resources
 */
function checkSystemResources(): DiagnosticResult {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const freeMemPercent = (freeMem / totalMem) * 100;

  const status = freeMemPercent < 5 ? 'fail' : freeMemPercent < 15 ? 'warn' : 'pass';
  const message = `Free memory: ${Math.round(freeMem / 1024 / 1024)}MB (${freeMemPercent.toFixed(1)}%)`;

  return {
    category: 'System',
    check: 'Available memory',
    status,
    message,
    details: {
      totalMem: Math.round(totalMem / 1024 / 1024),
      freeMem: Math.round(freeMem / 1024 / 1024),
      freePercent: freeMemPercent.toFixed(1),
    },
  };
}

/**
 * Check if there are any zombie backend processes
 */
function checkZombieProcesses(): DiagnosticResult {
  try {
    let processes: string[] = [];
    
    if (process.platform === 'win32') {
      const output = execSync('tasklist /FI "IMAGENAME eq lifeflow-backend.exe" /FO CSV', {
        encoding: 'utf-8',
        timeout: 5000,
      });
      processes = output.split('\n').filter(line => line.includes('lifeflow-backend'));
    } else {
      const output = execSync('pgrep -f lifeflow-backend || true', {
        encoding: 'utf-8',
        timeout: 5000,
      });
      processes = output.trim().split('\n').filter(Boolean);
    }

    if (processes.length > 0) {
      return {
        category: 'Process',
        check: 'Zombie processes',
        status: 'warn',
        message: `Found ${processes.length} existing backend process(es)`,
        details: { processes },
      };
    }

    return {
      category: 'Process',
      check: 'Zombie processes',
      status: 'pass',
      message: 'No existing backend processes found',
    };
  } catch (error) {
    return {
      category: 'Process',
      check: 'Zombie processes',
      status: 'warn',
      message: 'Could not check for existing processes',
      details: { error: String(error) },
    };
  }
}

/**
 * Run all diagnostics and generate a report
 */
export async function runDiagnostics(port = 51731): Promise<DiagnosticReport> {
  backendLog.info('Starting diagnostics');

  const results: DiagnosticResult[] = [];

  // Run synchronous checks
  results.push(checkBackendExecutable());
  results.push(checkUserDataDirectory());
  results.push(checkSystemResources());
  results.push(checkZombieProcesses());

  // Run async checks
  results.push(await checkPortAvailability(port));

  // Calculate summary
  const summary = {
    passed: results.filter(r => r.status === 'pass').length,
    failed: results.filter(r => r.status === 'fail').length,
    warnings: results.filter(r => r.status === 'warn').length,
  };

  const report: DiagnosticReport = {
    timestamp: new Date(),
    environment: getEnvironmentInfo(),
    results,
    summary,
  };

  // Log results
  backendLog.info('Diagnostics complete', {
    passed: summary.passed,
    failed: summary.failed,
    warnings: summary.warnings,
  });

  for (const result of results) {
    const logFn = result.status === 'fail' ? backendLog.error 
                : result.status === 'warn' ? backendLog.warn 
                : backendLog.info;
    logFn(`[${result.category}] ${result.check}: ${result.message}`, result.details);
  }

  return report;
}

/**
 * Format diagnostic report as a string for display
 */
export function formatDiagnosticReport(report: DiagnosticReport): string {
  const lines: string[] = [];
  
  lines.push('=== LifeFlow Diagnostic Report ===');
  lines.push(`Timestamp: ${report.timestamp.toISOString()}`);
  lines.push('');
  
  lines.push('--- Environment ---');
  lines.push(`Platform: ${report.environment.platform} (${report.environment.arch})`);
  lines.push(`Electron: ${report.environment.electronVersion}`);
  lines.push(`App Version: ${report.environment.appVersion}`);
  lines.push(`Packaged: ${report.environment.isPackaged}`);
  lines.push(`Resources: ${report.environment.resourcesPath}`);
  lines.push(`User Data: ${report.environment.userDataPath}`);
  lines.push('');
  
  lines.push('--- Results ---');
  for (const result of report.results) {
    const icon = result.status === 'pass' ? '✓' : result.status === 'fail' ? '✗' : '⚠';
    lines.push(`${icon} [${result.category}] ${result.check}`);
    lines.push(`  ${result.message}`);
  }
  lines.push('');
  
  lines.push('--- Summary ---');
  lines.push(`Passed: ${report.summary.passed}`);
  lines.push(`Failed: ${report.summary.failed}`);
  lines.push(`Warnings: ${report.summary.warnings}`);
  
  return lines.join('\n');
}
