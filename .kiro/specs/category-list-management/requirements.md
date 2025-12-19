# Requirements Document

## Introduction

本功能为 LifeFlow 应用实现完整的分类列表管理系统。用户可以创建、编辑、删除分类，并将任务和习惯归类到不同的分类中。分类支持按类别筛选任务和习惯，提供更好的组织和管理体验。

本功能继承 LifeFlow V2 的技术栈和设计规范：
- **前端**: React 18 + TypeScript + TanStack Query + Tailwind CSS
- **后端**: FastAPI + SQLAlchemy + SQLite（后端 API 已实现）
- **测试**: Vitest + fast-check (前端) / pytest + hypothesis (后端)
- **环境隔离**: 所有依赖限制在项目目录内

## Glossary

- **CardList（分类列表）**: 用于组织任务和习惯的分类容器，包含名称、颜色和排序信息
- **Task（任务）**: 一次性待办事项，可关联到某个分类
- **Habit（习惯）**: 需要重复打卡的任务，可关联到某个分类
- **list_id**: 任务/习惯关联的分类 ID，可为空表示未分类
- **sort_order**: 分类的排序顺序，数值越小越靠前
- **System**: LifeFlow 分类管理系统

## Requirements

### Requirement 1

**User Story:** As a user, I want to create new categories, so that I can organize my tasks and habits into meaningful groups.

#### Acceptance Criteria

1. WHEN a user clicks the add category button THEN the System SHALL display a modal dialog with a name input field
2. WHEN a user submits a valid category name THEN the System SHALL create the category and add it to the category list
3. WHEN a user attempts to create a category with an empty or whitespace-only name THEN the System SHALL prevent the creation and display a validation error
4. WHEN a new category is created THEN the System SHALL persist the category to the database immediately

### Requirement 2

**User Story:** As a user, I want to edit existing categories, so that I can update their names as my needs change.

#### Acceptance Criteria

1. WHEN a user clicks the edit button on a category THEN the System SHALL display a modal dialog with the current name pre-filled
2. WHEN a user submits valid changes THEN the System SHALL update the category and reflect changes immediately in the UI
3. WHEN a user attempts to save a category with an empty name THEN the System SHALL prevent the update and display a validation error
4. WHEN a category is updated THEN the System SHALL persist the changes to the database immediately

### Requirement 3

**User Story:** As a user, I want to delete categories, so that I can remove categories I no longer need.

#### Acceptance Criteria

1. WHEN a user clicks the delete button on a category THEN the System SHALL display a confirmation dialog
2. WHEN a user confirms deletion THEN the System SHALL remove the category from the database
3. WHEN a category is deleted THEN the System SHALL set the list_id of all associated tasks and habits to null
4. WHEN a category is deleted THEN the System SHALL update the UI to reflect the removal immediately

### Requirement 4

**User Story:** As a user, I want to assign categories to tasks and habits when creating them, so that I can organize items from the start.

#### Acceptance Criteria

1. WHEN a user opens the task/habit creation form THEN the System SHALL display a category selector with all available categories
2. WHEN a user selects a category during creation THEN the System SHALL associate the new task/habit with that category
3. WHEN no category is selected THEN the System SHALL create the task/habit without a category association
4. WHEN the category list is empty THEN the System SHALL display the selector with only an "uncategorized" option

### Requirement 5

**User Story:** As a user, I want to change the category of existing tasks and habits, so that I can reorganize items as needed.

#### Acceptance Criteria

1. WHEN a user edits a task/habit THEN the System SHALL display the current category in the category selector
2. WHEN a user changes the category selection THEN the System SHALL update the task/habit's list_id
3. WHEN a user selects "uncategorized" THEN the System SHALL set the task/habit's list_id to null
4. WHEN the category is changed THEN the System SHALL persist the change to the database immediately

### Requirement 6

**User Story:** As a user, I want to filter tasks and habits by category, so that I can focus on specific groups of items.

#### Acceptance Criteria

1. WHEN the tasks page loads THEN the System SHALL display category filter buttons including "All" and each category
2. WHEN a user clicks a category filter THEN the System SHALL display only tasks/habits belonging to that category
3. WHEN a user clicks "All" filter THEN the System SHALL display all tasks/habits regardless of category
4. WHEN a category has no items THEN the System SHALL still display the category in the filter options
5. WHEN filtering is active THEN the System SHALL visually indicate the selected filter

### Requirement 7

**User Story:** As a user, I want the category list to always be visible in the filter area, so that I can quickly access category management.

#### Acceptance Criteria

1. WHEN the tasks page loads THEN the System SHALL always display the category filter section
2. WHEN no categories exist THEN the System SHALL display "All" filter and an add category button
3. WHEN categories exist THEN the System SHALL display all categories as filter buttons
4. WHEN a user hovers over a category filter button THEN the System SHALL display edit and delete action buttons
