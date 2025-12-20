# 架构设计

## 系统架构

LifeFlow 采用前后端分离的桌面应用架构，通过 Electron 将 Web 应用打包为原生桌面应用。

```
┌─────────────────────────────────────────────────────────────┐
│                      Electron Shell                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    Main Process                          ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ ││
│  │  │   Sidecar   │  │   Logger    │  │   Diagnostics   │ ││
│  │  │   Manager   │  │             │  │                 │ ││
│  │  └──────┬──────┘  └─────────────┘  └─────────────────┘ ││
│  │         │                                               ││
│  │         │ spawn/kill                                    ││
│  │         ▼                                               ││
│  │  ┌─────────────────────────────────────────────────┐   ││
│  │  │              Backend Process                     │   ││
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │   ││
│  │  │  │ FastAPI │  │ Uvicorn │  │     SQLite      │ │   ││
│  │  │  │   App   │  │ Server  │  │    Database     │ │   ││
│  │  │  └─────────┘  └─────────┘  └─────────────────┘ │   ││
│  │  └─────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────┘│
│                              │                               │
│                              │ IPC                           │
│                              ▼                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                   Renderer Process                       ││
│  │  ┌─────────────────────────────────────────────────┐   ││
│  │  │                  React App                       │   ││
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │   ││
│  │  │  │  Pages  │  │Components│  │     Hooks       │ │   ││
│  │  │  └─────────┘  └─────────┘  └─────────────────┘ │   ││
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │   ││
│  │  │  │  Stores │  │   API   │  │   React Query   │ │   ││
│  │  │  └─────────┘  └─────────┘  └─────────────────┘ │   ││
│  │  └─────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## 数据流

```
用户操作 → React Component → Hook → API Client → HTTP Request
                                                      │
                                                      ▼
                                              FastAPI Endpoint
                                                      │
                                                      ▼
                                              SQLAlchemy ORM
                                                      │
                                                      ▼
                                              SQLite Database
                                                      │
                                                      ▼
                                              HTTP Response
                                                      │
                                                      ▼
                                              React Query Cache
                                                      │
                                                      ▼
                                              UI Update
```

## 目录结构

### 根目录

```
LifeFlow/
├── .github/                    # GitHub 配置
│   └── workflows/
│       └── release.yml         # CI/CD 构建发布流程
├── .kiro/                      # Kiro 规范文档
│   ├── specs/                  # 功能规范
│   │   ├── category-list-management/
│   │   ├── lifeflow/
│   │   ├── lifeflow-v2/
│   │   └── notification-system/
│   └── steering/               # 引导规则
│       └── language.md
├── docs/                       # 项目文档
│   ├── README.md               # 文档索引
│   ├── overview.md             # 项目概述
│   ├── architecture.md         # 架构设计
│   ├── backend.md              # 后端文档
│   ├── frontend.md             # 前端文档
│   ├── api-reference.md        # API 参考
│   ├── development.md          # 开发指南
│   ├── deployment.md           # 部署指南
│   └── ROADMAP.md              # 开发路线图
├── src/                        # 源代码
│   ├── backend/                # 后端代码
│   └── frontend/               # 前端代码
├── .gitignore                  # Git 忽略配置
├── LICENSE                     # MIT 许可证
└── README.md                   # 项目说明
```

### 后端目录 (`src/backend/`)

```
src/backend/
├── app/                        # 应用代码
│   ├── api/                    # API 路由
│   │   ├── __init__.py
│   │   ├── life_entries.py     # 生活记录 API
│   │   ├── lists.py            # 分类列表 API
│   │   ├── notifications.py    # 通知 API
│   │   ├── settings.py         # 设置 API
│   │   ├── stats.py            # 统计 API
│   │   └── tasks.py            # 任务 API
│   ├── models/                 # 数据模型
│   │   ├── __init__.py
│   │   ├── card_list.py        # 分类列表模型
│   │   ├── checkin_record.py   # 打卡记录模型
│   │   ├── life_entry.py       # 生活记录模型
│   │   ├── notification.py     # 通知模型
│   │   ├── setting.py          # 设置模型
│   │   └── task_card.py        # 任务卡片模型
│   ├── schemas/                # Pydantic 模式
│   │   ├── __init__.py
│   │   ├── card_list.py        # 分类列表模式
│   │   ├── checkin_record.py   # 打卡记录模式
│   │   ├── life_entry.py       # 生活记录模式
│   │   ├── notification.py     # 通知模式
│   │   ├── setting.py          # 设置模式
│   │   ├── stats.py            # 统计模式
│   │   └── task_card.py        # 任务卡片模式
│   ├── services/               # 业务服务
│   │   ├── __init__.py
│   │   └── notification_service.py  # 通知服务
│   ├── __init__.py
│   ├── config.py               # 配置管理
│   ├── database.py             # 数据库连接
│   └── main.py                 # FastAPI 应用入口
├── tests/                      # 测试代码
│   ├── test_life_entries.py
│   ├── test_lists.py
│   ├── test_notifications.py
│   ├── test_settings.py
│   ├── test_stats.py
│   └── test_tasks.py
├── build_backend.py            # 后端构建脚本
├── lifeflow.spec               # PyInstaller 配置
├── pyproject.toml              # Python 项目配置
├── requirements.txt            # Python 依赖
├── run_server.py               # 服务器启动脚本
└── seed_data.py                # 测试数据生成
```

### 前端目录 (`src/frontend/`)

```
src/frontend/
├── electron/                   # Electron 主进程
│   ├── diagnostics.ts          # 诊断工具
│   ├── logger.ts               # 日志系统
│   ├── main.ts                 # 主进程入口
│   ├── preload.ts              # 预加载脚本
│   ├── sidecar.ts              # 后端进程管理
│   ├── tsconfig.json           # TypeScript 配置
│   ├── DIAGNOSTICS.md          # 诊断文档
│   └── README.md               # Electron 说明
├── public/                     # 静态资源
│   ├── icon.svg                # 应用图标
│   └── vite.svg                # Vite 图标
├── src/                        # React 应用
│   ├── api/                    # API 客户端
│   │   ├── client.ts           # HTTP 客户端
│   │   ├── client.test.ts      # 客户端测试
│   │   ├── index.ts            # 导出入口
│   │   ├── life-entries.ts     # 生活记录 API
│   │   ├── lists.ts            # 分类列表 API
│   │   ├── lists.test.ts       # 列表 API 测试
│   │   ├── notifications.ts    # 通知 API
│   │   ├── settings.ts         # 设置 API
│   │   ├── stats.ts            # 统计 API
│   │   ├── tasks.ts            # 任务 API
│   │   └── types.ts            # 类型定义
│   ├── components/             # React 组件
│   │   ├── category/           # 分类组件
│   │   │   ├── CategoryFilter.tsx
│   │   │   ├── CategoryFilter.test.ts
│   │   │   ├── CategoryModal.tsx
│   │   │   ├── CategoryModal.test.ts
│   │   │   ├── CategorySelector.tsx
│   │   │   ├── CategorySelector.test.ts
│   │   │   ├── DeleteCategoryModal.tsx
│   │   │   ├── DeleteCategoryModal.test.ts
│   │   │   └── index.ts
│   │   ├── common/             # 通用组件
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── index.ts
│   │   │   ├── LoadingSkeleton.tsx
│   │   │   ├── SafeECharts.tsx
│   │   │   └── Toast.tsx
│   │   ├── habit/              # 习惯组件
│   │   │   ├── CheckinButton.tsx
│   │   │   ├── DailyRing.tsx
│   │   │   ├── HabitCard.tsx
│   │   │   ├── HeatmapCalendar.tsx
│   │   │   ├── index.ts
│   │   │   └── StreakBadge.tsx
│   │   ├── layout/             # 布局组件
│   │   │   ├── Header.tsx
│   │   │   ├── index.ts
│   │   │   ├── MainLayout.tsx
│   │   │   ├── NotificationPanel.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── life/               # 生活记录组件
│   │   │   ├── DateSeparator.tsx
│   │   │   ├── EntryInput.tsx
│   │   │   ├── index.ts
│   │   │   ├── InfiniteTimeline.tsx
│   │   │   ├── LifeEntry.tsx
│   │   │   └── Timeline.tsx
│   │   ├── stats/              # 统计组件
│   │   │   ├── index.ts
│   │   │   ├── StatCard.tsx
│   │   │   └── TrendChart.tsx
│   │   ├── task/               # 任务组件
│   │   │   ├── index.ts
│   │   │   ├── TaskCard.tsx
│   │   │   ├── TaskCreateForm.tsx
│   │   │   ├── TaskCrud.test.ts
│   │   │   ├── TaskEditor.tsx
│   │   │   ├── TaskList.tsx
│   │   │   └── TaskList.test.ts
│   │   └── ui/                 # UI 基础组件
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── index.ts
│   │       ├── input.tsx
│   │       ├── modal.tsx
│   │       └── sheet.tsx
│   ├── hooks/                  # React Hooks
│   │   ├── index.ts
│   │   ├── useElectron.ts      # Electron API Hook
│   │   ├── useLifeEntries.ts   # 生活记录 Hook
│   │   ├── useLists.ts         # 分类列表 Hook
│   │   ├── useNotifications.ts # 通知 Hook
│   │   ├── useStats.ts         # 统计 Hook
│   │   └── useTasks.ts         # 任务 Hook
│   ├── lib/                    # 工具库
│   │   ├── charts.ts           # 图表配置
│   │   ├── daily-progress.ts   # 每日进度计算
│   │   ├── daily-progress.test.ts
│   │   ├── date-grouping.test.ts
│   │   ├── echarts.ts          # ECharts 配置
│   │   ├── entry-edit.ts       # 记录编辑
│   │   ├── entry-edit.test.ts
│   │   ├── heatmap.ts          # 热力图数据
│   │   ├── heatmap.test.ts
│   │   ├── notifications.ts    # 通知工具
│   │   ├── pagination.ts       # 分页工具
│   │   ├── pagination.test.ts
│   │   ├── query-client.ts     # React Query 配置
│   │   ├── relative-time.ts    # 相对时间
│   │   ├── relative-time.test.ts
│   │   ├── settings.ts         # 设置工具
│   │   ├── settings.test.ts
│   │   ├── stats.ts            # 统计计算
│   │   ├── stats.test.ts
│   │   ├── streak.ts           # 连胜计算
│   │   ├── streak.test.ts
│   │   └── utils.ts            # 通用工具
│   ├── pages/                  # 页面组件
│   │   ├── HabitsPage.tsx      # 习惯页面
│   │   ├── HomePage.tsx        # 首页
│   │   ├── index.ts
│   │   ├── LifePage.tsx        # 生活页面
│   │   ├── SettingsPage.tsx    # 设置页面
│   │   ├── StatsPage.tsx       # 统计页面
│   │   └── TasksPage.tsx       # 任务页面
│   ├── router/                 # 路由配置
│   │   └── index.tsx
│   ├── stores/                 # 状态管理
│   │   ├── index.ts
│   │   ├── settings-store.ts   # 设置状态
│   │   └── ui-store.ts         # UI 状态
│   ├── styles/                 # 样式文件
│   │   └── globals.css         # 全局样式
│   ├── types/                  # 类型定义
│   │   └── electron.d.ts       # Electron 类型
│   ├── App.tsx                 # 应用根组件
│   ├── main.tsx                # 应用入口
│   └── vite-env.d.ts           # Vite 类型
├── .gitignore
├── .prettierrc                 # Prettier 配置
├── components.json             # shadcn/ui 配置
├── eslint.config.js            # ESLint 配置
├── index.html                  # HTML 入口
├── package.json                # npm 配置
├── package-lock.json
├── postcss.config.js           # PostCSS 配置
├── tailwind.config.js          # Tailwind 配置
├── tsconfig.json               # TypeScript 配置
├── tsconfig.node.json          # Node TypeScript 配置
└── vite.config.ts              # Vite 配置
```

## 模块依赖关系

### 前端模块依赖

```
pages/
  └── components/
        ├── ui/          (基础 UI 组件)
        ├── common/      (通用组件)
        ├── layout/      (布局组件)
        ├── task/        (任务组件)
        ├── habit/       (习惯组件)
        ├── life/        (生活组件)
        ├── stats/       (统计组件)
        └── category/    (分类组件)
              └── hooks/
                    └── api/
                          └── lib/
```

### 后端模块依赖

```
api/
  └── schemas/
        └── models/
              └── database/
                    └── config/
```

## 数据库设计

### ER 图

```
┌─────────────────┐     ┌─────────────────┐
│    CardList     │     │    TaskCard     │
├─────────────────┤     ├─────────────────┤
│ id (PK)         │◄────│ list_id (FK)    │
│ name            │     │ id (PK)         │
│ description     │     │ title           │
│ color           │     │ content         │
│ icon            │     │ is_habit        │
│ position        │     │ is_deleted      │
│ created_at      │     │ current_streak  │
│ updated_at      │     │ longest_streak  │
└─────────────────┘     │ last_checkin    │
                        │ reminder_time   │
                        │ position        │
                        │ created_at      │
                        │ updated_at      │
                        └────────┬────────┘
                                 │
                                 │ 1:N
                                 ▼
                        ┌─────────────────┐
                        │  CheckinRecord  │
                        ├─────────────────┤
                        │ id (PK)         │
                        │ task_id (FK)    │
                        │ checkin_date    │
                        │ created_at      │
                        └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│   LifeEntry     │     │  Notification   │
├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │
│ content         │     │ type            │
│ is_deleted      │     │ title           │
│ created_at      │     │ message         │
│ updated_at      │     │ data (JSON)     │
└─────────────────┘     │ is_read         │
                        │ created_at      │
┌─────────────────┐     └─────────────────┘
│    Setting      │
├─────────────────┤
│ id (PK)         │
│ key             │
│ value           │
│ updated_at      │
└─────────────────┘
```

### 表说明

| 表名 | 说明 |
|------|------|
| CardList | 分类列表，用于组织任务和习惯 |
| TaskCard | 任务卡片，包含普通任务和习惯 |
| CheckinRecord | 打卡记录，记录习惯的每次打卡 |
| LifeEntry | 生活记录，用户的日常记录 |
| Notification | 通知消息，系统推送的通知 |
| Setting | 设置项，用户偏好设置 |
