# 代码统计

本文档记录 LifeFlow 项目的代码行数统计信息。

> 统计不包含测试代码、类型声明文件、node_modules 和 .venv 等依赖目录。

## 总览

| 分类 | 行数 |
|------|------|
| 前端 TypeScript/TSX | 11,377 |
| 前端 CSS | 146 |
| 后端 Python | 2,619 |
| **总计** | **14,142** |

## 前端详细分类

| 模块 | 行数 | 说明 |
|------|------|------|
| React 组件 | 4,929 | `src/components/` 下的 UI 组件库 |
| 页面组件 | 1,884 | `src/pages/` 下的 6 个页面 |
| Electron 主进程 | 1,483 | `electron/` 窗口管理、后端进程管理 |
| 工具库 | 1,375 | `src/lib/` 日期、统计、连胜计算等 |
| API 客户端 | 749 | `src/api/` HTTP 请求封装 |
| Hooks | 689 | `src/hooks/` 数据管理 Hooks |
| CSS | 146 | `src/styles/` 全局样式 |

### 组件分布

```
components/
├── ui/          ~700 行   基础 UI 组件
├── task/        ~800 行   任务相关组件
├── habit/       ~900 行   习惯相关组件
├── life/        ~600 行   生活记录组件
├── layout/      ~1000 行  布局组件
├── category/    ~600 行   分类管理组件
├── stats/       ~200 行   统计组件
└── common/      ~300 行   通用组件
```

## 后端详细分类

| 模块 | 行数 | 说明 |
|------|------|------|
| API 路由 | 1,136 | `app/api/` 6 个 API 模块 |
| Schemas | 291 | `app/schemas/` Pydantic 数据模式 |
| 数据模型 | 108 | `app/models/` SQLAlchemy 模型 |
| 服务层 | ~200 | `app/services/` 业务逻辑 |
| 配置/数据库 | ~300 | `app/config.py`, `app/database.py` |
| 启动脚本 | ~600 | `run_server.py`, `seed_data.py` 等 |

### API 路由分布

```
api/
├── tasks.py          ~350 行   任务 API
├── lists.py          ~150 行   分类 API
├── life_entries.py   ~200 行   生活记录 API
├── notifications.py  ~200 行   通知 API
├── stats.py          ~150 行   统计 API
└── settings.py       ~100 行   设置 API
```

## 统计命令

如需重新统计，可使用以下命令：

```bash
# 前端 TypeScript/TSX (不含测试和类型声明)
find src/frontend -type f \( -name "*.ts" -o -name "*.tsx" \) \
  ! -path "*/node_modules/*" \
  ! -name "*.test.ts" ! -name "*.test.tsx" ! -name "*.d.ts" \
  -exec wc -l {} + | tail -1

# 前端 CSS
find src/frontend -type f -name "*.css" \
  ! -path "*/node_modules/*" \
  -exec wc -l {} + | tail -1

# 后端 Python (不含测试)
find src/backend -type f -name "*.py" \
  ! -path "*/.venv/*" ! -path "*/__pycache__/*" \
  ! -name "test_*.py" \
  -exec wc -l {} + | tail -1
```

---

*最后更新：2025-12-20*
