# ShuangDialog（霜语）

一个基于 React + TypeScript 的游戏聊天增强插件，专为油猴脚本设计。

## 项目架构

```
ShuangDialog/
├── public/
│   └── manifest.json        # 如果是浏览器插件需要的配置
├── src/
│   ├── main.tsx             # 插件入口：负责初始化 Core 和挂载 React App
│   │
│   ├── core/                # 【核心层】与游戏底层交互
│   │   ├── socket.ts        # Socket Hook 逻辑
│   │   ├── dispatcher.ts    # 数据分发中心
│   │   └── types.ts         # 游戏数据包的类型定义
│   │
│   ├── modules/             # 【模块层】具体的业务逻辑
│   │   ├── chat/            # 聊天模块
│   │   │   ├── parser.ts    # 解析聊天数据包
│   │   │   └── filter.ts    # 敏感词过滤/频道过滤
│   │   └── notification/    # 通知模块
│   │       └── notify.ts
│   │
│   ├── store/               # 【状态层】前端数据状态
│   │   ├── useChatStore.ts  # Zustand 存储聊天记录
│   │   └── useSettingStore.ts # 存储用户设置
│   │
│   ├── ui/                  # 【视图层】React 前端
│   │   ├── components/      # 基础组件 (气泡、输入框、滚动容器)
│   │   ├── pages/           # 页面/面板
│   │   │   └── ChatPanel.tsx
│   │   └── style.css        # 样式文件
│   │
│   └── utils/               # 工具函数
│       ├── logger.ts        # 日志工具 (调试用)
│       └── helper.ts
│
├── userscript.js            # 油猴脚本 loader 文件
├── vite.config.ts           # Vite 配置
├── package.json
├── tsconfig.json
└── README.md
```

## 核心特性

- **模块化架构**：核心层、模块层、状态层、视图层清晰分离
- **实时数据监听**：基于 Socket Hook 的游戏数据监听中枢
- **智能过滤系统**：支持频道、用户、关键词、正则表达式过滤
- **通知系统**：浏览器通知集成，支持私聊和提及提醒
- **状态管理**：使用 Zustand 进行轻量级状态管理
- **油猴脚本支持**：专门为 Tampermonkey 优化的加载器

## 技术栈

- **前端框架**：React 18 + TypeScript
- **状态管理**：Zustand
- **构建工具**：Vite
- **样式**：CSS + CSS-in-JS
- **油猴脚本**：Tampermonkey API

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 部署到 GitHub Pages

1. 构建项目：`npm run build`
2. 将 `dist` 目录内容推送到 `gh-pages` 分支
3. 更新 `userscript.js` 中的 `BUNDLE_URL` 配置

### 安装油猴脚本

1. 安装 Tampermonkey 扩展
2. 将 `userscript.js` 内容复制到 Tampermonkey
3. 根据实际游戏域名修改 `@match` 配置
4. 更新 GitHub Pages URL

## 开发工作流

### 本地开发

```bash
# 安装依赖（首次运行）
npm install

# 启动开发服务器
npm run dev
```

### 代码更新流程

每次修改代码后，按以下步骤发布更新：

#### 1. 提交代码到 main 分支

```bash
# 添加所有修改的文件
git add .

# 提交代码（请写清楚的提交信息）
git commit -m "feat: 添加新功能"  # 或 "fix: 修复bug" 或 "docs: 更新文档"

# 推送到 GitHub main 分支
git push origin main
```

#### 2. 构建并部署到 GitHub Pages

```bash
# 一键构建并部署（推荐）
npm run deploy

# 或者手动执行：
# npm run build
# git subtree push --prefix dist origin gh-pages
```

#### 3. 验证部署

1. 等待 GitHub Pages 部署完成（通常 1-5 分钟）
2. 访问：`https://yeshuang25.github.io/ShuangDialog/dist/main.js`
3. 确认文件可以正常访问

#### 4. 更新版本号（可选）

如果有重大更新，更新 `userscript.js` 中的版本号：

```javascript
const CONFIG = {
    VERSION: '1.1.0',  // 递增版本号
    // ...
};
```

### 分支说明

- **`main`**：主开发分支，只包含源代码
- **`gh-pages`**：GitHub Pages 分支，只包含编译后的 `dist/` 文件夹

### 常见问题

**Q: 部署后插件不工作？**
A: 检查浏览器控制台是否有 CORS 错误，确保 GitHub Pages URL 正确。

**Q: 本地开发时 Socket 不连接？**
A: Socket Hook 只在实际游戏页面中工作，本地开发时无法测试 Socket 功能。

**Q: 如何回滚版本？**
A: 使用 `git reset --hard <commit-hash>` 回滚代码，然后重新部署。

## 核心设计理念

### 数据流设计

```
游戏Socket → Core(socket.ts) → Dispatcher(dispatcher.ts) → Modules → Store → UI
```

1. **Core层**：负责与游戏底层Socket连接，获取原始数据
2. **Dispatcher层**：数据分发中心，将数据包路由到对应模块
3. **Module层**：具体业务逻辑处理（聊天解析、过滤、通知等）
4. **Store层**：前端状态管理，响应式更新UI
5. **UI层**：React组件渲染用户界面

### 模块化优势

- **解耦**：各层职责清晰，便于维护和扩展
- **复用**：模块可以独立使用和测试
- **扩展**：新增功能只需添加对应模块
- **调试**：问题定位更精确

## 开发注意事项

1. **Socket连接**：需要根据实际游戏的Socket API调整 `core/socket.ts`
2. **数据格式**：游戏数据包格式需要在 `core/types.ts` 中正确定义
3. **油猴权限**：根据需要申请相应的GM_*权限
4. **跨域问题**：GitHub Pages部署需要考虑CORS配置

## 许可证

MIT License
