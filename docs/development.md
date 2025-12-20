# 开发指南

## 环境准备

### 系统要求

- **操作系统**: macOS 12+ / Windows 10+
- **Node.js**: >= 20.x
- **Python**: >= 3.11
- **npm**: >= 10.x
- **Git**: >= 2.x

### 推荐工具

- **IDE**: VS Code / Cursor / Kiro
- **数据库工具**: DB Browser for SQLite
- **API 测试**: Postman / Insomnia

## 项目设置

### 1. 克隆项目

```bash
git clone https://github.com/DabRlin/Lifeflow.git
cd Lifeflow
```

### 2. 后端设置

```bash
cd src/backend

# 创建虚拟环境
python -m venv .venv

# 激活虚拟环境
# macOS/Linux:
source .venv/bin/activate
# Windows:
.venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 生成测试数据（可选）
python seed_data.py --db-path ./lifeflow.db
```

### 3. 前端设置

```bash
cd src/frontend

# 安装依赖
npm install
```

## 启动开发服务器

### 方式一：分别启动（推荐）

**终端 1 - 后端**
```bash
cd src/backend
source .venv/bin/activate  # Windows: .venv\Scripts\activate
python run_server.py --db-path ./lifeflow.db
```

后端将在 `http://127.0.0.1:51731` 启动。

**终端 2 - 前端**
```bash
cd src/frontend
npm run dev
```

前端将在 `http://localhost:5173` 启动。

### 方式二：Electron 开发模式

```bash
cd src/frontend
npm run dev:electron
```

这将同时启动 Vite 开发服务器和 Electron 窗口。

## 开发工作流

### 代码风格

**前端**
- ESLint + Prettier 自动格式化
- TypeScript 严格模式
- 组件使用函数式 + Hooks

```bash
# 检查代码风格
npm run lint

# 自动修复
npm run lint:fix

# 格式化代码
npm run format
```

**后端**
- 遵循 PEP 8 规范
- 使用 Type Hints
- 异步函数优先

### Git 工作流

```bash
# 创建功能分支
git checkout -b feature/your-feature

# 提交更改
git add .
git commit -m "feat: 添加新功能"

# 推送分支
git push origin feature/your-feature

# 创建 Pull Request
```

**提交信息规范**
- `feat:` 新功能
- `fix:` 修复 Bug
- `docs:` 文档更新
- `style:` 代码格式
- `refactor:` 重构
- `test:` 测试相关
- `chore:` 构建/工具

## 调试

### 后端调试

**VS Code 配置** (`.vscode/launch.json`)
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: FastAPI",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": [
        "app.main:app",
        "--host", "127.0.0.1",
        "--port", "51731",
        "--reload"
      ],
      "cwd": "${workspaceFolder}/src/backend",
      "env": {
        "LIFEFLOW_DATABASE_PATH": "./lifeflow.db"
      }
    }
  ]
}
```

**日志输出**
```python
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

logger.debug("调试信息")
logger.info("一般信息")
logger.warning("警告信息")
logger.error("错误信息")
```

**API 文档**

启动后端后访问：
- Swagger UI: `http://127.0.0.1:51731/docs`
- ReDoc: `http://127.0.0.1:51731/redoc`

### 前端调试

**React DevTools**

安装浏览器扩展：
- [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools)

**React Query DevTools**

开发模式下自动启用，点击右下角图标打开。

**Electron 调试**

```bash
# 打开开发者工具
# 在 Electron 窗口中按 Cmd+Option+I (macOS) 或 Ctrl+Shift+I (Windows)
```

**VS Code 配置** (`.vscode/launch.json`)
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Electron: Main",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}/src/frontend",
      "runtimeExecutable": "${workspaceFolder}/src/frontend/node_modules/.bin/electron",
      "args": ["."],
      "outputCapture": "std"
    }
  ]
}
```

## 测试

### 后端测试

```bash
cd src/backend

# 运行所有测试
pytest

# 运行特定测试
pytest tests/test_tasks.py

# 显示详细输出
pytest -v

# 显示覆盖率报告
pytest --cov=app --cov-report=html

# 运行属性测试
pytest tests/test_streak.py -v
```

**测试文件结构**
```
tests/
├── conftest.py          # 测试配置和 fixtures
├── test_tasks.py        # 任务 API 测试
├── test_lists.py        # 分类 API 测试
├── test_life_entries.py # 生活记录测试
├── test_stats.py        # 统计 API 测试
└── test_streak.py       # 连胜计算测试
```

### 前端测试

```bash
cd src/frontend

# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 单次运行
npx vitest run

# 覆盖率报告
npx vitest run --coverage
```

**测试文件结构**
```
src/
├── lib/
│   ├── streak.ts
│   └── streak.test.ts    # 单元测试
├── components/
│   └── Button.test.tsx   # 组件测试
└── hooks/
    └── useTasks.test.ts  # Hook 测试
```

## 数据库

### 开发数据库

位置：`src/backend/lifeflow.db`

```bash
# 启动时指定
python run_server.py --db-path ./lifeflow.db
```

### 生产数据库

- **macOS**: `~/Library/Application Support/LifeFlow/lifeflow.db`
- **Windows**: `%APPDATA%/LifeFlow/lifeflow.db`

### 数据库迁移

目前使用 SQLAlchemy 自动创建表结构：

```python
# app/database.py
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
```

### 重置数据库

```bash
cd src/backend

# 删除数据库文件
rm lifeflow.db

# 重新生成测试数据
python seed_data.py --db-path ./lifeflow.db
```

### 查看数据库

使用 DB Browser for SQLite 打开 `lifeflow.db` 文件。

## 常见问题

### 端口被占用

```bash
# 查找占用端口的进程
lsof -i :51731

# 终止进程
kill -9 <PID>
```

### Python 虚拟环境问题

```bash
# 重新创建虚拟环境
rm -rf .venv
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Node 模块问题

```bash
# 清理并重新安装
rm -rf node_modules package-lock.json
npm install
```

### Electron 白屏

1. 检查后端是否正常启动
2. 检查控制台错误信息
3. 尝试重启开发服务器

### 数据库锁定

SQLite 在某些情况下可能被锁定：

```bash
# 检查是否有其他进程访问
lsof lifeflow.db

# 如果有，终止相关进程
```

## 项目结构说明

```
Lifeflow/
├── .github/              # GitHub Actions 配置
│   └── workflows/
│       └── release.yml   # 自动构建发布
├── .kiro/                # Kiro IDE 配置
│   └── steering/         # AI 辅助规则
├── docs/                 # 项目文档
├── src/
│   ├── backend/          # FastAPI 后端
│   │   ├── app/          # 应用代码
│   │   ├── tests/        # 测试代码
│   │   └── ...
│   └── frontend/         # React + Electron 前端
│       ├── electron/     # Electron 主进程
│       ├── src/          # React 应用
│       └── ...
├── .gitignore
├── LICENSE
└── README.md
```

## 开发资源

### 官方文档

- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://react.dev/)
- [Electron](https://www.electronjs.org/docs)
- [TailwindCSS](https://tailwindcss.com/docs)
- [React Query](https://tanstack.com/query/latest)
- [Zustand](https://zustand-demo.pmnd.rs/)

### 设计参考

- [Material Design 3](https://m3.material.io/)
- 主题色：紫色 (#6750A4)
- 圆角风格：大圆角 (0.5rem - 1rem)
