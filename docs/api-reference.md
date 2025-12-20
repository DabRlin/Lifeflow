# API 参考

## 概述

LifeFlow 后端提供 RESTful API，基础 URL 为 `http://127.0.0.1:51731/api`。

所有请求和响应均使用 JSON 格式。

## 通用响应格式

### 成功响应

```json
{
  "id": "uuid",
  "field1": "value1",
  "field2": "value2",
  "created_at": "2024-12-20T10:00:00",
  "updated_at": "2024-12-20T10:00:00"
}
```

### 错误响应

```json
{
  "detail": "错误描述信息"
}
```

### HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 422 | 数据验证失败 |
| 500 | 服务器内部错误 |

---

## 任务 API

### 获取任务列表

```http
GET /api/tasks
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| list_id | string | 否 | 按分类筛选 |
| is_habit | boolean | 否 | 筛选习惯/任务 |
| include_deleted | boolean | 否 | 包含已删除 |

**响应示例**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "每日阅读",
    "content": "阅读30分钟",
    "list_id": "550e8400-e29b-41d4-a716-446655440001",
    "is_habit": true,
    "is_deleted": false,
    "current_streak": 7,
    "longest_streak": 15,
    "last_checkin_date": "2024-12-20",
    "reminder_time": "21:00",
    "position": 0,
    "created_at": "2024-12-01T10:00:00",
    "updated_at": "2024-12-20T21:00:00"
  }
]
```

### 创建任务

```http
POST /api/tasks
```

**请求体**

```json
{
  "title": "任务标题",
  "content": "任务描述（可选）",
  "list_id": "分类ID（可选）",
  "is_habit": false,
  "reminder_time": "09:00"
}
```

**响应**: 返回创建的任务对象

### 获取单个任务

```http
GET /api/tasks/{task_id}
```

**响应**: 返回任务对象

### 更新任务

```http
PUT /api/tasks/{task_id}
```

**请求体**

```json
{
  "title": "新标题",
  "content": "新描述",
  "list_id": "新分类ID",
  "reminder_time": "10:00"
}
```

**响应**: 返回更新后的任务对象

### 删除任务

```http
DELETE /api/tasks/{task_id}
```

**响应**: 返回被删除的任务对象（软删除）

### 习惯打卡

```http
POST /api/tasks/{task_id}/checkin
```

**请求体**

```json
{
  "timezone_offset": -480
}
```

> `timezone_offset` 为客户端时区偏移（分钟），用于计算本地日期

**响应**

```json
{
  "task": { /* 更新后的任务对象 */ },
  "checkin": {
    "id": "uuid",
    "task_id": "task_uuid",
    "checkin_date": "2024-12-20",
    "created_at": "2024-12-20T21:00:00"
  },
  "notification": { /* 通知对象（如有）*/ }
}
```

### 获取打卡记录

```http
GET /api/tasks/{task_id}/checkins
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| limit | integer | 否 | 返回数量限制，默认 365 |

**响应**

```json
[
  {
    "id": "uuid",
    "task_id": "task_uuid",
    "checkin_date": "2024-12-20",
    "created_at": "2024-12-20T21:00:00"
  }
]
```

---

## 分类 API

### 获取分类列表

```http
GET /api/lists
```

**响应**

```json
[
  {
    "id": "uuid",
    "name": "工作",
    "description": "工作相关任务",
    "color": "#6750A4",
    "icon": "briefcase",
    "position": 0,
    "created_at": "2024-12-01T10:00:00",
    "updated_at": "2024-12-01T10:00:00"
  }
]
```

### 创建分类

```http
POST /api/lists
```

**请求体**

```json
{
  "name": "分类名称",
  "description": "分类描述（可选）",
  "color": "#6750A4",
  "icon": "folder"
}
```

**响应**: 返回创建的分类对象

### 获取单个分类

```http
GET /api/lists/{list_id}
```

**响应**: 返回分类对象

### 更新分类

```http
PUT /api/lists/{list_id}
```

**请求体**

```json
{
  "name": "新名称",
  "description": "新描述",
  "color": "#5E35B1"
}
```

**响应**: 返回更新后的分类对象

### 删除分类

```http
DELETE /api/lists/{list_id}
```

**响应**: 返回被删除的分类对象

> 删除分类时，该分类下的任务会被移至"未分类"

---

## 生活记录 API

### 获取记录列表

```http
GET /api/life-entries
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| skip | integer | 否 | 跳过数量，默认 0 |
| limit | integer | 否 | 返回数量，默认 20 |

**响应**

```json
{
  "items": [
    {
      "id": "uuid",
      "content": "今天天气很好",
      "is_deleted": false,
      "created_at": "2024-12-20T10:00:00",
      "updated_at": "2024-12-20T10:00:00"
    }
  ],
  "total": 100,
  "skip": 0,
  "limit": 20
}
```

### 创建记录

```http
POST /api/life-entries
```

**请求体**

```json
{
  "content": "记录内容"
}
```

**响应**: 返回创建的记录对象

### 获取单个记录

```http
GET /api/life-entries/{entry_id}
```

**响应**: 返回记录对象

### 更新记录

```http
PUT /api/life-entries/{entry_id}
```

**请求体**

```json
{
  "content": "更新后的内容"
}
```

**响应**: 返回更新后的记录对象

### 删除记录

```http
DELETE /api/life-entries/{entry_id}
```

**响应**: 返回被删除的记录对象（软删除）

---

## 统计 API

### 获取统计概览

```http
GET /api/stats/overview
```

**响应**

```json
{
  "total_tasks": 25,
  "total_habits": 10,
  "today_checkins": 5,
  "pending_tasks": 8,
  "completion_rate": 50,
  "longest_streak": 30,
  "total_checkins": 150
}
```

### 获取今日进度

```http
GET /api/stats/daily-ring
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| timezone_offset | integer | 否 | 时区偏移（分钟） |

**响应**

```json
{
  "completed_habits": 5,
  "total_habits": 10,
  "completion_rate": 50
}
```

---

## 通知 API

### 获取通知列表

```http
GET /api/notifications
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| limit | integer | 否 | 返回数量，默认 50 |
| unread_only | boolean | 否 | 仅返回未读 |

**响应**

```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "habit_reminder",
      "title": "打卡提醒",
      "message": "别忘了完成今天的阅读习惯",
      "data": {
        "task_id": "task_uuid",
        "streak": 7
      },
      "is_read": false,
      "created_at": "2024-12-20T21:00:00"
    }
  ],
  "unread_count": 3
}
```

**通知类型**

| 类型 | 说明 |
|------|------|
| `habit_reminder` | 习惯打卡提醒 |
| `achievement` | 成就达成 |
| `daily_complete` | 每日完成 |
| `system` | 系统通知 |

### 获取未读数量

```http
GET /api/notifications/unread-count
```

**响应**

```json
{
  "count": 3
}
```

### 标记已读

```http
PUT /api/notifications/{notification_id}/read
```

**响应**: 返回更新后的通知对象

### 全部标记已读

```http
PUT /api/notifications/read-all
```

**响应**

```json
{
  "updated_count": 5
}
```

### 删除通知

```http
DELETE /api/notifications/{notification_id}
```

**响应**: 返回被删除的通知对象

---

## 设置 API

### 获取所有设置

```http
GET /api/settings
```

**响应**

```json
{
  "theme": "light",
  "notifications_enabled": true,
  "reminder_sound": true
}
```

### 获取单个设置

```http
GET /api/settings/{key}
```

**响应**

```json
{
  "key": "theme",
  "value": "light"
}
```

### 更新设置

```http
PUT /api/settings/{key}
```

**请求体**

```json
{
  "value": "dark"
}
```

**响应**: 返回更新后的设置对象

---

## 健康检查

### 健康状态

```http
GET /api/health
```

**响应**

```json
{
  "status": "healthy",
  "version": "2.0.0",
  "database": "connected"
}
```

---

## 数据类型

### Task (任务)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string (UUID) | 任务 ID |
| title | string | 标题 |
| content | string? | 描述 |
| list_id | string? | 分类 ID |
| is_habit | boolean | 是否为习惯 |
| is_deleted | boolean | 是否已删除 |
| current_streak | integer | 当前连胜 |
| longest_streak | integer | 最长连胜 |
| last_checkin_date | string? | 最后打卡日期 (YYYY-MM-DD) |
| reminder_time | string? | 提醒时间 (HH:MM) |
| position | integer | 排序位置 |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |

### CardList (分类)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string (UUID) | 分类 ID |
| name | string | 名称 |
| description | string? | 描述 |
| color | string? | 颜色 (#RRGGBB) |
| icon | string? | 图标名称 |
| position | integer | 排序位置 |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |

### LifeEntry (生活记录)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string (UUID) | 记录 ID |
| content | string | 内容 |
| is_deleted | boolean | 是否已删除 |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |

### CheckinRecord (打卡记录)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string (UUID) | 记录 ID |
| task_id | string (UUID) | 任务 ID |
| checkin_date | string | 打卡日期 (YYYY-MM-DD) |
| created_at | datetime | 创建时间 |

### Notification (通知)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string (UUID) | 通知 ID |
| type | string | 通知类型 |
| title | string | 标题 |
| message | string | 内容 |
| data | object? | 附加数据 |
| is_read | boolean | 是否已读 |
| created_at | datetime | 创建时间 |
