import os
import sys
from pathlib import Path
from pydantic_settings import BaseSettings


def get_default_db_path() -> Path:
    """Get the default database path based on the running environment."""
    # Check if running as PyInstaller bundle
    if getattr(sys, 'frozen', False):
        # Use user data directory for packaged app
        if sys.platform == 'win32':
            base = Path(os.environ.get('APPDATA', Path.home()))
        elif sys.platform == 'darwin':
            base = Path.home() / 'Library' / 'Application Support'
        else:
            base = Path(os.environ.get('XDG_DATA_HOME', Path.home() / '.local' / 'share'))
        
        data_dir = base / 'LifeFlow'
        data_dir.mkdir(parents=True, exist_ok=True)
        return data_dir / 'lifeflow.db'
    else:
        # Use current directory for development
        return Path('./lifeflow.db')


class Settings(BaseSettings):
    database_url: str = ""
    database_path: Path = Path("./lifeflow.db")

    class Config:
        env_prefix = "LIFEFLOW_"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Set default database path if not provided via environment
        if not self.database_url or self.database_url == "":
            default_path = get_default_db_path()
            self.database_path = default_path
            self.database_url = f"sqlite+aiosqlite:///{default_path}"


settings = Settings()
