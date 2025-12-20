# 部署指南

## 概述

LifeFlow 使用 GitHub Actions 自动构建和发布。支持 macOS (Intel/Apple Silicon) 和 Windows 平台。

## 构建流程

### 自动构建 (GitHub Actions)

当推送带有 `v*` 格式的 tag 时，自动触发构建：

```bash
# 创建并推送 tag
git tag v0.2.1
git push origin v0.2.1
```

构建流程：
1. 检出代码
2. 构建后端可执行文件 (PyInstaller)
3. 构建前端应用 (Vite + Electron Builder)
4. 上传构建产物到 GitHub Releases

### 手动构建

#### 后端构建

```bash
cd src/backend

# 激活虚拟环境
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 安装 PyInstaller
pip install pyinstaller

# 构建
pyinstaller --clean --noconfirm lifeflow.spec
```

输出：`dist/lifeflow-backend`

#### 前端构建

```bash
cd src/frontend

# 安装依赖
npm install

# 构建 React 应用
npm run build

# 构建 Electron 应用
npm run build:electron
```

输出目录：`release/`

## GitHub Actions 配置

### 工作流文件 (`.github/workflows/release.yml`)

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build-backend:
    strategy:
      matrix:
        os: [macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          cd src/backend
          pip install -r requirements.txt
          pip install pyinstaller
      - name: Build backend
        run: |
          cd src/backend
          pyinstaller --clean --noconfirm lifeflow.spec
      - uses: actions/upload-artifact@v4
        with:
          name: backend-${{ matrix.os }}
          path: src/backend/dist/

  build-frontend:
    needs: build-backend
    strategy:
      matrix:
        include:
          - os: macos-latest
            arch: arm64
          - os: macos-latest
            arch: x64
          - os: windows-latest
            arch: x64
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - uses: actions/download-artifact@v4
        with:
          name: backend-${{ matrix.os }}
          path: src/frontend/resources/
      - name: Install dependencies
        run: |
          cd src/frontend
          npm ci
      - name: Build
        run: |
          cd src/frontend
          npm run build:electron -- --${{ matrix.arch }}
      - uses: actions/upload-artifact@v4
        with:
          name: release-${{ matrix.os }}-${{ matrix.arch }}
          path: src/frontend/release/

  release:
    needs: build-frontend
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
      - uses: softprops/action-gh-release@v1
        with:
          files: |
            release-*/*
```

## Electron Builder 配置

### package.json 构建配置

```json
{
  "build": {
    "appId": "com.lifeflow.app",
    "productName": "LifeFlow",
    "directories": {
      "output": "release"
    },
    "files": [
      "dist/**/*",
      "electron/**/*",
      "resources/**/*"
    ],
    "extraResources": [
      {
        "from": "resources/",
        "to": ".",
        "filter": ["**/*"]
      }
    ],
    "mac": {
      "category": "public.app-category.productivity",
      "target": [
        {
          "target": "dmg",
          "arch": ["arm64", "x64"]
        }
      ],
      "icon": "public/icon.icns"
    },
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64"]
        }
      ],
      "icon": "public/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true
    }
  }
}
```

## 发布产物

### macOS

| 文件 | 架构 | 说明 |
|------|------|------|
| `LifeFlow-x.x.x-arm64.dmg` | Apple Silicon | M1/M2/M3 芯片 |
| `LifeFlow-x.x.x-x64.dmg` | Intel | Intel 芯片 |

### Windows

| 文件 | 架构 | 说明 |
|------|------|------|
| `LifeFlow-Setup-x.x.x.exe` | x64 | 64 位 Windows |

## 版本管理

### 版本号规范

采用语义化版本 (Semantic Versioning)：

```
v主版本.次版本.修订版本
v0.2.1
```

- **主版本**: 不兼容的 API 变更
- **次版本**: 向后兼容的功能新增
- **修订版本**: 向后兼容的问题修复

### 发布流程

1. 更新版本号
   ```bash
   # package.json
   npm version patch  # 0.2.0 -> 0.2.1
   npm version minor  # 0.2.1 -> 0.3.0
   npm version major  # 0.3.0 -> 1.0.0
   ```

2. 编写更新日志

3. 创建 tag 并推送
   ```bash
   git tag v0.2.1
   git push origin v0.2.1
   ```

4. 等待 GitHub Actions 构建完成

5. 在 GitHub Releases 页面编辑发布说明

## 代码签名

### macOS 签名 (可选)

需要 Apple Developer 账号：

```bash
# 设置环境变量
export CSC_LINK=path/to/certificate.p12
export CSC_KEY_PASSWORD=your_password
export APPLE_ID=your_apple_id
export APPLE_ID_PASSWORD=app_specific_password

# 构建时自动签名
npm run build:electron
```

### Windows 签名 (可选)

需要代码签名证书：

```bash
# 设置环境变量
export WIN_CSC_LINK=path/to/certificate.pfx
export WIN_CSC_KEY_PASSWORD=your_password

# 构建时自动签名
npm run build:electron
```

## 自动更新 (未来计划)

### Electron Updater 配置

```typescript
// electron/updater.ts
import { autoUpdater } from 'electron-updater'

autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'DabRlin',
  repo: 'Lifeflow',
})

autoUpdater.checkForUpdatesAndNotify()
```

### 更新流程

1. 应用启动时检查更新
2. 下载新版本
3. 提示用户安装
4. 重启应用完成更新

## 故障排除

### 构建失败

**PyInstaller 错误**
```bash
# 清理构建缓存
rm -rf build dist
pyinstaller --clean --noconfirm lifeflow.spec
```

**Electron Builder 错误**
```bash
# 清理缓存
rm -rf release node_modules/.cache
npm run build:electron
```

### 应用无法启动

1. 检查后端可执行文件是否存在
2. 检查日志文件
   - macOS: `~/Library/Logs/LifeFlow/`
   - Windows: `%APPDATA%/LifeFlow/logs/`

### 数据库问题

生产环境数据库位置：
- macOS: `~/Library/Application Support/LifeFlow/lifeflow.db`
- Windows: `%APPDATA%/LifeFlow/lifeflow.db`

```bash
# 备份数据库
cp ~/Library/Application\ Support/LifeFlow/lifeflow.db ~/Desktop/lifeflow-backup.db
```

## 监控和日志

### 日志位置

**macOS**
```
~/Library/Logs/LifeFlow/
├── main.log      # 主进程日志
├── renderer.log  # 渲染进程日志
└── backend.log   # 后端日志
```

**Windows**
```
%APPDATA%/LifeFlow/logs/
├── main.log
├── renderer.log
└── backend.log
```

### 日志级别

```typescript
// electron/logger.ts
const logger = {
  error: (msg: string) => log.error(msg),
  warn: (msg: string) => log.warn(msg),
  info: (msg: string) => log.info(msg),
  debug: (msg: string) => log.debug(msg),
}
```

## 回滚

如果新版本有问题，用户可以：

1. 从 GitHub Releases 下载旧版本
2. 卸载当前版本
3. 安装旧版本

数据库文件会保留，数据不会丢失。
