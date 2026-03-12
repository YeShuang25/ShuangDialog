/**
 * 聊天框导出工具
 * 用于导出TextAreaChatLog组件的内容和样式
 */

interface ExportOptions {
  includeStyles?: boolean;
  prettyPrint?: boolean;
  format?: 'html' | 'text';
}

/**
 * 提取聊天消息数据
 */
function extractChatMessages(): Array<{
  raw: HTMLElement;
  type: string;
}> {
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
    format = 'html'
  } = options;
  
  // 查找TextAreaChatLog元素
  const chatLog = document.getElementById('TextAreaChatLog');
  if (!chatLog) {
    throw new Error('TextAreaChatLog 元素未找到');
  }
  
  // 提取消息
  const messages = extractChatMessages();
  
  if (format === 'text') {
    // 导出为纯文本
    exportAsText(messages);
    showExportSuccessNotification();
    return;
  }
  
  // 导出为HTML
  const htmlContent = generateHTML(messages, includeStyles);
  
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
function generateHTML(messages: Array<{
  raw: HTMLElement;
  type: string;
}>, includeStyles: boolean): string {
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
      padding: 20px;
    }
    
    .header {
      background: #007acc;
      color: white;
      padding: 20px;
      border-radius: 8px 8px 0 0;
      margin-bottom: 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
    
    .ChatMessage {
      margin-bottom: 15px;
      padding: 10px;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .ChatMessage:hover {
      background-color: #f9f9f9;
    }
    
    .chat-room-metadata {
      display: inline-block;
      margin-right: 10px;
    }
    
    .chat-room-time {
      color: #666;
      font-size: 12px;
    }
    
    .chat-room-sender {
      color: #666;
      font-size: 12px;
    }
    
    .ChatMessageName {
      font-weight: 600;
      margin-right: 5px;
      color: var(--label-color, #333);
    }
    
    .chat-room-message-content {
      color: #333;
      font-size: 14px;
      line-height: 1.4;
    }
    
    .chat-room-message-original {
      color: #666;
      font-size: 13px;
      font-style: italic;
      margin-top: 5px;
      display: block;
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
    }
  </style>` : ''}
</head>
<body>
  <div class="header">
    <h1>聊天记录导出</h1>
    <p>导出时间: ${new Date().toLocaleString()} | 消息数量: ${messages.length}</p>
  </div>
  <div class="chat-container" id="TextAreaChatLog">
${messagesHTML}
  </div>
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
