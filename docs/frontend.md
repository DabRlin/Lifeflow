# 前端文档

## 概述

LifeFlow 前端采用 React + TypeScript 构建，通过 Electron 打包为桌面应用。使用 Vite 作为构建工具，TailwindCSS 进行样式开发。

## 技术栈

- **React 18**: UI 框架，使用函数组件和 Hooks
- **TypeScript 5.6**: 类型安全
- **Vite 6.0**: 快速构建工具
- **Electron 33**: 桌面应用框架
- **TailwindCSS 4.1**: 原子化 CSS 框架
- **React Query 5**: 服务端状态管理
- **Zustand 5**: 客户端状态管理
- **React Router 7**: 路由管理
- **ECharts 6**: 图表库
- **dnd-kit**: 拖拽排序

## 目录结构

```
src/frontend/
├── electron/           # Electron 主进程
├── public/             # 静态资源
├── src/                # React 应用源码
│   ├── api/            # API 客户端
│   ├── components/     # React 组件
│   ├── hooks/          # 自定义 Hooks
│   ├── lib/            # 工具函数
│   ├── pages/          # 页面组件
│   ├── router/         # 路由配置
│   ├── stores/         # 状态管理
│   ├── styles/         # 样式文件
│   └── types/          # 类型定义
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## Electron 主进程

### 文件说明

| 文件 | 说明 |
|------|------|
| `main.ts` | 主进程入口，窗口管理、IPC 通信 |
| `preload.ts` | 预加载脚本，暴露安全 API 给渲染进程 |
| `sidecar.ts` | 后端进程管理器 |
| `logger.ts` | 日志系统 |
| `diagnostics.ts` | 诊断工具 |

### 主进程 (`main.ts`)

```typescript
// 窗口配置
const mainWindow = new BrowserWindow({
  width: 1200,
  height: 800,
  minWidth: 800,
  minHeight: 600,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
  },
  titleBarStyle: 'hiddenInset',
});

// IPC 处理器
ipcMain.handle('get-backend-status', () => getSidecarManager().getStatus());
ipcMain.handle('restart-backend', () => getSidecarManager().restart());
ipcMain.handle('show-notification', (_, options) => { /* ... */ });
```

### Sidecar 管理器 (`sidecar.ts`)

后端进程生命周期管理：

```typescript
class SidecarManager {
  // 启动后端
  async start(): Promise<boolean>
  
  // 停止后端
  async stop(): Promise<void>
  
  // 重启后端
  async restart(): Promise<boolean>
  
  // 健康检查
  async healthCheck(): Promise<boolean>
  
  // 获取状态
  getStatus(): SidecarStatus
}
```

特性：
- 自动启动和关闭
- 健康监控（30秒间隔）
- 崩溃自动重启（最多3次）
- 优雅关闭（SIGTERM → 5秒超时 → SIGKILL）

### 预加载脚本 (`preload.ts`)

暴露给渲染进程的安全 API：

```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  // 后端状态
  getBackendStatus: () => ipcRenderer.invoke('get-backend-status'),
  restartBackend: () => ipcRenderer.invoke('restart-backend'),
  onBackendStatus: (callback) => { /* ... */ },
  
  // 通知
  showNotification: (options) => ipcRenderer.invoke('show-notification'),
  getNotificationPermission: () => ipcRenderer.invoke('get-notification-permission'),
  
  // 应用信息
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  
  // 日志
  getBackendLogs: (lines) => ipcRenderer.invoke('get-backend-logs', lines),
  getAppLogs: (lines) => ipcRenderer.invoke('get-app-logs', lines),
});
```

## React 应用

### 入口文件

**main.tsx**
```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/query-client'
import App from './App'
import './styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
```

**App.tsx**
```typescript
import { BrowserRouter } from 'react-router-dom'
import { AppRouter } from './router'
import { MainLayout } from './components/layout'

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <AppRouter />
      </MainLayout>
    </BrowserRouter>
  )
}
```

### 路由配置

```typescript
// router/index.tsx
export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/tasks" element={<TasksPage />} />
      <Route path="/habits" element={<HabitsPage />} />
      <Route path="/life" element={<LifePage />} />
      <Route path="/stats" element={<StatsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  )
}
```

## 页面组件

### HomePage (首页)

显示今日概览：
- 今日进度环形图
- 待完成习惯列表
- 快捷操作入口

### TasksPage (任务页面)

任务管理功能：
- 分类筛选（全部/任务/习惯）
- 任务创建表单
- 任务列表（支持拖拽排序）
- 分类管理（创建/编辑/删除）

### HabitsPage (习惯页面)

习惯追踪功能：
- 习惯卡片列表
- 打卡按钮
- 连胜统计
- 今日完成统计

### LifePage (生活页面)

生活记录功能：
- 快速输入框
- 时间线展示
- 无限滚动加载
- 编辑/删除记录

### StatsPage (统计页面)

数据统计功能：
- 今日进度环形图
- 统计卡片（任务数、打卡数、连胜等）
- 打卡趋势折线图
- 年度热力图日历

### SettingsPage (设置页面)

应用设置：
- 主题设置
- 通知设置
- 数据管理
- 关于信息

## 组件库

### UI 基础组件 (`components/ui/`)

| 组件 | 说明 |
|------|------|
| `Button` | 按钮组件，支持多种变体 |
| `Card` | 卡片容器 |
| `Input` | 输入框 |
| `Modal` | 模态框 |
| `Dialog` | 对话框 |
| `Sheet` | 侧边抽屉 |

**Button 变体**
```typescript
type ButtonVariant = 
  | 'default'      // 默认样式
  | 'destructive'  // 危险操作（紫色）
  | 'outline'      // 边框样式
  | 'secondary'    // 次要样式
  | 'ghost'        // 幽灵样式
  | 'link'         // 链接样式
```

### 布局组件 (`components/layout/`)

| 组件 | 说明 |
|------|------|
| `MainLayout` | 主布局，包含侧边栏和内容区 |
| `Sidebar` | 侧边导航栏 |
| `Header` | 顶部栏 |
| `NotificationPanel` | 通知面板 |

### 任务组件 (`components/task/`)

| 组件 | 说明 |
|------|------|
| `TaskCard` | 任务卡片，支持编辑和完成 |
| `TaskList` | 任务列表，支持拖拽排序 |
| `TaskCreateForm` | 任务创建表单 |
| `TaskEditor` | 任务编辑器 |

### 习惯组件 (`components/habit/`)

| 组件 | 说明 |
|------|------|
| `HabitCard` | 习惯卡片 |
| `CheckinButton` | 打卡按钮 |
| `StreakBadge` | 连胜徽章 |
| `DailyRing` | 每日进度环 |
| `HeatmapCalendar` | 热力图日历 |

### 生活组件 (`components/life/`)

| 组件 | 说明 |
|------|------|
| `EntryInput` | 记录输入框 |
| `LifeEntry` | 记录条目 |
| `Timeline` | 时间线 |
| `InfiniteTimeline` | 无限滚动时间线 |
| `DateSeparator` | 日期分隔符 |

### 分类组件 (`components/category/`)

| 组件 | 说明 |
|------|------|
| `CategoryFilter` | 分类筛选器 |
| `CategorySelector` | 分类选择下拉框 |
| `CategoryModal` | 分类创建/编辑弹窗 |
| `DeleteCategoryModal` | 分类删除确认弹窗 |

### 统计组件 (`components/stats/`)

| 组件 | 说明 |
|------|------|
| `StatCard` | 统计卡片 |
| `TrendChart` | 趋势图表 |

### 通用组件 (`components/common/`)

| 组件 | 说明 |
|------|------|
| `EmptyState` | 空状态提示 |
| `LoadingSkeleton` | 加载骨架屏 |
| `ErrorBoundary` | 错误边界 |
| `Toast` | 消息提示 |
| `SafeECharts` | 安全的 ECharts 包装 |

## 自定义 Hooks

### useTasks

任务数据管理：

```typescript
// 获取任务列表
const { data: tasks, isLoading } = useTasks({ list_id?: string })

// 创建任务
const createTask = useCreateTask()
await createTask.mutateAsync({ title, content, is_habit, list_id })

// 更新任务
const updateTask = useUpdateTask()
await updateTask.mutateAsync({ taskId, data: { title, content } })

// 删除任务
const deleteTask = useDeleteTask()
await deleteTask.mutateAsync({ taskId })

// 打卡
const checkinTask = useCheckinTask()
await checkinTask.mutateAsync({ taskId, data: { timezone_offset } })
```

### useLists

分类数据管理：

```typescript
// 获取分类列表
const { data: lists } = useLists()

// 创建分类
const createList = useCreateList()
await createList.mutateAsync({ name, description })

// 更新分类
const updateList = useUpdateList()
await updateList.mutateAsync({ listId, data: { name } })

// 删除分类
const deleteList = useDeleteList()
await deleteList.mutateAsync(listId)
```

### useLifeEntries

生活记录管理：

```typescript
// 无限滚动获取
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteLifeEntries(pageSize)

// 创建记录
const createEntry = useCreateLifeEntry()
await createEntry.mutateAsync({ content })

// 更新记录
const updateEntry = useUpdateLifeEntry()
await updateEntry.mutateAsync({ entryId, data: { content } })

// 删除记录
const deleteEntry = useDeleteLifeEntry()
await deleteEntry.mutateAsync({ entryId })
```

### useStats

统计数据：

```typescript
// 统计概览
const { data: overview } = useStatsOverview()

// 今日进度
const { data: dailyRing } = useDailyRing()
```

### useNotifications

通知管理：

```typescript
// 获取通知列表
const { data } = useNotifications({ limit: 50 })

// 未读数量
const { data: unreadCount } = useUnreadCount()

// 标记已读
const markAsRead = useMarkAsRead()
markAsRead.mutate(notificationId)

// 全部已读
const markAllAsRead = useMarkAllAsRead()
markAllAsRead.mutate()

// 删除通知
const deleteNotification = useDeleteNotification()
deleteNotification.mutate(notificationId)
```

### useElectron

Electron API 访问：

```typescript
const {
  isElectron,           // 是否在 Electron 环境
  backendStatus,        // 后端状态
  restartBackend,       // 重启后端
  showNotification,     // 显示系统通知
  getAppInfo,           // 获取应用信息
} = useElectron()
```

## API 客户端

### HTTP 客户端 (`api/client.ts`)

```typescript
const API_BASE_URL = 'http://127.0.0.1:51731/api'

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`)
  }

  return response.json()
}
```

### API 模块

| 模块 | 说明 |
|------|------|
| `tasks.ts` | 任务 API |
| `lists.ts` | 分类 API |
| `life-entries.ts` | 生活记录 API |
| `stats.ts` | 统计 API |
| `notifications.ts` | 通知 API |
| `settings.ts` | 设置 API |

## 状态管理

### Zustand Stores

**UI Store**
```typescript
interface UIState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  
  activeModal: string | null
  openModal: (modal: string) => void
  closeModal: () => void
}
```

**Settings Store**
```typescript
interface SettingsState {
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: string) => void
  
  notificationsEnabled: boolean
  setNotificationsEnabled: (enabled: boolean) => void
}
```

### React Query 配置

```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,      // 1 分钟
      gcTime: 1000 * 60 * 5,     // 5 分钟
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
```

## 工具函数

### 日期工具 (`lib/utils.ts`)

```typescript
// 获取本地日期字符串 (YYYY-MM-DD)
export function getLocalDateString(): string

// 格式化日期
export function formatDate(date: Date | string): string

// 相对时间
export function getRelativeTime(date: Date | string): string
```

### 连胜计算 (`lib/streak.ts`)

```typescript
// 计算连胜天数
export function calculateStreak(checkins: CheckinRecord[]): number

// 计算最长连胜
export function calculateLongestStreak(checkins: CheckinRecord[]): number
```

### 热力图数据 (`lib/heatmap.ts`)

```typescript
// 聚合打卡数据
export function aggregateCheckinsByDate(
  checkins: CheckinRecord[]
): HeatmapData[]
```

### 统计计算 (`lib/stats.ts`)

```typescript
// 计算趋势数据
export function calculateTrendData(
  checkins: CheckinRecord[],
  days: number,
  today: string
): TrendData[]
```

## 样式系统

### TailwindCSS 配置

```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F3E5F5',
          100: '#E1BEE7',
          // ... 紫色主题色阶
          500: '#6750A4',
          600: '#5E35B1',
        },
        secondary: { /* ... */ },
        neutral: { /* ... */ },
        success: { /* ... */ },
        warning: { /* ... */ },
        error: { /* ... */ },
      },
      borderRadius: {
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        'elevation-1': '0 1px 2px rgba(0,0,0,0.1)',
        'elevation-2': '0 2px 4px rgba(0,0,0,0.1)',
        'elevation-3': '0 4px 8px rgba(0,0,0,0.1)',
      },
    },
  },
}
```

### 全局样式 (`styles/globals.css`)

```css
@import 'tailwindcss';

/* 自定义动画 */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scale-in {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-thumb {
  background: #d4d4d4;
  border-radius: 3px;
}
```

## 测试

### 运行测试

```bash
cd src/frontend

# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 单次运行
npx vitest run
```

### 测试示例

```typescript
// lib/streak.test.ts
import { describe, it, expect } from 'vitest'
import { fc } from 'fast-check'
import { calculateStreak } from './streak'

describe('calculateStreak', () => {
  it('should return 0 for empty checkins', () => {
    expect(calculateStreak([])).toBe(0)
  })

  // 属性测试
  it('should always return non-negative number', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ checkin_date: fc.date() })),
        (checkins) => {
          const streak = calculateStreak(checkins)
          return streak >= 0
        }
      )
    )
  })
})
```

## 构建

### 开发模式

```bash
# 启动 Vite 开发服务器
npm run dev

# 启动 Electron 开发模式
npm run dev:electron
```

### 生产构建

```bash
# 构建 React 应用
npm run build

# 构建 Electron 应用
npm run build:electron
```

### 输出文件

- macOS: `release/LifeFlow-x.x.x-arm64.dmg`, `release/LifeFlow-x.x.x-x64.dmg`
- Windows: `release/LifeFlow-Setup-x.x.x.exe`
