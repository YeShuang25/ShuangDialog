import { chatMonitor } from '../store/useChatMonitorStore';

// 聊天监控核心模块
interface ChatMonitor {
  startMonitoring: () => void;
  stopMonitoring: () => void;
  isMonitoring: boolean;
}

// 全局单例
let monitorInstance: ChatMonitor | null = null;
let observer: MutationObserver | null = null;

/**
 * 创建聊天监控模块
 */
function createChatMonitor(): ChatMonitor {
  let isMonitoring = false;

  const monitorTextAreaChatLog = () => {
    const chatLog = document.getElementById('TextAreaChatLog');
    if (!chatLog) {
      chatMonitor.warn('TextAreaChatLog 元素未找到，等待元素加载...', null, 'ChatMonitor');
      // 尝试延迟查找
      setTimeout(monitorTextAreaChatLog, 1000);
      return;
    }

    // 配置 MutationObserver
    const config = {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    };

    // 创建观察者
    observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // 处理子节点变化（新消息添加）
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement && node.classList.contains('ChatMessage')) {
              const messageData = extractMessageData(node);
              if (messageData) {
                chatMonitor.log('新消息添加', messageData, 'ChatMonitor');
              }
            }
          });
        }
        
        // 处理属性变化
        if (mutation.type === 'attributes' && mutation.target instanceof HTMLElement) {
          const target = mutation.target;
          if (target.id === 'TextAreaChatLog') {
            chatMonitor.log('TextAreaChatLog 属性变化', {
              attributeName: mutation.attributeName,
              oldValue: mutation.oldValue,
              newValue: target.getAttribute(mutation.attributeName || '')
            }, 'ChatMonitor');
          }
        }
        
        // 处理文本变化
        if (mutation.type === 'characterData' && mutation.target instanceof Text) {
          const parent = mutation.target.parentElement;
          if (parent && parent.classList.contains('chat-room-message-content')) {
            chatMonitor.log('消息内容变化', {
              oldValue: mutation.oldValue,
              newValue: mutation.target.textContent,
              parent: parent.className
            }, 'ChatMonitor');
          }
        }
      });
    });

    // 开始观察
    observer.observe(chatLog, config);
    isMonitoring = true;
    chatMonitor.info('开始监控 TextAreaChatLog', null, 'ChatMonitor');
  };

  const extractMessageData = (messageElement: HTMLElement): Record<string, any> | null => {
    const time = messageElement.dataset.time;
    const sender = messageElement.dataset.sender;
    const target = messageElement.dataset.target;
    const messageContent = messageElement.querySelector('.chat-room-message-content')?.textContent;
    const messageType = Array.from(messageElement.classList)
      .find(cls => cls.startsWith('ChatMessage'))
      ?.replace('ChatMessage', '') || 'Unknown';

    return {
      time,
      sender,
      target,
      content: messageContent,
      type: messageType,
      hasReply: messageElement.querySelector('.chat-room-message-reply') !== null,
      messageId: messageElement.querySelector('[msgid]')?.getAttribute('msgid')
    };
  };

  return {
    startMonitoring: monitorTextAreaChatLog,
    stopMonitoring: () => {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      isMonitoring = false;
      chatMonitor.info('停止监控 TextAreaChatLog', null, 'ChatMonitor');
    },
    get isMonitoring() {
      return isMonitoring;
    }
  };
}

/**
 * 初始化聊天监控模块
 */
export function initChatMonitor(): ChatMonitor {
  if (monitorInstance) {
    return monitorInstance;
  }

  monitorInstance = createChatMonitor();
  chatMonitor.info('[ShuangDialog] 初始化聊天监控模块', null, 'ChatMonitor');
  
  // 尝试立即开始监控
  monitorInstance.startMonitoring();
  
  return monitorInstance;
}

/**
 * 获取聊天监控模块实例
 */
export function getChatMonitor(): ChatMonitor | null {
  return monitorInstance;
}
