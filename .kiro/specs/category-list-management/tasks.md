# Implementation Plan

## 环境说明

- **前端目录**: `src/frontend/`
- **后端目录**: `src/backend/`（API 已实现，无需修改）
- **测试框架**: Vitest + fast-check (前端)
- **设计系统**: Material Design 3 紫色主题

---

- [x] 1. 实现 CategorySelector 组件
  - [x] 1.1 创建 `src/frontend/src/components/category/CategorySelector.tsx`
    - 实现下拉选择器，显示所有分类
    - 包含"未分类"选项
    - 支持 value/onChange 受控模式
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1_
  - [x] 1.2 创建组件导出 `src/frontend/src/components/category/index.ts`
    - _Requirements: 4.1_
  - [x] 1.3 编写 CategorySelector 属性测试
    - **Property 5: Task-category association**
    - **Validates: Requirements 4.2, 5.2, 5.4**

- [x] 2. 实现 CategoryModal 组件
  - [x] 2.1 创建 `src/frontend/src/components/category/CategoryModal.tsx`
    - 使用现有 Modal 组件
    - 支持创建和编辑两种模式
    - 表单验证：名称不能为空
    - _Requirements: 1.1, 1.2, 2.1, 2.2_
  - [x] 2.2 编写 CategoryModal 属性测试
    - **Property 1: Category name validation**
    - **Validates: Requirements 1.3, 2.3**

- [x] 3. 实现 DeleteCategoryModal 组件
  - [x] 3.1 创建 `src/frontend/src/components/category/DeleteCategoryModal.tsx`
    - 显示确认信息和关联任务数量
    - 确认/取消按钮
    - _Requirements: 3.1, 3.2_
  - [x] 3.2 编写删除级联属性测试
    - **Property 4: Category deletion cascades to tasks**
    - **Validates: Requirements 3.3**

- [x] 4. 实现 CategoryFilter 组件
  - [x] 4.1 创建 `src/frontend/src/components/category/CategoryFilter.tsx`
    - 显示"全部"按钮和所有分类按钮
    - 悬停时显示编辑/删除图标
    - 显示添加分类按钮
    - _Requirements: 6.1, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4_
  - [x] 4.2 编写筛选正确性属性测试
    - **Property 6: Category filter correctness**
    - **Validates: Requirements 6.2, 6.3**

- [x] 5. 集成到 TasksPage
  - [x] 5.1 更新 `src/frontend/src/pages/TasksPage.tsx`
    - 替换现有的列表筛选器为 CategoryFilter 组件
    - 集成分类创建/编辑/删除功能
    - _Requirements: 6.1, 7.1_
  - [x] 5.2 更新 TaskCreateForm 组件
    - 添加 CategorySelector 到创建表单
    - _Requirements: 4.1, 4.2_

- [x] 6. 集成到 TaskCard 编辑功能
  - [x] 6.1 更新 `src/frontend/src/components/task/TaskCard.tsx`
    - 在编辑模式添加 CategorySelector
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 7. Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. 编写集成测试
  - [x] 8.1 编写分类持久化属性测试
    - **Property 2: Category persistence round-trip**
    - **Validates: Requirements 1.4, 2.4**
  - [x] 8.2 编写分类删除属性测试
    - **Property 3: Category deletion removes from database**
    - **Validates: Requirements 3.2**

- [x] 9. Final Checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.
