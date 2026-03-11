// 主入口文件 - 油猴脚本入口
// 负责初始化核心和挂载React应用

import { initCore } from './core/socket';
import { initChatMonitor } from './core/chatMonitor';
import { createRoot } from 'react-dom/client';
import { ChatPanel } from './ui/pages/ChatPanel';
import './ui/style.css';
import { debug } from './store/useDebugStore';

// 油猴脚本入口函数
function main() {
  // 初始化核心层
  initCore();
  
  // 初始化聊天监控
  initChatMonitor();
  
  // 创建React根节点
  const container = document.createElement('div');
  container.id = 'shuang-dialog-root';
  document.body.appendChild(container);
  
  const root = createRoot(container);
  root.render(<ChatPanel />);
  
  debug.log('[ShuangDialog] 插件已启动');
}

// 确保DOM加载完成后启动
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
