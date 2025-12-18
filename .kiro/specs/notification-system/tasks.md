# Implementation Plan

## 1. Backend - Database Model and API

- [x] 1.1 Create Notification database model
  - Add `notifications` table with id, type, title, message, data (JSON), is_read, created_at, user_id
  - Create SQLAlchemy model in `src/backend/app/models/notification.py`
  - Add Alembic migration or auto-create table
  - _Requirements: 4.1_

- [x] 1.2 Write property test for notification persistence
  - **Property 6: Notification persistence round-trip**
  - **Validates: Requirements 4.1**

- [x] 1.3 Create Notification API endpoints
  - GET `/api/notifications` - List notifications with pagination
  - GET `/api/notifications/unread-count` - Get unread count
  - PATCH `/api/notifications/{id}/read` - Mark as read
  - POST `/api/notifications/read-all` - Mark all as read
  - DELETE `/api/notifications/{id}` - Delete notification
  - _Requirements: 3.1, 3.2, 4.2_

- [x] 1.4 Write property test for notification ordering
  - **Property 7: Notification ordering**
  - **Validates: Requirements 4.3**

- [x] 1.5 Implement NotificationService
  - `generate_habit_reminders()` - Generate reminders for pending habits
  - `check_streak_achievement(habit_id, streak)` - Check and create achievement notifications
  - `check_daily_complete()` - Check if all habits completed
  - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [x] 1.6 Write property test for achievement generation
  - **Property 2: Achievement notification generation**
  - **Validates: Requirements 2.1**

- [x] 1.7 Integrate notification generation with habit check-in
  - Call `check_streak_achievement` after successful check-in
  - Call `check_daily_complete` after check-in
  - _Requirements: 2.1, 2.2_

- [x] 1.8 Checkpoint - Backend tests
  - Ensure all tests pass, ask the user if questions arise.

## 2. Frontend - API Client and Hooks

- [x] 2.1 Create notification API client
  - Add `src/frontend/src/api/notifications.ts`
  - Implement all API methods with proper typing
  - _Requirements: 4.2_

- [x] 2.2 Create useNotifications hook
  - Add `src/frontend/src/hooks/useNotifications.ts`
  - Implement queries for notifications and unread count
  - Implement mutations for mark as read, mark all as read, delete
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 2.3 Write property test for unread count accuracy
  - **Property 5: Unread count accuracy**
  - **Validates: Requirements 3.3**

## 3. Frontend - UI Components

- [x] 3.1 Update NotificationPanel component
  - Apply M3 purple theme colors
  - Display notifications grouped by type
  - Add "mark all as read" button
  - Show loading and empty states
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 3.2 Update Header notification badge
  - Show unread count from API
  - Use primary-500 purple color
  - Animate badge on new notifications
  - _Requirements: 3.3, 5.1_

- [x] 3.3 Add notification item interactions
  - Click to mark as read
  - Delete button for individual notifications
  - Visual distinction for read/unread
  - _Requirements: 3.1_

- [ ] 3.4 Write unit tests for notification components
  - Test NotificationPanel rendering
  - Test badge count display
  - Test mark as read interaction
  - _Requirements: 3.1, 3.3_

## 4. Integration and Polish

- [x] 4.1 Generate initial notifications on app load
  - Call `generate_habit_reminders` on first load of the day
  - Store last generation date to avoid duplicates
  - _Requirements: 1.1, 4.2_

- [x] 4.2 Add notification generation triggers
  - Generate achievement notification on milestone streak
  - Generate daily complete notification when all habits done
  - _Requirements: 2.1, 2.2_

- [x] 4.3 Write property test for at-risk notification
  - **Property 1: At-risk notification generation**
  - **Validates: Requirements 1.2**

- [x] 4.4 Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.
