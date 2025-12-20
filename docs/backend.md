# 后端文档

## 概述

LifeFlow 后端采用 FastAPI 框架构建，提供 RESTful API 服务。使用 SQLite 作为数据库，SQLAlchemy 作为 ORM，支持异步操作。

## 技术栈

- **FastAPI**: 现代高性能 Web 框架
- **SQLAlchemy 2.0**: 异步 ORM
- **SQLite + aiosqlite**: 轻量级异步数据库
- **Pydantic v2**: 数据验证和序列化
- **Uvicorn**: ASGI 服务器
- **PyInstaller**: 打包为独立可执行文件

## 目录结构

```
src/backend/
├── app/
│   ├── api/                # API 路由模块
│   ├── models/             # SQLAlchemy 模型
│   ├── schemas/            # Pydantic 模式
│   ├── services/           # 业务逻辑服务
│   ├── config.py           # 配置管理
│   ├── database.py         # 数据库连接
│   └── main.py             # FastAPI 应用
├── tests/                  # 测试代码
├── run_server.py           # 服务器启动脚本
├── seed_data.py            # 测试数据生成
├── lifeflow.spec           # PyInstaller 配置
└── requirements.txt        # 依赖列表
```

## 核心模块

### 配置管理 (`app/config.py`)

```python
class Settings(BaseSettings):
    database_url: str = ""
    database_path: Path = Path("./lifeflow.db")

    class Config:
        env_prefix = "LIFEFLOW_"
```

配置项通过环境变量设置：
- `LIFEFLOW_DATABASE_PATH`: 数据库文件路径
- `LIFEFLOW_DATABASE_URL`: 数据库连接 URL
- `LIFEFLOW_PACKAGED`: 是否为打包模式

数据库路径自动检测：
- **开发模式**: 当前目录 `./lifeflow.db`
- **打包模式**: 
  - macOS: `~/Library/Application Support/LifeFlow/lifeflow.db`
  - Windows: `%APPDATA%/LifeFlow/lifeflow.db`

### 数据库连接 (`app/database.py`)

```python
# 异步引擎
engine = create_async_engine(
    settings.database_url,
    echo=False,
    future=True,
)

# 异步会话
async_session = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# 依赖注入
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session
```

### 应用入口 (`app/main.py`)

```python
app = FastAPI(
    title="LifeFlow API",
    version="2.0.0",
    description="个人效率管理应用 API",
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "app://.",
        "file://",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 路由注册
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(lists.router, prefix="/api/lists", tags=["lists"])
app.include_router(life_entries.router, prefix="/api/life-entries", tags=["life-entries"])
app.include_router(stats.router, prefix="/api/stats", tags=["stats"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["notifications"])
app.include_router(settings.router, prefix="/api/settings", tags=["settings"])
```

## 数据模型

### TaskCard (任务卡片)

```python
class TaskCard(Base):
    __tablename__ = "task_cards"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    list_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("card_lists.id"))
    is_habit: Mapped[bool] = mapped_column(Boolean, default=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    current_streak: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    last_checkin_date: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    reminder_time: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    position: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # 关系
    list: Mapped[Optional["CardList"]] = relationship(back_populates="tasks")
    checkins: Mapped[List["CheckinRecord"]] = relationship(back_populates="task")
```

### CardList (分类列表)

```python
class CardList(Base):
    __tablename__ = "card_lists"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    color: Mapped[Optional[str]] = mapped_column(String(7), nullable=True)
    icon: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    position: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # 关系
    tasks: Mapped[List["TaskCard"]] = relationship(back_populates="list")
```

### CheckinRecord (打卡记录)

```python
class CheckinRecord(Base):
    __tablename__ = "checkin_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    task_id: Mapped[str] = mapped_column(String(36), ForeignKey("task_cards.id"))
    checkin_date: Mapped[str] = mapped_column(String(10), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # 关系
    task: Mapped["TaskCard"] = relationship(back_populates="checkins")
```

### LifeEntry (生活记录)

```python
class LifeEntry(Base):
    __tablename__ = "life_entries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
```

### Notification (通知)

```python
class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    data: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
```

## API 路由

### 任务 API (`/api/tasks`)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 获取任务列表 |
| POST | `/` | 创建任务 |
| GET | `/{task_id}` | 获取单个任务 |
| PUT | `/{task_id}` | 更新任务 |
| DELETE | `/{task_id}` | 删除任务 |
| POST | `/{task_id}/checkin` | 习惯打卡 |
| GET | `/{task_id}/checkins` | 获取打卡记录 |

### 分类 API (`/api/lists`)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 获取分类列表 |
| POST | `/` | 创建分类 |
| GET | `/{list_id}` | 获取单个分类 |
| PUT | `/{list_id}` | 更新分类 |
| DELETE | `/{list_id}` | 删除分类 |

### 生活记录 API (`/api/life-entries`)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 获取记录列表 (分页) |
| POST | `/` | 创建记录 |
| GET | `/{entry_id}` | 获取单个记录 |
| PUT | `/{entry_id}` | 更新记录 |
| DELETE | `/{entry_id}` | 删除记录 |

### 统计 API (`/api/stats`)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/overview` | 获取统计概览 |
| GET | `/daily-ring` | 获取今日进度 |

### 通知 API (`/api/notifications`)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 获取通知列表 |
| GET | `/unread-count` | 获取未读数量 |
| PUT | `/{notification_id}/read` | 标记已读 |
| PUT | `/read-all` | 全部标记已读 |
| DELETE | `/{notification_id}` | 删除通知 |

### 设置 API (`/api/settings`)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 获取所有设置 |
| GET | `/{key}` | 获取单个设置 |
| PUT | `/{key}` | 更新设置 |

## 服务层

### 通知服务 (`app/services/notification_service.py`)

```python
class NotificationService:
    @staticmethod
    async def create_checkin_notification(
        db: AsyncSession,
        task: TaskCard,
        streak: int,
    ) -> Notification:
        """创建打卡通知"""
        
    @staticmethod
    async def create_streak_milestone_notification(
        db: AsyncSession,
        task: TaskCard,
        streak: int,
    ) -> Optional[Notification]:
        """创建连胜里程碑通知 (7, 30, 100 天)"""
```

## 启动脚本

### run_server.py

```bash
# 基本启动
python run_server.py

# 指定数据库路径
python run_server.py --db-path ./lifeflow.db

# 指定端口
python run_server.py --port 8000

# 开发模式 (热重载)
python run_server.py --reload
```

命令行参数：
- `--port, -p`: 端口号 (默认: 51731)
- `--host, -H`: 主机地址 (默认: 127.0.0.1)
- `--db-path, -d`: 数据库路径
- `--reload`: 启用热重载
- `--packaged`: 打包模式

### seed_data.py

```bash
# 生成测试数据到默认数据库
python seed_data.py

# 指定数据库路径
python seed_data.py --db-path ./lifeflow.db
```

## 测试

### 运行测试

```bash
cd src/backend

# 运行所有测试
pytest

# 运行特定测试文件
pytest tests/test_tasks.py

# 显示详细输出
pytest -v

# 显示覆盖率
pytest --cov=app
```

### 测试结构

```python
# tests/test_tasks.py
@pytest.mark.asyncio
async def test_create_task():
    """测试创建任务"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/api/tasks", json={
            "title": "测试任务",
            "is_habit": False,
        })
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "测试任务"
```

## 打包

### PyInstaller 配置 (`lifeflow.spec`)

```python
a = Analysis(
    ['run_server.py'],
    hiddenimports=[
        'fastapi',
        'uvicorn',
        'sqlalchemy',
        'aiosqlite',
        'pydantic',
        # ... 更多隐藏导入
    ],
    excludes=[
        'pytest',
        'hypothesis',
        'tkinter',
        # ... 排除的模块
    ],
)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    name='lifeflow-backend',
    console=True if sys.platform != 'win32' else False,
)
```

### 构建命令

```bash
cd src/backend
pyinstaller --clean --noconfirm lifeflow.spec
```

输出文件：`dist/lifeflow-backend` (macOS/Linux) 或 `dist/lifeflow-backend.exe` (Windows)
