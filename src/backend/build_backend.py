#!/usr/bin/env python3
"""
LifeFlow Backend Build Script

This script builds the FastAPI backend into a standalone executable using PyInstaller.
Supports Windows and macOS platforms.

Usage:
    python build_backend.py [--clean] [--output-dir DIR]
"""

import argparse
import os
import platform
import shutil
import subprocess
import sys
from pathlib import Path


def get_platform_info():
    """Get current platform information."""
    system = platform.system().lower()
    machine = platform.machine().lower()
    
    if system == 'darwin':
        platform_name = 'macos'
        exe_suffix = ''
    elif system == 'windows':
        platform_name = 'windows'
        exe_suffix = '.exe'
    else:
        platform_name = 'linux'
        exe_suffix = ''
    
    return {
        'system': system,
        'machine': machine,
        'platform_name': platform_name,
        'exe_suffix': exe_suffix,
    }


def clean_build_artifacts(backend_dir: Path):
    """Clean previous build artifacts."""
    dirs_to_clean = ['build', 'dist', '__pycache__']
    files_to_clean = ['*.pyc', '*.pyo']
    
    for dir_name in dirs_to_clean:
        dir_path = backend_dir / dir_name
        if dir_path.exists():
            print(f"Removing {dir_path}")
            shutil.rmtree(dir_path)
    
    # Clean __pycache__ in subdirectories
    for pycache in backend_dir.rglob('__pycache__'):
        print(f"Removing {pycache}")
        shutil.rmtree(pycache)


def run_pyinstaller(backend_dir: Path, output_dir: Path):
    """Run PyInstaller to build the executable."""
    spec_file = backend_dir / 'lifeflow.spec'
    
    if not spec_file.exists():
        print(f"Error: Spec file not found: {spec_file}")
        sys.exit(1)
    
    # Build command
    cmd = [
        sys.executable, '-m', 'PyInstaller',
        '--clean',
        '--noconfirm',
        '--distpath', str(output_dir),
        '--workpath', str(backend_dir / 'build'),
        str(spec_file),
    ]
    
    print(f"Running: {' '.join(cmd)}")
    
    result = subprocess.run(cmd, cwd=str(backend_dir))
    
    if result.returncode != 0:
        print("Error: PyInstaller build failed")
        sys.exit(1)
    
    return True


def verify_build(output_dir: Path, platform_info: dict):
    """Verify the build output exists."""
    exe_name = f"lifeflow-backend{platform_info['exe_suffix']}"
    exe_path = output_dir / exe_name
    
    if exe_path.exists():
        size_mb = exe_path.stat().st_size / (1024 * 1024)
        print(f"\n✓ Build successful!")
        print(f"  Executable: {exe_path}")
        print(f"  Size: {size_mb:.2f} MB")
        return True
    else:
        print(f"\n✗ Build failed: executable not found at {exe_path}")
        return False


def main():
    parser = argparse.ArgumentParser(description='Build LifeFlow Backend')
    parser.add_argument(
        '--clean',
        action='store_true',
        help='Clean build artifacts before building'
    )
    parser.add_argument(
        '--output-dir', '-o',
        type=str,
        default=None,
        help='Output directory for the executable (default: dist/)'
    )
    parser.add_argument(
        '--skip-verify',
        action='store_true',
        help='Skip build verification'
    )
    
    args = parser.parse_args()
    
    # Get paths
    backend_dir = Path(__file__).parent.resolve()
    output_dir = Path(args.output_dir) if args.output_dir else backend_dir / 'dist'
    
    # Get platform info
    platform_info = get_platform_info()
    
    print("=" * 60)
    print("LifeFlow Backend Build")
    print("=" * 60)
    print(f"Platform: {platform_info['platform_name']} ({platform_info['machine']})")
    print(f"Backend dir: {backend_dir}")
    print(f"Output dir: {output_dir}")
    print("=" * 60)
    
    # Clean if requested
    if args.clean:
        print("\nCleaning build artifacts...")
        clean_build_artifacts(backend_dir)
    
    # Ensure output directory exists
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Run PyInstaller
    print("\nBuilding executable...")
    run_pyinstaller(backend_dir, output_dir)
    
    # Verify build
    if not args.skip_verify:
        print("\nVerifying build...")
        if not verify_build(output_dir, platform_info):
            sys.exit(1)
    
    print("\nBuild complete!")
    print(f"\nTo test the executable, run:")
    exe_name = f"lifeflow-backend{platform_info['exe_suffix']}"
    print(f"  {output_dir / exe_name} --port 51731")


if __name__ == '__main__':
    main()
