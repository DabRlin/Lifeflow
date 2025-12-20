# LifeFlow

<p align="center">
  <strong>🌊 简约高效的个人效率应用</strong>
</p>

<p align="center">
  帮助你管理任务、追踪习惯、记录生活，让每一天都充满掌控感。
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.2.1-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows-lightgrey.svg" alt="Platform">
  <img src="https://img.shields.io/badge/code-14k%20lines-orange.svg" alt="Code Lines">
</p>

---

## ✨ 功能特性

### 📋 任务管理

- 创建、编辑、删除日常任务
- 任务分类管理
- 拖拽排序，灵活调整任务顺序
- 任务完成状态追踪

### 🔥 习惯追踪

- 建立并保持良好习惯
- 连续打卡统计与记录
- 习惯完成率可视化
- 年度热力图日历
- 打卡趋势图表

### 📝 生活记录

- 随时记录生活点滴
- 时间线展示
- 无限滚动加载历史记录

### 📊 数据统计

- 今日进度环形图
- 习惯坚持天数统计
- 打卡趋势折线图
- ECharts 可视化图表展示

### 🔔 通知系统

- 应用内通知面板
- 打卡成功通知
- 连胜里程碑通知 (7/30/100 天)

### 🎨 精美设计

- Material Design 3 设计语言
- 紫色主题 (#6750A4)
- 响应式布局
- 流畅的动画过渡效果

---

## 📦 下载安装

从 [GitHub Releases](https://github.com/DabRlin/Lifeflow/releases) 下载最新版本：

- **macOS**: `LifeFlow-x.x.x-arm64.dmg` (Apple Silicon) / `LifeFlow-x.x.x-x64.dmg` (Intel)
- **Windows**: `LifeFlow-Setup-x.x.x.exe`

---

## 🛠️ 技术栈

### 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.3 | UI 框架 |
| TypeScript | 5.6 | 类型安全 |
| Vite | 6.0 | 构建工具 |
| Electron | 33.2 | 桌面应用框架 |
| TailwindCSS | 4.1 | CSS 框架 |
| React Query | 5.x | 数据请求管理 |
| Zustand | 5.x | 状态管理 |
| ECharts | 6.x | 数据可视化 |

### 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| Python | 3.11+ | 运行环境 |
| FastAPI | 0.109+ | Web 框架 |
| SQLAlchemy | 2.0+ | ORM |
| SQLite | - | 数据库 |
| Pydantic | 2.5+ | 数据验证 |

---

## 🚀 开发指南

### 环境要求

- Node.js >= 20.x
- Python >= 3.11
- npm >= 10.x

### 快速开始

```bash
# 克隆项目
git clone https://github.com/DabRlin/Lifeflow.git
cd Lifeflow

# 安装后端依赖
cd src/backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 安装前端依赖
cd ../frontend
npm install
```

### 启动开发服务器

```bash
# 终端 1: 启动后端
cd src/backend
python run_server.py --db-path ./lifeflow.db

# 终端 2: 启动前端
cd src/frontend
npm run dev
```

访问 http://localhost:5173 即可使用应用。

---

## 📁 项目结构

```
LifeFlow/
├── src/
│   ├── backend/          # FastAPI 后端 (~2,600 行)
│   │   ├── app/          # 应用代码
│   │   │   ├── api/      # API 路由
│   │   │   ├── models/   # 数据模型
│   │   │   ├── schemas/  # Pydantic 模式
│   │   │   └── services/ # 业务逻辑
│   │   └── tests/        # 测试代码
│   │
│   └── frontend/         # React + Electron 前端 (~11,500 行)
│       ├── electron/     # Electron 主进程
│       ├── src/
│       │   ├── api/      # API 客户端
│       │   ├── components/ # React 组件
│       │   ├── hooks/    # 自定义 Hooks
│       │   ├── lib/      # 工具函数
│       │   ├── pages/    # 页面组件
│       │   └── stores/   # 状态管理
│       └── public/       # 静态资源
│
├── docs/                 # 项目文档
└── .github/              # GitHub Actions
```

---

## 📚 文档

详细文档请查看 [docs/](./docs/) 目录：

- [项目概述](./docs/overview.md)
- [架构设计](./docs/architecture.md)
- [后端文档](./docs/backend.md)
- [前端文档](./docs/frontend.md)
- [API 参考](./docs/api-reference.md)
- [开发指南](./docs/development.md)
- [部署指南](./docs/deployment.md)
- [代码统计](./docs/code-stats.md)
- [路线图](./docs/ROADMAP.md)

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: 添加新功能'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 提交 Pull Request

---

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

---

<p align="center">
  用 ❤️ 打造，助你掌控每一天
</p>
