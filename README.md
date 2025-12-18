# LifeFlow

一款简约高效的个人效率应用，帮助你管理任务、追踪习惯、记录生活。

## 功能特性

- 📋 **任务管理** - 创建和管理日常任务
- 🔥 **习惯追踪** - 建立并保持良好习惯，支持连续打卡统计
- 📝 **生活记录** - 随时记录生活点滴
- 📊 **数据统计** - 可视化展示你的进度和成就
- 🔔 **智能通知** - 习惯提醒、成就通知、风险预警
- 🎨 **M3 设计** - 采用 Material Design 3 紫色主题

## 技术栈

### 前端
- React 18 + TypeScript
- TanStack Query (数据管理)
- Tailwind CSS (样式)
- Electron (桌面应用)

### 后端
- FastAPI (Python)
- SQLAlchemy (ORM)
- SQLite (数据库)

## 开发环境

### 前置要求
- Node.js 18+
- Python 3.11+
- pnpm 或 npm

### 安装依赖

```bash
# 前端依赖
cd src/frontend
npm install

# 后端依赖
cd ../..
python -m venv .venv
source .venv/bin/activate  # macOS/Linux
pip install -r src/backend/requirements.txt
```

### 启动开发服务器

```bash
# 启动后端 (端口 51731)
source .venv/bin/activate
python src/backend/run_server.py

# 启动前端 (端口 5173)
cd src/frontend
npm run dev
```

### 构建应用

```bash
# 构建后端
cd src/backend
python build_backend.py

# 构建前端 + Electron
cd ../frontend
npm run build:electron
```

## 项目结构

```
├── src/
│   ├── backend/          # FastAPI 后端
│   │   ├── app/
│   │   │   ├── api/      # API 路由
│   │   │   ├── models/   # 数据模型
│   │   │   ├── schemas/  # Pydantic 模式
│   │   │   └── services/ # 业务逻辑
│   │   └── tests/        # 后端测试
│   └── frontend/         # React + Electron 前端
│       ├── src/
│       │   ├── api/      # API 客户端
│       │   ├── components/
│       │   ├── hooks/    # React Query hooks
│       │   └── pages/
│       └── electron/     # Electron 主进程
└── .kiro/                # Kiro 规格文档
```

## 许可证

MIT License
