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
 * 递归为元素添加内联样式
 */
function addInlineStyles(element: HTMLElement, includeChildren = true): void {
  const computedStyle = window.getComputedStyle(element);
  const styles: string[] = [];
  
  // 重要的CSS属性
  const importantProperties = [
    'display', 'position', 'top', 'left', 'right', 'bottom',
    'width', 'height', 'margin', 'padding', 'border',
    'background', 'color', 'font', 'text-align',
    'overflow', 'visibility', 'opacity', 'z-index'
  ];
  
  importantProperties.forEach(prop => {
    const value = computedStyle.getPropertyValue(prop);
    if (value && value !== 'none' && value !== 'auto' && value !== 'normal') {
      styles.push(`${prop}: ${value}`);
    }
  });
  
  if (styles.length > 0) {
    element.setAttribute('style', styles.join('; '));
  }
  
  if (includeChildren) {
    Array.from(element.children).forEach(child => {
      if (child instanceof HTMLElement) {
        addInlineStyles(child, true);
      }
    });
  }
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
 * 导出聊天框为HTML文件
 */
export function exportChatLogAsHTML(options: ExportOptions = {}): void {
  const {
    includeStyles = true,
    includeInlineStyles = false,
    prettyPrint = true
  } = options;
  
  // 查找TextAreaChatLog元素
  const chatLog = document.getElementById('TextAreaChatLog');
  if (!chatLog) {
    throw new Error('TextAreaChatLog 元素未找到');
  }
  
  // 克隆元素
  const clonedChatLog = cloneElementWithContent(chatLog);
  
  // 如果需要内联样式
  if (includeInlineStyles) {
    addInlineStyles(clonedChatLog);
  }
  
  // 创建HTML内容
  let htmlContent = '';
  
  if (includeStyles) {
    const relatedStyles = getRelatedStylesheets();
    htmlContent += `<style>\n${relatedStyles.join('\n')}\n</style>\n`;
  }
  
  htmlContent += clonedChatLog.outerHTML;
  
  // 创建完整的HTML文档
  const fullHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>聊天框导出 - ${new Date().toLocaleString()}</title>
    ${includeStyles ? '<style>\n' + getRelatedStylesheets().join('\n') + '\n</style>' : ''}
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
    </style>
</head>
<body>
    <div class="export-info">
        <h1>聊天框导出</h1>
        <p>导出时间: ${new Date().toLocaleString()} | 元素ID: TextAreaChatLog</p>
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
 * 简单的HTML格式化
 */
function formatHTML(html: string): string {
  let formatted = '';
  let indent = 0;
  const tab = '    ';
  
  html.split(/>\s*</).forEach((node, index) => {
    if (node.match(/^\/\w/)) {
      indent--;
    }
    
    formatted += indent > 0 ? '\n' + tab.repeat(indent) : '';
    formatted += (index > 0 ? '<' : '') + node + (index > 0 ? '>' : '');
    
    if (node.match(/^<?\w[^>]*[^\/]$/)) {
      indent++;
    }
  });
  
  return formatted;
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
