/**
 * 聊天框导出工具
 * 用于导出TextAreaChatLog组件的内容和样式
 */

interface ExportOptions {
  includeStyles?: boolean;
  includeInlineStyles?: boolean;
  prettyPrint?: boolean;
}

/**
 * 递归克隆元素及其子元素，保留内容
 */
function cloneElementWithContent(element: HTMLElement): HTMLElement {
  const clone = element.cloneNode(false) as HTMLElement;
  
  // 保留所有属性
  Array.from(element.attributes).forEach(attr => {
    clone.setAttribute(attr.name, attr.value);
  });
  
  // 递归克隆子元素
  Array.from(element.childNodes).forEach(child => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      clone.appendChild(cloneElementWithContent(child as HTMLElement));
    } else if (child.nodeType === Node.TEXT_NODE) {
      clone.appendChild(child.cloneNode(true));
    }
  });
  
  return clone;
}

/**
 * 获取所有相关的CSS样式表
 */
function getRelatedStylesheets(): string[] {
  const styles: string[] = [];
  
  // 获取所有样式表
  Array.from(document.styleSheets).forEach(sheet => {
    try {
      if (sheet.cssRules) {
        Array.from(sheet.cssRules).forEach(rule => {
          if (rule instanceof CSSStyleRule) {
            // 只保留与聊天相关的样式
            const selector = rule.selectorText;
            if (selector && (
              selector.includes('chat') ||
              selector.includes('Chat') ||
              selector.includes('message') ||
              selector.includes('Message') ||
              selector.includes('TextAreaChatLog') ||
              selector.includes('scroll-box')
            )) {
              styles.push(rule.cssText);
            }
          }
        });
      }
    } catch (e) {
      // 跨域样式表无法访问，忽略
    }
  });
  
  return styles;
}

/**
 * 格式化HTML字符串，添加缩进和换行
 */
function formatHTML(html: string): string {
  let formatted = '';
  let indent = 0;
  const tab = '  ';
  
  // 分割HTML标签
  const tokens = html.split(/(<\/?[^>]+>)/g).filter(token => token.trim());
  
  tokens.forEach(token => {
    const isClosingTag = token.match(/^<\/\w/);
    const isSelfClosing = token.match(/\/>$/);
    const isOpeningTag = token.match(/^<\w/) && !isSelfClosing && !token.match(/<\w[^>]*\/>/);
    
    // 如果是结束标签，先减少缩进
    if (isClosingTag) {
      indent = Math.max(0, indent - 1);
    }
    
    // 添加换行和缩进
    if (formatted) {
      formatted += '\n' + tab.repeat(indent);
    }
    
    // 添加token
    formatted += token;
    
    // 如果是开始标签，增加缩进
    if (isOpeningTag && !isSelfClosing) {
      indent++;
    }
  });
  
  return formatted;
}

/**
 * 导出聊天框为HTML文件
 */
export function exportChatLogAsHTML(options: ExportOptions = {}): void {
  const {
    includeStyles = true,
    prettyPrint = true
  } = options;
  
  // 查找TextAreaChatLog元素
  const chatLog = document.getElementById('TextAreaChatLog');
  if (!chatLog) {
    throw new Error('TextAreaChatLog 元素未找到');
  }
  
  // 克隆元素
  const clonedChatLog = cloneElementWithContent(chatLog);
  
  // 获取相关样式
  const relatedStyles = getRelatedStylesheets();
  
  // 创建完整的HTML文档
  const fullHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>聊天框导出 - ${new Date().toLocaleString()}</title>
  ${includeStyles && relatedStyles.length > 0 ? `
  <style>
${relatedStyles.map(s => '    ' + s).join('\n')}
  </style>` : ''}
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 20px;
      padding: 0;
      background-color: #f5f5f5;
    }
    .export-info {
      background: #007acc;
      color: white;
      padding: 10px;
      margin-bottom: 20px;
      border-radius: 4px;
    }
    .export-info h1 {
      margin: 0 0 5px 0;
      font-size: 18px;
    }
    .export-info p {
      margin: 0;
      font-size: 12px;
      opacity: 0.9;
    }
    #TextAreaChatLog {
      background-color: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 10px;
      max-height: 80vh;
      overflow-y: auto;
    }
  </style>
</head>
<body>
  <div class="export-info">
    <h1>聊天框导出</h1>
    <p>导出时间: ${new Date().toLocaleString()} | 元素ID: TextAreaChatLog | 消息数量: ${chatLog.children.length}</p>
  </div>
  ${clonedChatLog.outerHTML}
</body>
</html>`;
  
  // 格式化HTML
  let formattedHTML = fullHTML;
  if (prettyPrint) {
    formattedHTML = formatHTML(fullHTML);
  }
  
  // 创建下载链接
  const blob = new Blob([formattedHTML], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chatlog_export_${Date.now()}.html`;
  a.click();
  URL.revokeObjectURL(url);
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
