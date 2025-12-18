# Implementation Plan

## Phase 0: 项目结构重组

- [x] 0.1 归档 V1 代码
  - 创建 `lifeflow_v1` 目录
  - 移动 `docs/` 和 `src/` 到 `lifeflow_v1/`
  - 保留 `.kiro/specs/lifeflow/` 作为历史参考
  - _Requirements: N/A (项目管理)_

- [x] 0.2 初始化 V2 项目环境
  - 创建新的 `src/` 目录结构
  - 复用 `.venv` Python 虚拟环境（已在项目根目录）
  - 确保所有配置文件在项目目录内，不影响全局环境
  - _Requirements: 12.1, 12.4, 12.6_

## Phase 1: 后端问题诊断与修复

- [x] 1. 后端连接问题排查
  - [x] 1.1 诊断打包后连接失败原因
    - 在打包应用中添加详细日志
    - 检查后端进程是否正确启动
    - 验证端口绑定和网络连接
    - 记录诊断结果
    - _Requirements: 1.1, 1.2_
  - [x] 1.2 修复后端启动问题
    - 根据诊断结果修复问题
    - 确保后端在打包后正确启动
    - _Requirements: 1.1, 1.2_
  - [x] 1.3 实现健壮的 Sidecar 管理器
    - 创建 `sidecar.ts` 模块
    - 实现进程启动、停止、重启逻辑
    - 添加健康检查机制
    - 实现自动重启（最多 3 次）
    - _Requirements: 1.1, 1.3, 1.5_

- [x] 2. Checkpoint - 验证后端连接
  - 打包应用并测试后端连接
  - 确保所有 API 端点可访问
  - Ensure all tests pass, ask the user if questions arise.

## Phase 2: React 前端项目初始化

- [x] 3. 创建 React 项目
  - [x] 3.1 初始化 Vite + React + TypeScript 项目
    - 使用 `npm create vite@latest` 创建项目（在 src/frontend 目录）
    - 配置 TypeScript（tsconfig.json 在项目目录内）
    - 设置 ESLint 和 Prettier（配置文件在项目目录内）
    - 确保所有依赖安装到 node_modules，无全局安装
    - _Requirements: 2.1, 12.2, 12.3_
  - [x] 3.2 配置 Tailwind CSS
    - 安装 Tailwind CSS 及依赖
    - 配置 `tailwind.config.js`
    - 设置 Design Tokens（颜色、阴影、间距）
    - _Requirements: 2.2, 3.2_
  - [x] 3.3 安装和配置 shadcn/ui
    - 初始化 shadcn/ui
    - 安装基础组件（Button, Card, Input, Dialog 等）
    - _Requirements: 2.3_
  - [x] 3.4 配置状态管理和数据获取
    - 安装 Zustand 和 TanStack Query
    - 创建 QueryClient 配置
    - 设置基础 store
    - _Requirements: 2.4, 2.5_
  - [x] 3.5 配置路由
    - 安装 React Router v6
    - 创建基础路由结构
    - _Requirements: 2.6_
  - [x] 3.6 安装 ECharts
    - 安装 echarts 和 echarts-for-react
    - 创建图表配置工具
    - _Requirements: 2.7_

- [x] 4. Checkpoint - 验证项目配置
  - 运行 `npm run dev` 确保开发服务器正常
  - 在浏览器中访问 http://localhost:5173
  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: API 客户端与基础架构

- [x] 5. 实现 API 客户端
  - [x] 5.1 创建带重试的 fetch 封装
    - 实现 `fetchWithRetry` 函数
    - 配置超时和重试逻辑
    - _Requirements: 1.4_
  - [x] 5.2 编写 API 客户端属性测试
    - **Property 1: API Client Retry Logic**
    - **Validates: Requirements 1.4**
  - [x] 5.3 创建 API 模块
    - 实现 tasks API
    - 实现 lists API
    - 实现 life-entries API
    - 实现 stats API
    - 实现 settings API
    - _Requirements: 1.4_
  - [x] 5.4 创建 React Query hooks
    - 实现 useTasks hook
    - 实现 useLists hook
    - 实现 useLifeEntries hook
    - 实现 useStats hook
    - _Requirements: 2.5_

- [x] 6. 实现布局组件
  - [x] 6.1 创建主布局
    - 实现 MainLayout 组件
    - 实现 Sidebar 组件
    - 实现 Header 组件
    - _Requirements: 3.1_
  - [x] 6.2 创建通用组件
    - 实现 LoadingSkeleton 组件
    - 实现 EmptyState 组件
    - 实现 ErrorBoundary 组件
    - 实现 Toast 通知
    - _Requirements: 9.1, 9.2, 9.4_

- [x] 7. Checkpoint - 验证基础架构
  - 在浏览器中预览布局
  - 测试 API 连接（需要后端运行）
  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: 任务管理功能

- [x] 8. 实现任务列表功能
  - [x] 8.1 创建任务卡片组件
    - 实现 TaskCard 组件
    - 实现 hover 和 focus 状态
    - 添加完成动画
    - _Requirements: 4.1, 4.5_
  - [x] 8.2 创建任务列表组件
    - 实现 TaskList 组件
    - 实现拖拽排序
    - _Requirements: 4.1, 4.4_
  - [x] 8.3 编写任务排序属性测试
    - **Property 3: Task Reordering Persistence**
    - **Validates: Requirements 4.4**
  - [x] 8.4 创建任务创建表单
    - 实现 TaskCreateForm 组件
    - 实现内联创建动画
    - _Requirements: 4.2_
  - [x] 8.5 创建任务编辑面板
    - 实现 TaskEditor slide-over 面板
    - 集成 Markdown 编辑器
    - _Requirements: 4.3_
  - [x] 8.6 编写任务 CRUD 属性测试
    - **Property 2: Task CRUD Operations**
    - **Validates: Requirements 4.2, 4.3, 4.5**
  - [x] 8.7 创建任务页面
    - 实现 TasksPage 组件
    - 集成所有任务组件
    - _Requirements: 4.1-4.6_

- [x] 9. Checkpoint - 验证任务功能
  - 在浏览器中测试任务 CRUD
  - 测试拖拽排序
  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: 习惯追踪功能

- [x] 10. 实现习惯追踪功能
  - [x] 10.1 创建习惯卡片组件
    - 实现 HabitCard 组件
    - 实现 StreakBadge 组件
    - 实现 CheckinButton 组件
    - _Requirements: 5.1, 5.2_
  - [x] 10.2 编写连胜计算属性测试
    - **Property 4: Streak Calculation Correctness**
    - **Validates: Requirements 5.1, 5.2, 5.5**
  - [x] 10.3 创建每日进度环
    - 使用 ECharts 实现 DailyRing 组件
    - 添加动画效果
    - _Requirements: 5.3_
  - [x] 10.4 编写每日进度属性测试
    - **Property 5: Daily Progress Calculation**
    - **Validates: Requirements 5.3**
  - [x] 10.5 创建日历热力图
    - 使用 ECharts 实现 HeatmapCalendar 组件
    - _Requirements: 5.4_
  - [x] 10.6 编写热力图数据属性测试
    - **Property 6: Heatmap Data Aggregation**
    - **Validates: Requirements 5.4**
  - [x] 10.7 创建习惯页面
    - 实现 HabitsPage 组件
    - 集成所有习惯组件
    - _Requirements: 5.1-5.6_

- [x] 11. Checkpoint - 验证习惯功能
  - 在浏览器中测试打卡功能
  - 验证连胜计算
  - Ensure all tests pass, ask the user if questions arise.

## Phase 6: 生活记录功能

- [x] 12. 实现生活记录功能
  - [x] 12.1 创建时间轴组件
    - 实现 Timeline 组件
    - 实现 LifeEntry 组件
    - 实现 DateSeparator 组件
    - _Requirements: 6.1, 6.6_
  - [x] 12.2 编写日期分组属性测试
    - **Property 7: Life Entry Date Grouping**
    - **Validates: Requirements 6.1, 6.6**
  - [x] 12.3 创建输入组件
    - 实现 EntryInput 组件
    - 实现自动扩展 textarea
    - _Requirements: 6.2_
  - [x] 12.4 实现无限滚动
    - 实现分页加载逻辑
    - 添加加载指示器
    - _Requirements: 6.3_
  - [x] 12.5 编写分页属性测试
    - **Property 8: Life Entry Pagination**
    - **Validates: Requirements 6.3**
  - [x] 12.6 实现内联编辑
    - 实现编辑模式切换
    - 实现自动保存
    - _Requirements: 6.4_
  - [x] 12.7 编写编辑时间戳属性测试
    - **Property 9: Life Entry Edit Timestamp Preservation**
    - **Validates: Requirements 6.4**
  - [x] 12.8 实现相对时间显示
    - 创建时间格式化工具
    - 实现 hover 显示完整时间
    - _Requirements: 6.5_
  - [x] 12.9 编写相对时间属性测试
    - **Property 10: Relative Time Formatting**
    - **Validates: Requirements 6.5**
  - [x] 12.10 创建生活记录页面
    - 实现 LifePage 组件
    - 集成所有生活记录组件
    - _Requirements: 6.1-6.6_

- [x] 13. Checkpoint - 验证生活记录功能
  - 在浏览器中测试记录创建和编辑
  - 测试无限滚动
  - Ensure all tests pass, ask the user if questions arise.

## Phase 7: 统计仪表盘

- [x] 14. 实现统计仪表盘
  - [x] 14.1 创建统计卡片组件
    - 实现 StatCard 组件
    - 添加数字动画效果
    - _Requirements: 7.1, 7.4_
  - [x] 14.2 创建趋势图表
    - 使用 ECharts 实现 TrendChart 组件
    - _Requirements: 7.3_
  - [x] 14.3 编写统计计算属性测试
    - **Property 11: Statistics Calculation Accuracy**
    - **Validates: Requirements 7.1-7.5**
  - [x] 14.4 创建统计页面
    - 实现 StatsPage 组件
    - 集成每日环、统计卡片、趋势图
    - 添加骨架屏加载状态
    - _Requirements: 7.1-7.7_

- [x] 15. Checkpoint - 验证统计功能
  - 在浏览器中测试统计展示
  - 验证数据准确性
  - Ensure all tests pass, ask the user if questions arise.

## Phase 8: 设置与首页

- [x] 16. 实现设置页面
  - [x] 16.1 创建设置页面
    - 实现 SettingsPage 组件
    - 实现设置分类展示
    - _Requirements: 8.1_
  - [x] 16.2 实现设置功能
    - 实现通知设置
    - 实现数据导出
    - 实现应用信息展示
    - _Requirements: 8.2-8.5_
  - [x] 16.3 编写设置持久化属性测试
    - **Property 12: Settings Round-Trip Consistency**
    - **Validates: Requirements 8.2**

- [x] 17. 实现首页
  - [x] 17.1 创建首页
    - 实现 HomePage 组件
    - 展示今日概览
    - 集成每日环和快捷操作
    - _Requirements: All_

- [x] 18. Checkpoint - 验证设置和首页
  - 在浏览器中测试所有页面
  - Ensure all tests pass, ask the user if questions arise.

## Phase 9: Electron 集成

- [x] 19. Electron 集成
  - [x] 19.1 配置 Electron 主进程
    - 创建 `electron/main.ts`
    - 集成 Sidecar 管理器
    - 配置窗口和菜单
    - _Requirements: 1.1-1.6_
  - [x] 19.2 配置 Preload 脚本
    - 创建 `electron/preload.ts`
    - 暴露必要的 API
    - _Requirements: 1.6_
  - [x] 19.3 配置 Electron 开发模式
    - 配置 Vite + Electron 开发环境
    - 实现热更新
    - _Requirements: 11.1_
  - [x] 19.4 实现桌面通知
    - 集成 Electron Notification API∆
    - _Requirements: 相关通知功能_

- [x] 20. Checkpoint - 验证 Electron 集成
  - 运行 `npm run dev:electron` 测试
  - 验证后端连接
  - Ensure all tests pass, ask the user if questions arise.

## Phase 10: 性能优化与打包

- [x] 21. 性能优化
  - [x] 21.1 前端性能优化
    - 配置代码分割
    - 优化 Bundle 大小
    - 实现懒加载
    - _Requirements: 10.1, 10.2, 10.8_
  - [x] 21.2 后端性能优化
    - 优化 PyInstaller 打包
    - 排除不必要的依赖
    - _Requirements: 10.7_
  - [x] 21.3 Electron 优化
    - 优化启动时间
    - 减小应用体积
    - _Requirements: 10.1, 10.7_

- [x] 22. 打包与测试
  - [x] 22.1 配置 electron-builder
    - 配置 macOS 打包
    - 配置 Windows 打包
    - _Requirements: All_
  - [x] 22.2 打包测试
    - 生成 DMG 安装包
    - 在干净环境测试
    - 验证所有功能
    - _Requirements: 10.7, 11.6_

- [x] 23. Final Checkpoint - 最终验证
  - 所有测试通过
  - 打包应用功能正常
  - 性能指标达标
  - Ensure all tests pass, ask the user if questions arise.

