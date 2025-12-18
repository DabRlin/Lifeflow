import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import lists, tasks, life_entries, stats, settings, notifications
from app.database import init_db

# Configure logging for better diagnostics
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger('lifeflow')

app = FastAPI(
    title="LifeFlow API",
    description="LifeFlow Backend API for task, habit, and life management",
    version="0.2.0"
)

# CORS configuration - allow all origins for Electron app compatibility
# In production, the Electron app loads from file:// or app:// protocol
# which requires permissive CORS settings for local API access
allowed_origins = [
    "http://localhost:5173",      # Vite dev server
    "http://127.0.0.1:5173",      # Vite dev server (alternative)
    "http://localhost:51731",     # Direct API access
    "http://127.0.0.1:51731",     # Direct API access (alternative)
    "app://.",                    # Electron custom protocol
    "file://",                    # Electron file protocol
]

# In packaged mode, we need to allow all origins since Electron
# may use various protocols depending on the platform
is_packaged = os.environ.get('LIFEFLOW_PACKAGED', 'false').lower() == 'true'

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if is_packaged else allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(lists.router, prefix="/api/lists", tags=["lists"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(life_entries.router, prefix="/api/life-entries", tags=["life-entries"])
app.include_router(stats.router, prefix="/api/stats", tags=["stats"])
app.include_router(settings.router, prefix="/api/settings", tags=["settings"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["notifications"])


@app.on_event("startup")
async def startup():
    """Initialize the application on startup."""
    logger.info("=" * 50)
    logger.info("LifeFlow Backend Starting")
    logger.info("=" * 50)
    logger.info(f"Database URL: {os.environ.get('LIFEFLOW_DATABASE_URL', 'default')}")
    logger.info(f"Database Path: {os.environ.get('LIFEFLOW_DATABASE_PATH', 'default')}")
    logger.info(f"Packaged Mode: {is_packaged}")
    logger.info(f"CORS Origins: {'*' if is_packaged else allowed_origins}")
    
    await init_db()
    logger.info("Database initialized successfully")
    logger.info("Backend ready to accept connections")


@app.on_event("shutdown")
async def shutdown():
    """Cleanup on shutdown."""
    logger.info("LifeFlow Backend shutting down")


@app.get("/api/health")
async def health_check():
    """Health check endpoint for monitoring backend status."""
    return {
        "status": "healthy",
        "version": "0.2.0",
        "packaged": is_packaged,
    }


@app.get("/api/diagnostics")
async def diagnostics():
    """Diagnostics endpoint for debugging connection issues."""
    import sys
    return {
        "status": "ok",
        "python_version": sys.version,
        "frozen": getattr(sys, 'frozen', False),
        "database_path": os.environ.get('LIFEFLOW_DATABASE_PATH', 'not set'),
        "packaged": is_packaged,
        "cors_origins": "*" if is_packaged else allowed_origins,
    }
