# LifeFlow V2 - Electron 模块

本目录包含 Electron 主进程相关的代码，负责管理桌面应用的生命周期和后端进程。

## 文件结构

```
electron/
├── main.ts          # Electron 主进程入口
├── preload.ts       # 预加载脚本，暴露安全 API 给渲染进程
├── sidecar.ts       # 后端进程管理器
├── logger.ts        # 日志服务
├── diagnostics.ts   # 诊断工具
├── tsconfig.json    # TypeScript 配置
└── README.md        # 本文件
```

## 模块说明

### main.ts - 主进程入口

- 创建和管理应用窗口
- 初始化后端进程
- 处理 IPC 通信
- 管理应用生命周期

### preload.ts - 预加载脚本

通过 `contextBridge` 暴露以下 API 给渲染进程：

```typescript
window.electron = {
  // 后端管理
  getBackendStatus(): Promise<BackendStatus>;
  restartBackend(): Promise<boolean>;
  getBackendLogs(lines?: number): Promise<string[]>;
  
  // 诊断
  runDiagnostics(): Promise<DiagnosticReport>;
  getAppLogs(lines?: number): Promise<string[]>;
  getLogFilePath(): Promise<string | null>;
  
  // 通知
  showNotification(options: NotificationOptions): Promise<boolean>;
  getNotificationPermission(): Promise<boolean>;
  
  // 应用信息
  getAppInfo(): Promise<AppInfo>;
  
  // 事件监听
  onBackendStatus(callback): () => void;
  onNotificationClicked(callback): () => void;
};
```

### sidecar.ts - 后端进程管理器

`SidecarManager` 类提供：

- **进程生命周期管理**：启动、停止、重启
- **健康检查**：定期检查后端是否响应
- **自动重启**：崩溃后自动重启（最多 3 次）
- **日志收集**：收集后端输出日志
- **事件通知**：started, stopped, crashed, restarted

### logger.ts - 日志服务

- 内存日志存储（最多 1000 条）
- 文件日志（生产模式，存储在用户数据目录）
- 分类日志（Backend, Electron）
- 日志级别（debug, info, warn, error）

### diagnostics.ts - 诊断工具

运行以下检查：

- 后端可执行文件是否存在
- 用户数据目录是否可写
- 端口是否可用
- 系统资源（内存）
- 僵尸进程检测

## 开发模式

在开发模式下：

1. 后端使用 Python + uvicorn 运行
2. 前端使用 Vite 开发服务器
3. Electron 加载 `http://localhost:5173`

## 生产模式

在生产模式下：

1. 后端使用 PyInstaller 打包的可执行文件
2. 前端使用 Vite 构建的静态文件
3. Electron 加载本地 HTML 文件

## 故障排除

### 后端无法启动

1. 检查端口 51731 是否被占用
2. 运行诊断：`window.electron.runDiagnostics()`
3. 查看日志：`window.electron.getBackendLogs()`

### 连接问题

1. 确认后端状态：`window.electron.getBackendStatus()`
2. 尝试重启后端：`window.electron.restartBackend()`
3. 检查 CORS 配置

### 日志位置

- 开发模式：控制台输出
- 生产模式：`~/Library/Application Support/LifeFlow/logs/`（macOS）
