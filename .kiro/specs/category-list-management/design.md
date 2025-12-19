# Design Document: Category List Management

## Overview

LifeFlow 分类列表管理系统提供完整的分类 CRUD 功能，支持任务和习惯的分类组织。系统采用现有的后端 API（已实现），前端需要实现分类管理 UI 组件和任务/习惯的分类选择功能。

本设计继承 LifeFlow V2 的技术栈和设计规范：
- **前端**: React 18 + TypeScript + TanStack Query + Tailwind CSS
- **后端**: FastAPI + SQLAlchemy + SQLite（API 已实现）
- **测试**: Vitest + fast-check (前端) / pytest + hypothesis (后端)
- **环境隔离**: 所有依赖限制在项目目录内
- **设计系统**: Material Design 3 紫色主题

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
├─────────────────────────────────────────────────────────────┤
│  CategoryFilter     │  CategoryModal    │  CategorySelector  │
│  (Filter Buttons)   │  (Create/Edit)    │  (Task Form)       │
├─────────────────────┴───────────────────┴───────────────────┤
│  useLists Hook (TanStack Query)                              │
└─────────────────────┬───────────────────────────────────────┘
                      │ REST API (port 51731)
┌─────────────────────┴───────────────────────────────────────┐
│                      Backend (FastAPI) - 已实现              │
├─────────────────────────────────────────────────────────────┤
│  GET    /api/lists          │ POST   /api/lists             │
│  PUT    /api/lists/{id}     │ DELETE /api/lists/{id}        │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 现有后端 API（已实现）

```
GET    /api/lists              # 获取所有分类列表
GET    /api/lists/{id}         # 获取单个分类
POST   /api/lists              # 创建分类
PUT    /api/lists/{id}         # 更新分类
DELETE /api/lists/{id}         # 删除分类
```

### 现有前端 Hooks（已实现）

```typescript
// src/frontend/src/hooks/useLists.ts
useLists()           // 获取所有分类
useList(id)          // 获取单个分类
useCreateList()      // 创建分类
useUpdateList()      // 更新分类
useDeleteList()      // 删除分类
```

### 需要实现的前端组件

#### 1. CategoryFilter Component

分类筛选器组件，显示在任务页面顶部。

```typescript
interface CategoryFilterProps {
  lists: CardList[]
  selectedListId: string | null
  onSelectList: (listId: string | null) => void
  onCreateList: () => void
  onEditList: (list: CardList) => void
  onDeleteList: (list: CardList) => void
}
```

功能：
- 显示"全部"按钮和所有分类按钮
- 点击分类按钮切换筛选
- 悬停时显示编辑/删除图标
- 显示添加分类按钮

#### 2. CategoryModal Component

分类创建/编辑弹窗组件。

```typescript
interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
  list?: CardList  // 编辑时传入，创建时为 undefined
  onSubmit: (data: CardListCreate | CardListUpdate) => Promise<void>
  isLoading?: boolean
}
```

功能：
- 创建模式：空表单
- 编辑模式：预填充当前名称
- 表单验证：名称不能为空
- 提交后自动关闭

#### 3. CategorySelector Component

任务/习惯表单中的分类选择器。

```typescript
interface CategorySelectorProps {
  value: string | null
  onChange: (listId: string | null) => void
  lists: CardList[]
  disabled?: boolean
  className?: string
}
```

功能：
- 下拉选择分类
- 支持"未分类"选项
- 显示当前选中的分类

#### 4. DeleteCategoryModal Component

删除分类确认弹窗。

```typescript
interface DeleteCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  list: CardList
  onConfirm: () => Promise<void>
  isLoading?: boolean
  taskCount?: number  // 该分类下的任务数量
}
```

功能：
- 显示确认信息
- 提示该分类下有多少任务会变为未分类
- 确认/取消按钮

## Data Models

### CardList（已存在）

```typescript
interface CardList {
  id: string
  name: string
  color: string      // 默认颜色，暂不支持自定义
  sort_order: number
  created_at: string
}

interface CardListCreate {
  name: string
  color?: string
  sort_order?: number
}

interface CardListUpdate {
  name?: string
  color?: string
  sort_order?: number
}
```

### Task（已存在，相关字段）

```typescript
interface Task {
  // ... 其他字段
  list_id: string | null  // 关联的分类 ID
}

interface TaskCreate {
  // ... 其他字段
  list_id?: string | null
}

interface TaskUpdate {
  // ... 其他字段
  list_id?: string | null
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Category name validation
*For any* string composed entirely of whitespace characters (including empty string), attempting to create or update a category with that name should be rejected with a validation error.
**Validates: Requirements 1.3, 2.3**

### Property 2: Category persistence round-trip
*For any* valid category name, creating a category and then querying it should return a category with the same name and a valid ID.
**Validates: Requirements 1.4, 2.4**

### Property 3: Category deletion removes from database
*For any* existing category, after deletion, querying that category by ID should return a not-found error.
**Validates: Requirements 3.2**

### Property 4: Category deletion cascades to tasks
*For any* category with associated tasks, after deleting the category, all previously associated tasks should have `list_id === null`.
**Validates: Requirements 3.3**

### Property 5: Task-category association
*For any* task and any existing category, setting the task's `list_id` to that category's ID should persist correctly, and querying the task should return the same `list_id`.
**Validates: Requirements 4.2, 5.2, 5.4**

### Property 6: Category filter correctness
*For any* category filter selection, the returned tasks should only include tasks where `list_id` matches the selected category ID (or all tasks when "All" is selected).
**Validates: Requirements 6.2, 6.3**

## Error Handling

| Error | HTTP Status | Response |
|-------|-------------|----------|
| Category not found | 404 | `{"detail": "Card list with id 'xxx' not found"}` |
| Empty category name | 400 | `{"detail": "List name cannot be empty or whitespace only"}` |
| Database error | 500 | `{"detail": "Internal server error"}` |

## UI Design

### CategoryFilter 组件样式

```typescript
// 筛选按钮样式
const filterButtonStyles = {
  base: 'px-3 py-1.5 text-sm rounded-full transition-colors',
  active: 'bg-secondary-50 text-primary-500',
  inactive: 'bg-surface-container-high text-neutral-600 hover:bg-surface-container-highest',
}

// 添加按钮样式
const addButtonStyles = 'px-2 py-1.5 text-sm rounded-full bg-surface-container-high text-neutral-500 hover:text-primary-500'
```

### CategoryModal 组件样式

使用现有的 `Modal` 组件，内部包含：
- 标题输入框（使用 `Input` 组件）
- 取消/确认按钮（使用 `Button` 组件）

### CategorySelector 组件样式

使用原生 `<select>` 或自定义下拉组件：
- 与表单其他输入框风格一致
- 显示分类名称列表
- 包含"未分类"选项

## Testing Strategy

### Property-Based Testing

使用 `fast-check` (TypeScript) 进行属性测试：

1. **分类名称验证测试**
   - 生成各种空白字符串，验证被拒绝
   - 生成有效名称，验证被接受

2. **分类持久化测试**
   - 创建分类后查询验证
   - 更新分类后查询验证

3. **筛选正确性测试**
   - 生成随机任务和分类
   - 验证筛选结果只包含匹配的任务

### Unit Tests

1. **组件测试**
   - CategoryFilter 渲染测试
   - CategoryModal 表单验证测试
   - CategorySelector 选择功能测试

2. **Hook 测试**
   - useLists 数据获取测试
   - useCreateList 创建功能测试
   - useUpdateList 更新功能测试
   - useDeleteList 删除功能测试

### Integration Tests

- 完整的分类管理流程测试
- 任务与分类关联测试
- 筛选功能端到端测试
