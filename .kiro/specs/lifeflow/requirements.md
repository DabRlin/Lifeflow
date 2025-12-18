# Requirements Document

## Introduction

LifeFlow 是一款跨平台桌面效率应用，融合了任务卡片管理、游戏化习惯养成和轻量生活记录功能。产品设计灵感来源于 Apple 提醒事项的轻量交互、健身 App 的激励圆环机制，以及手记 App 的粘性记录体验，旨在实现"任务-习惯-生活"三位一体的个人效率管理。

目标平台为 Windows 和 macOS 桌面客户端，采用 Electron/Tauri + Vue 3 + FastAPI + SQLite 技术栈。

## Glossary

- **LifeFlow System**: 本应用的完整系统，包含前端界面、后端服务和本地数据库
- **Task Card (任务卡片)**: 系统中的基本任务单元，包含标题、详细内容、分类、提醒时间等属性
- **Card List (卡片列表)**: 用于组织和分类任务卡片的容器，类似 Apple 提醒事项的列表功能
- **Check-in (打卡)**: 用户完成习惯类任务时的确认操作
- **Streak (连胜)**: 用户连续完成打卡的天数统计
- **Daily Ring (每日圆环)**: 可视化展示当日习惯完成进度的环形图表
- **Life Entry (生活记录)**: 用户记录日常生活的轻量日记条目
- **Markdown Content**: 任务卡片展开后支持的富文本编辑格式
- **Desktop Notification**: 通过操作系统原生 API 推送的任务提醒通知

## Requirements

### Requirement 1: 用户设置与本地存储

**User Story:** As a user, I want to have my preferences and data stored locally, so that I can use the application without network dependency and maintain privacy.

#### Acceptance Criteria

1. WHEN the LifeFlow System starts for the first time, THE LifeFlow System SHALL create a local SQLite database file to store user data.
2. WHEN a user modifies application settings, THE LifeFlow System SHALL persist the settings to local storage within 1 second.
3. WHEN the LifeFlow System starts, THE LifeFlow System SHALL load previously saved user settings and restore the application state.
4. IF the local database file is corrupted or missing, THEN THE LifeFlow System SHALL create a new database and notify the user of data loss.

### Requirement 9: 独立可执行文件打包

**User Story:** As a user, I want to install and run LifeFlow without needing to install Python or any other dependencies, so that I can use the application immediately after download.

#### Acceptance Criteria

1. WHEN the application is packaged for distribution, THE LifeFlow System SHALL bundle the Python backend as a standalone executable using PyInstaller.
2. WHEN the Electron application starts, THE LifeFlow System SHALL launch the bundled backend executable as a sidecar process.
3. WHEN the application is installed on a clean system (without Python), THE LifeFlow System SHALL run without requiring any additional software installation.
4. WHEN the backend executable starts, THE LifeFlow System SHALL locate and use the correct database file path relative to the application installation directory.
5. WHEN the Electron application closes, THE LifeFlow System SHALL terminate the backend sidecar process gracefully.
6. WHEN packaging for different platforms, THE LifeFlow System SHALL generate platform-specific backend executables (Windows .exe, macOS binary).

### Requirement 2: 任务卡片基础管理

**User Story:** As a user, I want to create, edit, delete, and organize task cards, so that I can manage my tasks efficiently.

#### Acceptance Criteria

1. WHEN a user clicks the create button and enters a task title, THE LifeFlow System SHALL create a new Task Card with the provided title and add it to the current Card List.
2. WHEN a user edits a Task Card's title or basic properties, THE LifeFlow System SHALL update the Task Card and persist changes to the database.
3. WHEN a user deletes a Task Card, THE LifeFlow System SHALL remove the Task Card from the Card List and mark it as deleted in the database.
4. WHEN a user drags a Task Card to a different Card List, THE LifeFlow System SHALL move the Task Card to the target Card List and update its category.
5. WHEN a user creates a new Card List, THE LifeFlow System SHALL add the Card List to the sidebar and make it available for task organization.
6. IF a user attempts to create a Task Card with an empty title, THEN THE LifeFlow System SHALL prevent the creation and display a validation message.

### Requirement 3: 卡片展开编辑

**User Story:** As a user, I want to expand a task card and edit detailed content in Markdown format, so that I can add rich notes and descriptions to my tasks.

#### Acceptance Criteria

1. WHEN a user clicks on a Task Card, THE LifeFlow System SHALL display an expanded editing panel with Markdown editor.
2. WHEN a user types Markdown syntax in the editor, THE LifeFlow System SHALL render a real-time preview of the formatted content.
3. WHEN a user saves the expanded content, THE LifeFlow System SHALL persist the Markdown content to the database.
4. WHEN a user closes the expanded panel, THE LifeFlow System SHALL auto-save any unsaved changes.
5. WHEN displaying saved Markdown content, THE LifeFlow System SHALL parse the stored Markdown and render it correctly.
6. WHEN a user formats Markdown content, THE LifeFlow System SHALL provide a pretty-printed output that preserves the original structure when re-parsed.

### Requirement 4: 打卡与连胜机制

**User Story:** As a user, I want to check in on habit tasks and track my streak, so that I can stay motivated and build consistent habits.

#### Acceptance Criteria

1. WHEN a user clicks the check-in button on a habit Task Card, THE LifeFlow System SHALL record the check-in with the current date and time.
2. WHEN a user checks in on consecutive days, THE LifeFlow System SHALL increment the Streak counter for that Task Card.
3. WHEN a user misses a day of check-in, THE LifeFlow System SHALL reset the Streak counter to zero on the next check-in.
4. WHEN displaying a habit Task Card, THE LifeFlow System SHALL show the current Streak count prominently.
5. WHILE a user has an active Streak of 7 days or more, THE LifeFlow System SHALL display a visual indicator highlighting the achievement.
6. WHEN calculating Streak, THE LifeFlow System SHALL use the user's local timezone for day boundary determination.

### Requirement 5: 每日圆环可视化

**User Story:** As a user, I want to see a daily progress ring showing my habit completion, so that I can visualize my daily achievements at a glance.

#### Acceptance Criteria

1. WHEN the dashboard loads, THE LifeFlow System SHALL display a Daily Ring showing the percentage of habit tasks completed today.
2. WHEN a user completes a habit check-in, THE LifeFlow System SHALL update the Daily Ring progress in real-time.
3. WHEN all daily habit tasks are completed, THE LifeFlow System SHALL display a fully closed ring with a completion animation.
4. WHEN displaying the Daily Ring, THE LifeFlow System SHALL show the numerical completion percentage alongside the visual ring.
5. WHEN a new day begins (midnight in user's timezone), THE LifeFlow System SHALL reset the Daily Ring progress to zero.

### Requirement 6: 桌面通知提醒

**User Story:** As a user, I want to receive desktop notifications for task reminders, so that I don't miss important deadlines and scheduled tasks.

#### Acceptance Criteria

1. WHEN a user sets a reminder time for a Task Card, THE LifeFlow System SHALL store the reminder configuration.
2. WHEN the reminder time arrives, THE LifeFlow System SHALL trigger a native desktop notification with the task title.
3. WHEN a user clicks on a desktop notification, THE LifeFlow System SHALL bring the application to focus and display the relevant Task Card.
4. WHERE notification permissions are granted, THE LifeFlow System SHALL deliver notifications through the operating system's native notification API.
5. IF notification permissions are denied, THEN THE LifeFlow System SHALL display an in-app reminder and prompt the user to enable notifications.

### Requirement 7: 基础统计功能

**User Story:** As a user, I want to view statistics about my task completion and habits, so that I can understand my productivity patterns.

#### Acceptance Criteria

1. WHEN a user navigates to the statistics view, THE LifeFlow System SHALL display the total number of tasks created, completed, and pending.
2. WHEN displaying statistics, THE LifeFlow System SHALL show the overall task completion rate as a percentage.
3. WHEN displaying statistics, THE LifeFlow System SHALL show the longest Streak achieved across all habit tasks.
4. WHEN displaying statistics, THE LifeFlow System SHALL show a summary of today's completed tasks and check-ins.
5. WHEN task data changes, THE LifeFlow System SHALL update the statistics view to reflect current data.

### Requirement 8: 生活记录功能

**User Story:** As a user, I want to write lightweight diary entries and view them in a timeline, so that I can capture and reflect on daily life moments.

#### Acceptance Criteria

1. WHEN a user enters text in the life entry input area and submits, THE LifeFlow System SHALL create a new Life Entry with timestamp.
2. WHEN displaying Life Entries, THE LifeFlow System SHALL present them in reverse chronological order (newest first).
3. WHEN a user edits an existing Life Entry, THE LifeFlow System SHALL update the content while preserving the original timestamp.
4. WHEN a user deletes a Life Entry, THE LifeFlow System SHALL remove it from the timeline view and mark it as deleted in the database.
5. WHEN displaying the timeline, THE LifeFlow System SHALL group Life Entries by date with clear date separators.
6. WHEN a user scrolls through the timeline, THE LifeFlow System SHALL load entries progressively to maintain performance.
