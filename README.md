<![CDATA[# LifeFlow

<p align="center">
  <strong>🌊 简约高效的个人效率应用</strong>
</p>

<p align="center">
  帮助你管理任务、追踪习惯、记录生活，让每一天都充满掌控感。
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows-lightgrey.svg" alt="Platform">
</p>

---

## ✨ 功能特性

### 📋 任务管理
- 创建、编辑、删除日常任务
- 任务优先级设置（高/中/低）
- 任务分类与标签管理
- 拖拽排序，灵活调整任务顺序
- 任务完成状态追踪

### 🔥 习惯追踪
- 建立并保持良好习惯
- 连续打卡统计与记录
- 习惯完成率可视化
- 自定义习惯频率（每日/每周）
- 习惯提醒通知

### 📝 生活记录
- 随时记录生活点滴
- 支持文字记录
- 按日期浏览历史记录
- 记录搜索与筛选

### 📊 数据统计
- 任务完成趋势图表
- 习惯坚持天数统计
- 周/月数据汇总报告
- ECharts 可视化图表展示

### 🔔 智能通知
- 习惯打卡提醒
- 成就达成通知
- 连续打卡风险预警
- 自定义通知时间

### 🎨 精美设计
- Material Design 3 设计语言
- 紫色主题，优雅大方
- 响应式布局，适配各种屏幕
- 流畅的动画过渡效果

---

## 🛠️ 技术栈

### 前端
| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.3 | UI 框架 |
| TypeScript | 5.6 | 类型安全 |
| TanStack Query | 5.x | 服务端状态管理 |
| Zustand | 5.x | 客户端状态管理 |
| Tailwind CSS | 4.x | 样式框架 |
| ECharts | 6.x | 数据可视化 |
| Electron | 33.x | 桌面应用框架 |
| Vite | 6.x | 构建工具 |

### 后端
| 技术 | 版本 | 用途 |
|------|------|------|
| Python | 3.11+ | 运行环境 |
| FastAPI | - | Web 框架 |
| SQLAlchemy | - | ORM |
| SQLite | - | 数据库 |
| Pydantic | - | 数据验证 |

---

## 🚀 快速开始

### 前置要求

确保你的系统已安装以下软件：

- **Node.js** 18.0 或更高版本
- **Python** 3.11 或更高版本
- **pnpm** 或 **npm** 包管理器

### 安装步骤

#### 1. 克隆仓库

```bash
git clone https://github.com/DabRlin/Lifeflow.git
cd Lifeflow
```

#### 2. 安装后端依赖

```bash
# 创建 Python 虚拟环境
python -m venv .venv

# 激活虚拟环境
# macOS/Linux:
source .venv/bin/activate
# Windows:
.venv\Scripts\activate

# 安装依赖
pip install -r src/backend/requirements.txt
```

#### 3. 安装前端依赖

```bash
cd src/frontend
npm install
```

### 启动开发服务器

#### 启动后端服务

```bash
# 确保在项目根目录，且已激活虚拟环境
source .venv/bin/activate
python src/backend/run_server.py
```

后端服务将在 `http://localhost:51731` 启动。

#### 启动前端服务

```bash
cd src/frontend
npm run dev
```

前端开发服务器将在 `http://localhost:5173` 启动。

#### 启动 Electron 开发模式

```bash
cd src/frontend
npm run dev:electron
```

---

## 📦 构建发布

### 构建后端

```bash
cd src/backend
python build_backend.py
```

构建产物将输出到 `src/backend/dist/` 目录。

### 构建前端 + Electron 应用

```bash
cd src/frontend
npm run build:electron
```

安装包将输出到 `src/frontend/release/` 目录：
- **macOS**: `.dmg` 安装包（支持 arm64 和 x64）
- **Windows**: `.exe` 安装程序

---

## 🧪 测试

### 后端测试

```bash
cd src/backend
pytest
```

### 前端测试

```bash
cd src/frontend
npm run test
```

---

## 📁 项目结构

```
lifeflow/
├── src/
│   ├── backend/                 # FastAPI 后端
│   │   ├── app/
│   │   │   ├── api/             # API 路由定义
│   │   │   ├── models/          # SQLAlchemy 数据模型
│   │   │   ├── schemas/         # Pydantic 请求/响应模式
│   │   │   └── services/        # 业务逻辑层
│   │   ├── tests/               # 后端单元测试
│   │   ├── build_backend.py     # 后端打包脚本
│   │   ├── run_server.py        # 开发服务器启动脚本
│   │   ├── requirements.txt     # Python 依赖
│   │   └── pyproject.toml       # 项目配置
│   │
│   └── frontend/                # React + Electron 前端
│       ├── src/
│       │   ├── api/             # API 客户端封装
│       │   ├── components/      # React 组件
│       │   ├── hooks/           # 自定义 Hooks
│       │   ├── pages/           # 页面组件
│       │   └── stores/          # Zustand 状态管理
│       ├── electron/            # Electron 主进程代码
│       ├── public/              # 静态资源
│       └── package.json         # 前端依赖配置
│
├── .kiro/                       # Kiro 规格文档
├── LICENSE                      # MIT 许可证
└── README.md                    # 项目说明文档
```

---

## 🔧 配置说明

### 后端配置

后端默认运行在端口 `51731`，可在 `run_server.py` 中修改。

### 前端配置

前端开发服务器默认运行在端口 `5173`，可在 `vite.config.ts` 中修改。

### Electron 配置

Electron 打包配置位于 `package.json` 的 `build` 字段，支持：
- macOS: DMG 安装包
- Windows: NSIS 安装程序

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 提交 Pull Request

### 代码规范

- 后端使用 Ruff 进行代码检查
- 前端使用 ESLint + Prettier 进行代码格式化

```bash
# 前端代码检查
cd src/frontend
npm run lint
```

---

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

---

## 📮 联系方式

如有问题或建议，欢迎通过以下方式联��：

- 提交 [GitHub Issue](https://github.com/DabRlin/Lifeflow/issues)

---

<p align="center">
  用 ❤️ 打造，助你掌控每一天
</p>
]]>