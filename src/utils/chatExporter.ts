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
  time: string;
  sender: string;
  content: string;
  type: string;
  raw: HTMLElement;
}> {
  const chatLog = document.getElementById('TextAreaChatLog');
  if (!chatLog) {
    throw new Error('TextAreaChatLog 元素未找到');
  }
  
  const messages: Array<{
    time: string;
    sender: string;
    content: string;
    type: string;
    raw: HTMLElement;
  }> = [];
  
  // 遍历所有消息元素
  Array.from(chatLog.children).forEach(child => {
    if (child instanceof HTMLElement) {
      const time = child.dataset.time || '';
      const sender = child.dataset.sender || '';
      const type = Array.from(child.classList)
        .find(cls => cls.startsWith('ChatMessage') && cls !== 'ChatMessage')
        ?.replace('ChatMessage', '') || 'Unknown';
      
      // 提取内容
      let content = '';
      
      // 对于Chat类型消息，获取消息内容
      if (type === 'Chat' || type === 'Whisper') {
        const contentElement = child.querySelector('.chat-room-message-content');
        if (contentElement) {
          content = contentElement.textContent || '';
        }
      } else {
        // 对于其他类型消息，获取整个元素的文本（除了metadata）
        const metadata = child.querySelector('.chat-room-metadata');
        if (metadata) {
          const clone = child.cloneNode(true) as HTMLElement;
          const cloneMetadata = clone.querySelector('.chat-room-metadata');
          if (cloneMetadata) {
            cloneMetadata.remove();
            content = clone.textContent || '';
          }
        } else {
          content = child.textContent || '';
        }
      }
      
      content = content.trim();
      
      if (content) {
        messages.push({
          time,
          sender,
          content,
          type,
          raw: child
        });
      }
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
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 生成HTML内容
 */
function generateHTML(messages: Array<{
  time: string;
  sender: string;
  content: string;
  type: string;
  raw: HTMLElement;
}>, includeStyles: boolean): string {
  // 生成消息HTML
  const messagesHTML = messages.map(msg => {
    let cssClass = 'chat-message';
    if (msg.type === 'Action') cssClass += ' chat-message-action';
    if (msg.type === 'Activity') cssClass += ' chat-message-activity';
    if (msg.type === 'Whisper') cssClass += ' chat-message-whisper';
    if (msg.type === 'Chat') cssClass += ' chat-message-chat';
    
    return `
  <div class="${cssClass}">
    <div class="message-header">
      <span class="message-time">${msg.time}</span>
      <span class="message-sender">${msg.sender}</span>
      <span class="message-type">${msg.type}</span>
    </div>
    <div class="message-content">${escapeHTML(msg.content)}</div>
  </div>`;
  }).join('');
  
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
      padding: 0;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .chat-message {
      padding: 16px;
      border-bottom: 1px solid #f0f0f0;
      transition: background-color 0.2s ease;
    }
    
    .chat-message:hover {
      background-color: #f9f9f9;
    }
    
    .chat-message-action {
      background-color: #f8f9fa;
      border-left: 4px solid #6c757d;
    }
    
    .chat-message-activity {
      background-color: #f8fff8;
      border-left: 4px solid #28a745;
    }
    
    .chat-message-whisper {
      background-color: #fffef8;
      border-left: 4px solid #ffc107;
    }
    
    .chat-message-chat {
      background-color: #f8faff;
      border-left: 4px solid #007acc;
    }
    
    .message-header {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      flex-wrap: wrap;
      gap: 12px;
    }
    
    .message-time {
      font-size: 12px;
      color: #666;
      flex-shrink: 0;
    }
    
    .message-sender {
      font-size: 14px;
      font-weight: 600;
      color: #333;
      flex-shrink: 0;
    }
    
    .message-type {
      font-size: 12px;
      color: #999;
      background: #f0f0f0;
      padding: 2px 8px;
      border-radius: 10px;
      flex-shrink: 0;
    }
    
    .message-content {
      font-size: 15px;
      line-height: 1.6;
      color: #333;
      word-wrap: break-word;
      white-space: pre-wrap;
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
      
      .chat-message {
        padding: 12px;
      }
      
      .message-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }
      
      .message-time,
      .message-sender,
      .message-type {
        font-size: 12px;
      }
      
      .message-content {
        font-size: 14px;
      }
    }
  </style>` : ''}
</head>
<body>
  <div class="header">
    <h1>聊天记录导出</h1>
    <p>导出时间: ${new Date().toLocaleString()} | 消息数量: ${messages.length}</p>
  </div>
  <div class="chat-container">
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
  time: string;
  sender: string;
  content: string;
  type: string;
  raw: HTMLElement;
}>): void {
  const textContent = messages.map(msg => {
    return `[${msg.time}] ${msg.sender}: ${msg.content}`;
  }).join('\n');
  
  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chatlog_export_${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 转义HTML特殊字符
 */
function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 检查TextAreaChatLog是否存在
 */
export function isChatLogAvailable(): boolean {
  return document.getElementById('TextAreaChatLog') !== null;
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
