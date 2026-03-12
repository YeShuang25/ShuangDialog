/**
 * 聊天框导出工具
 * 用于导出TextAreaChatLog组件的内容和样式
 */

interface ExportOptions {
  includeStyles?: boolean;
  prettyPrint?: boolean;
  format?: 'html' | 'text';
  includeWhisper?: boolean;
  includePrivate?: boolean;
}



/**
 * 提取聊天消息数据
 */
function extractChatMessages(options: ExportOptions = {}): Array<{
  raw: HTMLElement;
  type: string;
}> {
  const { includeWhisper = true, includePrivate = true } = options;
  const chatLog = document.getElementById('TextAreaChatLog');
  if (!chatLog) {
    throw new Error('TextAreaChatLog 元素未找到');
  }
  
  const messages: Array<{
    raw: HTMLElement;
    type: string;
  }> = [];
  
  // 遍历所有消息元素
  Array.from(chatLog.children).forEach(child => {
    if (child instanceof HTMLElement) {
      const type = Array.from(child.classList)
        .find(cls => cls.startsWith('ChatMessage') && cls !== 'ChatMessage')
        ?.replace('ChatMessage', '') || 'Unknown';
      
      // 检查是否需要过滤隐私消息
      if (!includeWhisper && type === 'Whisper') {
        return;
      }
      if (!includePrivate && (type === 'LocalMessage' || type === 'Beep')) {
        return;
      }
      
      messages.push({
        raw: child,
        type
      });
    }
  });
  
  return messages;
}

/**
 * 导出聊天框为HTML文件（优化版本）
 */
export function exportChatLogAsHTML(options: ExportOptions = {}): void {
  const {
    includeStyles = true,
    format = 'html',
    includeWhisper = true,
    includePrivate = true
  } = options;
  
  // 查找TextAreaChatLog元素
  const chatLog = document.getElementById('TextAreaChatLog');
  if (!chatLog) {
    throw new Error('TextAreaChatLog 元素未找到');
  }
  
  // 提取消息
  const messages = extractChatMessages({ includeWhisper, includePrivate });
  
  if (format === 'text') {
    // 导出为纯文本
    exportAsText(messages);
    showExportSuccessNotification();
    return;
  }
  
  // 导出为HTML
  const htmlContent = generateHTML(messages, includeStyles, { includeWhisper, includePrivate });
  
  // 创建下载链接
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chatlog_export_${Date.now()}.html`;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  // 显示成功提示
  showExportSuccessNotification();
}

/**
 * 生成HTML内容
 */
function generateHTML(
  messages: Array<{
    raw: HTMLElement;
    type: string;
  }>,
  includeStyles: boolean,
  options: { includeWhisper: boolean; includePrivate: boolean }
): string {
  const { includeWhisper, includePrivate } = options;
  
  // 生成消息HTML，处理消息结构
  const messagesHTML = messages.map(msg => {
    // 克隆元素以避免修改原始DOM
    const clone = msg.raw.cloneNode(true) as HTMLElement;
    
    // 移除menubar元素（包含重复的时间戳和玩家ID）
    const menubar = clone.querySelector('.menubar');
    if (menubar) {
      menubar.remove();
    }
    
    // 处理时间和玩家ID之间的空格
    const metadata = clone.querySelector('.chat-room-metadata');
    if (metadata) {
      const time = metadata.querySelector('.chat-room-time');
      const sender = metadata.querySelector('.chat-room-sender');
      if (time && sender) {
        // 在时间和发送者之间添加空格
        const space = document.createTextNode(' ');
        time.parentNode?.insertBefore(space, sender);
      }
    }
    
    const rawHTML = clone.outerHTML;
    return `  ${rawHTML}`;
  }).join('\n');
  
  // 生成过滤提示
  const filterNotice = [];
  if (!includeWhisper) filterNotice.push('已过滤悄悄话');
  if (!includePrivate) filterNotice.push('已过滤私聊');
  const filterText = filterNotice.length > 0 ? ` (${filterNotice.join('、')})` : '';
  
  // 生成完整HTML
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>聊天记录 - ${new Date().toLocaleString()}</title>
  ${includeStyles ? `
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #f5f5f5;
      color: #333;
      padding: 20px;
      transition: background-color 0.3s ease, color 0.3s ease;
    }
    
    body.dark-mode {
      background-color: #1a1a1a;
      color: #e0e0e0;
    }
    
    .header {
      background: #007acc;
      color: white;
      padding: 20px;
      border-radius: 8px 8px 0 0;
      margin-bottom: 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    body.dark-mode .header {
      background: #005a9e;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    
    .header h1 {
      font-size: 24px;
      margin-bottom: 10px;
      font-weight: 600;
    }
    
    .header p {
      font-size: 14px;
      opacity: 0.9;
    }
    
    .chat-container {
      background: white;
      border: 1px solid #ddd;
      border-radius: 0 0 8px 8px;
      padding: 20px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    body.dark-mode .chat-container {
      background: #2d2d2d;
      border: 1px solid #444;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    
    .ChatMessage {
      margin-bottom: 15px;
      padding: 10px;
      border-bottom: 1px solid #f0f0f0;
    }
    
    body.dark-mode .ChatMessage {
      border-bottom: 1px solid #444;
    }
    
    .ChatMessage:hover {
      background-color: #f9f9f9;
    }
    
    body.dark-mode .ChatMessage:hover {
      background-color: #3a3a3a;
    }
    
    .chat-room-metadata {
      display: inline-block;
      margin-right: 10px;
      min-width: 100px;
    }
    
    .chat-room-time {
      color: #666;
      font-size: 12px;
    }
    
    body.dark-mode .chat-room-time {
      color: #999;
    }
    
    .chat-room-sender {
      color: #666;
      font-size: 12px;
    }
    
    body.dark-mode .chat-room-sender {
      color: #999;
    }
    
    .ChatMessageName {
      font-weight: 500;
      margin-right: 5px;
      color: var(--label-color, #333);
      text-shadow: 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000;
    }
    
    body.dark-mode .ChatMessageName {
      font-weight: 500;
      text-shadow: 1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff;
    }
    
    .chat-room-message-content {
      color: #333;
      font-size: 14px;
      line-height: 1.4;
    }
    
    body.dark-mode .chat-room-message-content {
      color: #e0e0e0;
    }
    
    .chat-room-message-original {
      color: #666;
      font-size: 13px;
      font-style: italic;
      margin-top: 5px;
      display: block;
      margin-left: 110px;
    }
    
    body.dark-mode .chat-room-message-original {
      color: #999;
    }
    
    .menubar {
      display: none;
    }
    
    .HideOnPopup {
      display: inline-block;
    }
    
    .blank-button {
      background: none;
      border: none;
      padding: 0;
      margin: 0;
      cursor: pointer;
    }
    
    .button-tooltip {
      display: none;
    }
    
    .theme-toggle {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #007acc;
      color: white;
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 1000;
    }
    
    body.dark-mode .theme-toggle {
      background: #005a9e;
    }
    
    @media (max-width: 768px) {
      body {
        padding: 10px;
      }
      
      .header {
        padding: 15px;
      }
      
      .header h1 {
        font-size: 20px;
      }
      
      .chat-container {
        padding: 10px;
      }
      
      .ChatMessage {
        padding: 8px;
      }
      
      .chat-room-metadata {
        min-width: 80px;
      }
      
      .chat-room-message-original {
        margin-left: 90px;
      }
    }
  </style>` : ''}
</head>
<body>
  <button class="theme-toggle" onclick="toggleTheme()">🌙</button>
  <div class="header">
    <h1>聊天记录导出</h1>
    <p>导出时间: ${new Date().toLocaleString()} | 消息数量: ${messages.length}${filterText}</p>
  </div>
  <div class="chat-container" id="TextAreaChatLog">
${messagesHTML}
  </div>
  <script>
    // 暗色模式切换
    function toggleTheme() {
      const body = document.body;
      body.classList.toggle('dark-mode');
      const button = document.querySelector('.theme-toggle');
      if (body.classList.contains('dark-mode')) {
        button.textContent = '☀️';
        localStorage.setItem('chat-log-theme', 'dark');
      } else {
        button.textContent = '🌙';
        localStorage.setItem('chat-log-theme', 'light');
      }
    }
    
    // 加载保存的主题
    document.addEventListener('DOMContentLoaded', function() {
      const savedTheme = localStorage.getItem('chat-log-theme');
      if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        const button = document.querySelector('.theme-toggle');
        if (button) {
          button.textContent = '☀️';
        }
      }
    });
  </script>
</body>
</html>`;
  
  return html;
}

/**
 * 导出为纯文本
 */
function exportAsText(messages: Array<{
  raw: HTMLElement;
  type: string;
}>): void {
  const textContent = messages.map(msg => {
    const time = msg.raw.dataset.time || '';
    const sender = msg.raw.dataset.sender || '';
    const content = msg.raw.textContent || '';
    return `[${time}] ${sender}: ${content}`;
  }).join('\n');

  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chatlog_export_${Date.now()}.txt`;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 检查TextAreaChatLog是否存在
 */
export function isChatLogAvailable(): boolean {
  return document.getElementById('TextAreaChatLog') !== null;
}

/**
 * 显示导出成功通知
 */
function showExportSuccessNotification(): void {
  const notification = document.createElement('div');
  notification.textContent = '聊天记录导出成功！';
  notification.style.cssText = `
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #28a745;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    font-size: 14px;
    font-weight: 500;
    z-index: 10002;
    opacity: 0;
    transition: opacity 0.3s ease-out;
    pointer-events: none;
    max-width: 80%;
    text-align: center;
  `;
  
  document.body.appendChild(notification);
  
  requestAnimationFrame(() => {
    notification.style.opacity = '1';
  });
  
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

/**
 * 获取聊天框统计信息
 */
export function getChatLogStats(): {
  totalMessages: number;
  messageTypes: Record<string, number>;
  totalCharacters: number;
} | null {
  const chatLog = document.getElementById('TextAreaChatLog');
  if (!chatLog) return null;
  
  const messages = chatLog.querySelectorAll('.ChatMessage');
  const messageTypes: Record<string, number> = {};
  let totalCharacters = 0;
  
  messages.forEach(msg => {
    const type = Array.from(msg.classList)
      .find(cls => cls.startsWith('ChatMessage') && cls !== 'ChatMessage')
      ?.replace('ChatMessage', '') || 'Unknown';
    
    messageTypes[type] = (messageTypes[type] || 0) + 1;
    totalCharacters += msg.textContent?.length || 0;
  });
  
  return {
    totalMessages: messages.length,
    messageTypes,
    totalCharacters
  };
}

/**
 * 显示导出选项对话框
 */
export function showExportOptionsDialog(): void {
  // 创建遮罩层
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  
  // 创建对话框
  const dialog = document.createElement('div');
  dialog.style.cssText = `
    background: white;
    border-radius: 8px;
    padding: 24px;
    width: 320px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  `;
  
  dialog.innerHTML = `
    <h3 style="margin: 0 0 16px 0; font-size: 18px; color: #333;">导出聊天记录</h3>
    <div style="margin-bottom: 16px;">
      <label style="display: flex; align-items: center; margin-bottom: 12px; cursor: pointer;">
        <input type="checkbox" id="include-whisper" checked style="margin-right: 8px;">
        <span style="color: #333; font-size: 14px;">包含悄悄话</span>
      </label>
      <label style="display: flex; align-items: center; margin-bottom: 12px; cursor: pointer;">
        <input type="checkbox" id="include-private" checked style="margin-right: 8px;">
        <span style="color: #333; font-size: 14px;">包含私聊消息</span>
      </label>
    </div>
    <div style="display: flex; gap: 8px; justify-content: flex-end;">
      <button id="cancel-export" style="
        padding: 8px 16px;
        border: 1px solid #ddd;
        background: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      ">取消</button>
      <button id="confirm-export" style="
        padding: 8px 16px;
        border: none;
        background: #007acc;
        color: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      ">导出</button>
    </div>
  `;
  
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  
  // 绑定事件
  const cancelBtn = dialog.querySelector('#cancel-export');
  const confirmBtn = dialog.querySelector('#confirm-export');
  const whisperCheckbox = dialog.querySelector('#include-whisper') as HTMLInputElement;
  const privateCheckbox = dialog.querySelector('#include-private') as HTMLInputElement;
  
  cancelBtn?.addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
  
  confirmBtn?.addEventListener('click', () => {
    const includeWhisper = whisperCheckbox?.checked ?? true;
    const includePrivate = privateCheckbox?.checked ?? true;
    
    try {
      exportChatLogAsHTML({
        includeStyles: true,
        format: 'html',
        includeWhisper,
        includePrivate
      });
    } catch (error) {
      console.error('[ShuangDialog] 导出失败:', error);
      alert('导出失败：' + (error as Error).message);
    }
    
    document.body.removeChild(overlay);
  });
  
  // 点击遮罩关闭
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  });
}
