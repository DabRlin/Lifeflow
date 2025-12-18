#!/usr/bin/env python3
"""
LifeFlow Backend Server Entry Point (V2)

This script serves as the entry point for both development and production (PyInstaller) environments.
It handles:
- Command line arguments for port and database path configuration
- Proper path resolution for packaged executables
- Graceful shutdown handling
- Comprehensive startup diagnostics for debugging connection issues
"""

import argparse
import os
import sys
import signal
import socket
import time
from pathlib import Path
from datetime import datetime


def log(message: str, level: str = "INFO") -> None:
    """Print a timestamped log message."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [{level}] {message}", flush=True)


def get_base_path() -> Path:
    """Get the base path for the application.
    
    When running as a PyInstaller bundle, this returns the path to the
    temporary directory where the bundle is extracted.
    When running as a script, this returns the directory containing the script.
    """
    if getattr(sys, 'frozen', False):
        # Running as PyInstaller bundle
        return Path(sys.executable).parent
    else:
        # Running as script
        return Path(__file__).parent


def get_user_data_path() -> Path:
    """Get the user data directory for storing the database.
    
    Returns platform-specific user data directory:
    - Windows: %APPDATA%/LifeFlow
    - macOS: ~/Library/Application Support/LifeFlow
    - Linux: ~/.local/share/LifeFlow
    """
    if sys.platform == 'win32':
        base = Path(os.environ.get('APPDATA', Path.home()))
    elif sys.platform == 'darwin':
        base = Path.home() / 'Library' / 'Application Support'
    else:
        base = Path(os.environ.get('XDG_DATA_HOME', Path.home() / '.local' / 'share'))
    
    data_dir = base / 'LifeFlow'
    data_dir.mkdir(parents=True, exist_ok=True)
    return data_dir


def setup_environment(db_path: str | None = None, is_packaged: bool = False):
    """Setup environment variables for the application."""
    log("Setting up environment...")
    
    if db_path:
        # Use provided database path
        db_file = Path(db_path)
        log(f"Using provided database path: {db_file}")
    else:
        # Use default user data directory
        db_file = get_user_data_path() / 'lifeflow.db'
        log(f"Using default database path: {db_file}")
    
    # Ensure parent directory exists
    db_file.parent.mkdir(parents=True, exist_ok=True)
    log(f"Database directory exists: {db_file.parent.exists()}")
    
    # Set environment variables for the app config
    os.environ['LIFEFLOW_DATABASE_PATH'] = str(db_file)
    os.environ['LIFEFLOW_DATABASE_URL'] = f'sqlite+aiosqlite:///{db_file}'
    os.environ['LIFEFLOW_PACKAGED'] = 'true' if is_packaged else 'false'
    
    log(f"Environment configured:")
    log(f"  LIFEFLOW_DATABASE_PATH = {os.environ['LIFEFLOW_DATABASE_PATH']}")
    log(f"  LIFEFLOW_PACKAGED = {os.environ['LIFEFLOW_PACKAGED']}")


def check_port_available(host: str, port: int) -> bool:
    """Check if a port is available for binding."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind((host, port))
            return True
    except OSError:
        return False


def print_startup_banner(host: str, port: int, is_frozen: bool):
    """Print startup information banner."""
    log("=" * 60)
    log("LifeFlow Backend Server V2")
    log("=" * 60)
    log(f"Python Version: {sys.version}")
    log(f"Platform: {sys.platform}")
    log(f"Frozen (PyInstaller): {is_frozen}")
    log(f"Executable: {sys.executable}")
    log(f"Working Directory: {os.getcwd()}")
    log(f"Base Path: {get_base_path()}")
    log(f"User Data Path: {get_user_data_path()}")
    log(f"Host: {host}")
    log(f"Port: {port}")
    log("=" * 60)


def main():
    parser = argparse.ArgumentParser(description='LifeFlow Backend Server V2')
    parser.add_argument(
        '--port', '-p',
        type=int,
        default=51731,
        help='Port to run the server on (default: 51731)'
    )
    parser.add_argument(
        '--host', '-H',
        type=str,
        default='127.0.0.1',
        help='Host to bind the server to (default: 127.0.0.1)'
    )
    parser.add_argument(
        '--db-path', '-d',
        type=str,
        default=None,
        help='Path to the SQLite database file (default: user data directory)'
    )
    parser.add_argument(
        '--reload',
        action='store_true',
        help='Enable auto-reload for development (not available in packaged mode)'
    )
    parser.add_argument(
        '--packaged',
        action='store_true',
        help='Indicate running in packaged mode (enables permissive CORS)'
    )
    
    args = parser.parse_args()
    
    # Check if running as frozen executable
    is_frozen = getattr(sys, 'frozen', False)
    is_packaged = args.packaged or is_frozen
    
    # Print startup banner
    print_startup_banner(args.host, args.port, is_frozen)
    
    # Check port availability
    if not check_port_available(args.host, args.port):
        log(f"Port {args.port} is already in use!", "ERROR")
        log("Please close any existing backend processes or use a different port.", "ERROR")
        sys.exit(1)
    log(f"Port {args.port} is available")
    
    # Setup environment
    setup_environment(args.db_path, is_packaged)
    
    # Import uvicorn after setting up environment
    log("Importing uvicorn...")
    import uvicorn
    log("Uvicorn imported successfully")
    
    # Disable reload in frozen mode
    reload_enabled = args.reload and not is_frozen
    if args.reload and is_frozen:
        log("Warning: --reload is not available in packaged mode", "WARN")
    
    # Setup signal handlers for graceful shutdown
    def signal_handler(signum, frame):
        log("Received shutdown signal, exiting gracefully...")
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    log(f"Starting uvicorn server on {args.host}:{args.port}...")
    
    # Run the server
    try:
        uvicorn.run(
            "app.main:app",
            host=args.host,
            port=args.port,
            reload=reload_enabled,
            log_level="info",
        )
    except Exception as e:
        log(f"Failed to start server: {e}", "ERROR")
        sys.exit(1)


if __name__ == '__main__':
    main()
