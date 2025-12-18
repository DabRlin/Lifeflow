# Design Document: Notification System

## Overview

LifeFlow 通知系统提供持久化的应用内通知功能，包括习惯提醒、成就通知和系统消息。系统采用 SQLite 存储通知数据，支持已读/未读状态管理，并与现有的 M3 紫色主题设计风格保持一致。

本设计继承 LifeFlow V2 的技术栈和设计规范：
- **前端**: React 18 + TypeScript + TanStack Query + Tailwind CSS
- **后端**: FastAPI + SQLAlchemy + SQLite
- **测试**: Vitest + fast-check (前端) / pytest + hypothesis (后端)
- **环境隔离**: 所有依赖限制在项目目录内

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
├─────────────────────────────────────────────────────────────┤
│  NotificationPanel  │  NotificationBadge  │  useNotifications│
│  (UI Component)     │  (Badge Counter)    │  (React Query)   │
└─────────────────────┬───────────────────────────────────────┘
                      │ REST API (port 51731)
┌─────────────────────┴───────────────────────────────────────┐
│                      Backend (FastAPI)                       │
├─────────────────────────────────────────────────────────────┤
│  NotificationRouter │ NotificationService │ AchievementService│
│  (API Endpoints)    │ (Business Logic)    │ (Milestone Check) │
└─────────────────────┬───────────────────────────────────────┘
                      │ SQLAlchemy (async)
┌─────────────────────┴───────────────────────────────────────┐
│                      Database (SQLite)                       │
├─────────────────────────────────────────────────────────────┤
│                    notifications table                       │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Backend Components

#### 1. Notification Model (SQLAlchemy)

```python
class Notification(Base):
    __tablename__ = "notifications"
    
    id: str  # UUID
    type: str  # habit_reminder, achievement, daily_complete, system
    title: str
    message: str
    data: dict  # JSON field for additional data (habit_id, streak, etc.)
    is_read: bool
    created_at: datetime
    user_id: str  # For future multi-user support, default "default"
```

#### 2. Notification API Endpoints

```
GET    /api/notifications          # List notifications (with filters)
GET    /api/notifications/unread   # Get unread count
POST   /api/notifications          # Create notification (internal use)
PATCH  /api/notifications/{id}/read  # Mark as read
POST   /api/notifications/read-all   # Mark all as read
DELETE /api/notifications/{id}     # Delete notification
```

#### 3. Notification Service

- `generate_habit_reminders()` - 生成今日习惯提醒
- `check_achievements(habit_id)` - 检查并生成成就通知
- `check_daily_complete()` - 检查是否完成所有习惯

### Frontend Components

#### 1. NotificationPanel Component

- 显示通知列表
- 支持按类型筛选
- 标记已读功能
- M3 紫色主题样式

#### 2. useNotifications Hook

```typescript
interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
}
```

## Data Models

### Notification Entity

```typescript
interface Notification {
  id: string
  type: 'habit_reminder' | 'achievement' | 'daily_complete' | 'system'
  title: string
  message: string
  data: {
    habit_id?: string
    habit_title?: string
    streak?: number
    milestone?: number
  }
  is_read: boolean
  created_at: string
}
```

### Notification Types

| Type | Description | Trigger |
|------|-------------|---------|
| `habit_reminder` | 习惯提醒 | 每日首次打开应用时生成 |
| `achievement` | 成就通知 | 达成里程碑时生成 |
| `daily_complete` | 每日完成 | 完成所有习惯时生成 |
| `system` | 系统消息 | 手动或系统事件触发 |

### Achievement Milestones

- 7 天连续打卡
- 14 天连续打卡
- 30 天连续打卡
- 60 天连续打卡
- 100 天连续打卡

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: At-risk notification generation
*For any* habit with `current_streak > 0` and `last_checkin_date !== today`, the system should generate an at-risk notification for that habit.
**Validates: Requirements 1.2**

### Property 2: Achievement notification generation
*For any* habit that reaches a milestone streak value (7, 14, 30, 60, 100), the system should generate exactly one achievement notification for that milestone.
**Validates: Requirements 2.1**

### Property 3: Daily complete notification
*For any* day where all active habits have `last_checkin_date === today`, the system should generate a daily complete notification.
**Validates: Requirements 2.2**

### Property 4: Mark as read state change
*For any* notification, after marking it as read, querying that notification should return `is_read === true`.
**Validates: Requirements 3.1, 3.2**

### Property 5: Unread count accuracy
*For any* set of notifications, the unread count should equal the number of notifications where `is_read === false`.
**Validates: Requirements 3.3**

### Property 6: Notification persistence round-trip
*For any* valid notification, creating it and then querying by ID should return an equivalent notification with a valid timestamp.
**Validates: Requirements 4.1**

### Property 7: Notification ordering
*For any* list of notifications returned by the API, they should be sorted by `created_at` in descending order (newest first).
**Validates: Requirements 4.3**

## Error Handling

| Error | HTTP Status | Response |
|-------|-------------|----------|
| Notification not found | 404 | `{"detail": "Notification not found"}` |
| Invalid notification type | 400 | `{"detail": "Invalid notification type"}` |
| Database error | 500 | `{"detail": "Internal server error"}` |

## Design System

继承 LifeFlow V2 的 M3 紫色主题设计：

### 颜色方案

```typescript
// 通知类型对应的颜色
const notificationColors = {
  habit_reminder: {
    bg: 'bg-primary-50',      // 淡紫色背景
    text: 'text-primary-700', // 深紫色文字
    icon: 'text-primary-500', // 紫色图标
  },
  achievement: {
    bg: 'bg-secondary-50',    // 淡金色背景
    text: 'text-secondary-700',
    icon: 'text-secondary-500',
  },
  daily_complete: {
    bg: 'bg-primary-100',
    text: 'text-primary-700',
    icon: 'text-primary-600',
  },
  at_risk: {
    bg: 'bg-amber-50',        // 警告色
    text: 'text-amber-700',
    icon: 'text-amber-500',
  },
}
```

### 组件样式

- 通知面板使用 `shadow-elevation-3` 阴影
- 圆角使用 `rounded-xl` (16px)
- 动画使用 `animate-fade-in` 淡入效果
- 徽章使用 `bg-primary-500` 紫色背景

## Testing Strategy

### Property-Based Testing

使用 `hypothesis` (Python) 和 `fast-check` (TypeScript) 进行属性测试：

1. **后端属性测试**
   - 通知生成逻辑测试
   - 已读状态变更测试
   - 排序正确性测试

2. **前端属性测试**
   - 未读计数准确性测试
   - 通知显示内容完整性测试

### Unit Tests

1. **API 端点测试**
   - 创建通知
   - 获取通知列表
   - 标记已读
   - 删除通知

2. **服务层测试**
   - 习惯提醒生成
   - 成就检测
   - 每日完成检测

### Integration Tests

- 完整的通知生命周期测试
- 与习惯系统的集成测试
