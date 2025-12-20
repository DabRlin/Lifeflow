# LifeFlow V2 后端连接问题诊断报告

## 诊断日期
2025-12-15

## 发现的问题

### 1. CORS 配置问题 (严重)

**问题描述：**
V1 版本的后端 CORS 配置只允许 `http://localhost:5173`，但打包后的 Electron 应用使用 `file://` 协议加载页面，导致 CORS 请求被拒绝。

**影响：**
- 打包后的应用无法与后端通信
- 所有 API 请求都会失败

**修复方案：**
- 在 `src/backend/app/main.py` 中添加环境变量 `LIFEFLOW_PACKAGED`
- 当处于打包模式时，允许所有来源 (`allow_origins=["*"]`)
- 开发模式下保持严格的 CORS 配置

### 2. 日志不足 (中等)

**问题描述：**
V1 版本的后端启动日志不够详细，难以诊断启动失败的原因。

**影响：**
- 无法确定后端是否成功启动
- 无法确定数据库路径是否正确
- 无法确定端口是否被占用

**修复方案：**
- 在 `src/backend/run_server.py` 中添加详细的启动日志
- 添加端口可用性检查
- 添加环境变量打印
- 添加 `/api/diagnostics` 端点用于运行时诊断

### 3. 缺少健康检查详情 (低)

**问题描述：**
V1 的 `/api/health` 端点只返回简单的状态，无法提供足够的诊断信息。

**修复方案：**
- 扩展 `/api/health` 返回版本和打包状态
- 添加 `/api/diagnostics` 端点返回详细诊断信息

### 4. Electron 端缺少诊断工具 (中等)

**问题描述：**
V1 版本的 Electron 主进程缺少系统化的诊断工具，难以在打包后排查问题。

**修复方案：**
- 创建 `src/frontend/electron/logger.ts` 提供日志服务
- 创建 `src/frontend/electron/diagnostics.ts` 提供诊断功能
- 日志写入文件，便于用户提交问题报告

## 已实施的修复

### 后端修复

1. **CORS 配置** (`src/backend/app/main.py`)
   - 添加 `LIFEFLOW_PACKAGED` 环境变量检测
   - 打包模式下允许所有来源
   - 添加详细的启动日志

2. **启动脚本** (`src/backend/run_server.py`)
   - 添加 `--packaged` 命令行参数
   - 添加端口可用性检查
   - 添加详细的启动信息打印
   - 添加时间戳日志

3. **诊断端点** (`src/backend/app/main.py`)
   - 添加 `/api/diagnostics` 端点
   - 返回 Python 版本、数据库路径、CORS 配置等信息

### Electron 端修复

1. **日志服务** (`src/frontend/electron/logger.ts`)
   - 内存日志存储
   - 文件日志（生产模式）
   - 分类日志（Backend, Electron）
   - 日志级别（debug, info, warn, error）

2. **诊断模块** (`src/frontend/electron/diagnostics.ts`)
   - 环境信息收集
   - 后端可执行文件检查
   - 用户数据目录检查
   - 端口可用性检查
   - 系统资源检查
   - 僵尸进程检查

## 已完成

1. ✅ 实现 Sidecar 管理器 (`sidecar.ts`)
   - 进程启动、停止、重启逻辑
   - 健康检查机制（定期检查 `/api/health`）
   - 自动重启（最多 3 次）
   - 事件系统（started, stopped, crashed, restarted）
   - 日志收集

2. ✅ 更新 Electron 主进程 (`main.ts`)
   - 使用新的 Sidecar 管理器
   - 集成诊断和日志模块
   - IPC 通信接口

3. ✅ 创建 Preload 脚本 (`preload.ts`)
   - 暴露安全 API 给渲染进程
   - 类型定义

## 下一步

1. 初始化 React 前端项目
2. 配置 Vite + Electron 开发环境
3. 添加 UI 中的日志查看功能
