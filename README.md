# 霜语

一个基于 React + TypeScript 的游戏聊天增强插件，专为油猴脚本设计。

## 📦 安装教程

### 油猴脚本安装

**方法一：一键安装（推荐）**
1. 点击这个链接：[https://raw.githubusercontent.com/YeShuang25/ShuangDialog/main/loader.user.js](https://raw.githubusercontent.com/YeShuang25/ShuangDialog/main/loader.user.js)
2. Tampermonkey 会自动弹出安装界面
3. 点击 **安装** 完成

**方法二：手动安装**
1. 点击这里下载脚本：[`loader.user.js`](loader.user.js)
2. 打开 Tampermonkey 管理面板
3. 点击 **添加新脚本**
4. 将下载的脚本内容粘贴进去
5. 保存并刷新游戏页面

### 安装验证

安装完成后：
- 刷新游戏页面
- 打开浏览器控制台
- 如果看到 `[ShuangDialog Loader] ShuangDialog Loader 启动` 说明安装成功

## ✨ 功能介绍

### 悬浮球菜单

- 点击悬浮球打开/关闭菜单面板
- 点击其他区域不会关闭菜单，方便操作
- 菜单包含各种功能开关和设置

### 霜语文本框

霜语是一个独立的聊天文本框，用于显示你关注的玩家消息。

**基本操作：**
- **开启/关闭**：在悬浮球菜单中切换"霜语"开关
- **调整高度**：拖动霜语底部的拖动条调整霜语和游戏文本框的高度比例
- **折叠霜语**：将拖动条拖到最顶端，霜语会自动折叠，只保留拖动条
- **展开霜语**：向下拖动拖动条即可展开
- **自适应大小**：霜语的标题栏、拖动条高度会随游戏窗口大小自动缩放

**特别关注功能：**
- 在悬浮球菜单中点击"玩家ID配置"
- 输入你想关注的玩家ID
- 该玩家的所有消息都会显示在霜语中

**消息类型过滤：**
每个关注的玩家可以独立配置监听的消息类型：
- **对话**：普通聊天消息
- **Emote**：表情消息
- **动作**：活动消息（如互动动作）
- **其他**：其他类型消息
- **全选**：一键开启/关闭所有类型

**内容匹配：**
- 开启"匹配"后，当其他玩家发送的消息中包含该玩家的名字或昵称时，也会被捕获
- 适用于监控其他玩家与关注玩家的互动

**全局关键字：**
- 在配置界面顶部设置全局关键字
- 任何消息中包含这些关键字都会被捕获
- 与玩家内容匹配独立工作

**字体调整：**
- 在霜语标题栏右侧有字体倍数输入框
- 输入 0.5-2.0 之间的数值调整字体大小
- 设置会自动保存

**💡 推荐设置：**

为了筛选出所有与自己有关的消息，建议按以下方式配置：

1. **关注自己**：
   - 添加自己的玩家ID到关注列表
   - 排除自己的对话、Emote、动作和其他（设为"排除"状态）
   - 打开自己的"匹配"选项

2. **设置全局关键字**：
   - 在全局关键字中填上他人经常叫你的外号或别名
   - 这样任何包含这些称呼的消息都会被捕获

3. **关注其他玩家**：
   - 对于想要关注的玩家，勾选上所有分类即可
   - 开启"匹配"可以捕获其他玩家与TA的互动

**效果说明：**
- 自己发的消息不会重复显示（已排除）
- 任何提到你名字、昵称或外号的消息都会被捕获
- 关注的玩家消息正常显示

### 聊天记录导出

- 在悬浮球菜单中点击"导出聊天记录"
- 支持导出为 HTML 或 TXT 格式
- 可选择是否包含私聊和悄悄话内容
- 支持暗色模式导出
- 保留玩家名字的原始颜色

### 消息过滤

- 支持过滤特定频道的消息
- 支持过滤特定玩家的消息
- 支持关键词过滤

## 🛠️ 开发相关

### 项目架构

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
│   │   ├── components/      # 基础组件
│   │   │   └── FloatingWindow.tsx # 悬浮窗口组件 (拖拽、调整大小、最小化)
│   │   ├── pages/           # 页面/面板
│   │   │   └── ChatPanel.tsx # 聊天面板 (使用 FloatingWindow)
│   │   └── style.css        # 样式文件
│   │
│   └── utils/               # 工具函数
│       ├── logger.ts        # 日志工具 (调试用)
│       └── helper.ts
│
├── loader.user.js            # 油猴脚本 loader 文件
├── vite.config.ts           # Vite 配置
├── package.json
├── tsconfig.json
└── README.md
```

### 技术栈

- **前端框架**：React 18 + TypeScript
- **状态管理**：Zustand
- **构建工具**：Vite
- **样式**：CSS + CSS-in-JS
- **油猴脚本**：Tampermonkey API

### 快速开始

#### 安装依赖

```bash
npm install
```

#### 开发模式

```bash
npm run dev
```

#### 构建生产版本

```bash
npm run build
```

### 部署到 GitHub Pages

#### 1. 推送代码到 GitHub

```bash
# 确保代码已推送到 main 分支
git push origin main
```

#### 2. 配置 GitHub Pages

1. **打开 GitHub 仓库**：访问 `https://github.com/YeShuang25/ShuangDialog`

2. **进入 Settings**：点击仓库右上角的 **Settings** 标签

3. **找到 Pages 设置**：
   - 在左侧菜单中找到 **Pages**
   - 在 **Source** 部分选择：
     - **Branch**: `gh-pages`
     - **Folder**: `/(root)` （选择根目录）
   - 点击 **Save** 保存

4. **等待部署完成**：
   - GitHub 会显示 "Your site is publishing..."
   - 等待 1-5 分钟，页面会显示：
     ```
     Your site is live at https://yeshuang25.github.io/ShuangDialog/
     ```

#### 3. 验证部署

打开浏览器访问：`https://yeshuang25.github.io/ShuangDialog/dist/main.js`

如果能看到 JavaScript 代码，说明部署成功。

#### 4. 更新油猴脚本 URL

在 `loader.user.js` 中确认 URL 正确：

```javascript
const CONFIG = {
    BUNDLE_URL: 'https://yeshuang25.github.io/ShuangDialog/dist/main.js',
    // ...
};
```

### 自动部署（推荐）

安装 `gh-pages` 后，可以使用一键部署：

```bash
npm run deploy  # 自动构建并推送到 gh-pages 分支
```

### 开发工作流

#### 本地开发

```bash
# 安装依赖（首次运行）
npm install

# 启动开发服务器
npm run dev
```

#### 代码更新流程

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

如果有重大更新，更新 `loader.user.js` 中的版本号：

```javascript
const CONFIG = {
    VERSION: '1.1.0',  // 递增版本号
    // ...
};
```

### 分支说明

- **`main`**：主开发分支，只包含源代码
- **`gh-pages`**：GitHub Pages 分支，只包含编译后的 `dist/` 文件夹

### 核心设计理念

#### 数据流设计

```
游戏Socket → Core(socket.ts) → Dispatcher(dispatcher.ts) → Modules → Store → UI
```

1. **Core层**：负责与游戏底层Socket连接，获取原始数据
2. **Dispatcher层**：数据分发中心，将数据包路由到对应模块
3. **Module层**：具体业务逻辑处理（聊天解析、过滤、通知等）
4. **Store层**：前端状态管理，响应式更新UI
5. **UI层**：React组件渲染用户界面

#### 模块化优势

- **解耦**：各层职责清晰，便于维护和扩展
- **复用**：模块可以独立使用和测试
- **扩展**：新增功能只需添加对应模块
- **调试**：问题定位更精确

### 常见问题

**Q: 部署后插件不工作？**
A: 检查浏览器控制台是否有 CORS 错误，确保 GitHub Pages URL 正确。

**Q: 本地开发时 Socket 不连接？**
A: Socket Hook 只在实际游戏页面中工作，本地开发时无法测试 Socket 功能。

**Q: 如何使用悬浮窗口？**
A: 
- **拖拽**：点击标题栏拖动窗口到任意位置
- **调整大小**：拖动右下角的调整手柄调整窗口尺寸
- **最小化**：点击黄色圆形按钮(-)最小化到悬浮按钮
- **恢复**：双击悬浮按钮或重新加载页面恢复

**Q: 悬浮窗口不显示？**
A: 检查浏览器是否启用了弹窗拦截，尝试刷新页面或在无痕模式下测试。

**Q: 如何回滚版本？**
A: 使用 `git reset --hard <commit-hash>` 回滚代码，然后重新部署。

### 开发注意事项

1. **Socket连接**：需要根据实际游戏的Socket API调整 `core/socket.ts`
2. **数据格式**：游戏数据包格式需要在 `core/types.ts` 中正确定义
3. **油猴权限**：根据需要申请相应的GM_*权限
4. **跨域问题**：GitHub Pages部署需要考虑CORS配置

## 📄 许可证

MIT License
