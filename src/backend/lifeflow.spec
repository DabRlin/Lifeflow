# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec file for LifeFlow Backend
Generates a standalone executable for the FastAPI backend server
"""

import sys
from pathlib import Path

block_cipher = None

# Get the absolute path to the backend directory
backend_dir = Path(SPECPATH).resolve()

a = Analysis(
    ['run_server.py'],
    pathex=[str(backend_dir)],
    binaries=[],
    datas=[],
    hiddenimports=[
        # FastAPI and dependencies
        'fastapi',
        'fastapi.middleware',
        'fastapi.middleware.cors',
        'starlette',
        'starlette.middleware',
        'starlette.middleware.cors',
        'starlette.routing',
        'starlette.responses',
        'starlette.requests',
        # Uvicorn and dependencies
        'uvicorn',
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        # SQLAlchemy and async support
        'sqlalchemy',
        'sqlalchemy.ext.asyncio',
        'sqlalchemy.orm',
        'aiosqlite',
        # Pydantic
        'pydantic',
        'pydantic_settings',
        'pydantic.deprecated.decorator',
        # HTTP and async
        'httptools',
        'websockets',
        'watchfiles',
        'python_multipart',
        # Email validator (pydantic dependency)
        'email_validator',
        # Typing extensions
        'typing_extensions',
        # App modules
        'app',
        'app.main',
        'app.config',
        'app.database',
        'app.api',
        'app.api.lists',
        'app.api.tasks',
        'app.api.life_entries',
        'app.api.stats',
        'app.api.settings',
        'app.models',
        'app.schemas',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        # Exclude test dependencies
        'pytest',
        'pytest_asyncio',
        'hypothesis',
        'httpx',
        # Exclude unnecessary modules
        'tkinter',
        'matplotlib',
        'numpy',
        'pandas',
        'scipy',
        'PIL',
        'cv2',
        'IPython',
        'jupyter',
        'notebook',
        # Exclude development tools
        'black',
        'flake8',
        'mypy',
        'pylint',
        'isort',
        # Exclude documentation tools
        'sphinx',
        'docutils',
        # Exclude unused standard library modules
        'test',
        'unittest',
        'distutils',
        'setuptools',
        'pip',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='lifeflow-backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True if sys.platform != 'win32' else False,  # Hide console on Windows
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
