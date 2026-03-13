import { useShuangMessagesStore, ShuangMessage } from '../store/useShuangMessagesStore';
import { useShuangConfigStore } from '../store/useShuangConfigStore';

export class MessageFilter {
  private observer: MutationObserver | null = null;
  private messageIdSet: Set<string> = new Set();

  start() {
    console.log('[ShuangDialog:MessageFilter] start() 被调用');
    
    const textAreaElement = document.getElementById('TextAreaChatLog');
    if (!textAreaElement) {
      console.error('[ShuangDialog:MessageFilter] 未找到游戏文本框，无法启动消息筛选器');
      return;
    }

    console.log('[ShuangDialog:MessageFilter] 找到游戏文本框，启动消息筛选器');
    
    const followedPlayerIds = useShuangConfigStore.getState().followedPlayerIds;
    console.log('[ShuangDialog:MessageFilter] 当前关注的玩家ID列表:', followedPlayerIds);

    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement && node.classList.contains('ChatMessage')) {
            console.log('[ShuangDialog:MessageFilter] 检测到新消息:', node);
            this.processMessage(node as HTMLElement);
          }
        });
      });
    });

    this.observer.observe(textAreaElement, {
      childList: true,
      subtree: true
    });

    console.log('[ShuangDialog:MessageFilter] MutationObserver 已启动');
    
    this.processExistingMessages(textAreaElement);
  }

  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    console.log('[ShuangDialog:MessageFilter] 停止消息筛选器（保留消息ID记录）');
  }

  private processExistingMessages(textAreaElement: HTMLElement) {
    const messages = textAreaElement.querySelectorAll('.ChatMessage');
    console.log(`[ShuangDialog:MessageFilter] 处理已存在的消息，共 ${messages.length} 条`);
    messages.forEach((msg) => {
      if (msg instanceof HTMLElement) {
        this.processMessage(msg);
      }
    });
  }

  private processMessage(messageElement: HTMLElement) {
    const senderId = messageElement.getAttribute('data-sender');
    if (!senderId) {
      console.log('[ShuangDialog:MessageFilter] 消息没有senderId:', messageElement);
      return;
    }

    const followedPlayerIds = useShuangConfigStore.getState().followedPlayerIds;
    const isFollowed = followedPlayerIds.includes(senderId);
    console.log(`[ShuangDialog:MessageFilter] 消息发送者ID: ${senderId}, 是否关注: ${isFollowed}, 关注列表:`, followedPlayerIds);
    
    if (!isFollowed) {
      return;
    }

    const messageId = this.getMessageId(messageElement);
    
    if (this.messageIdSet.has(messageId)) {
      console.log('[ShuangDialog:MessageFilter] 消息已存在，跳过:', messageId);
      return;
    }
    
    this.messageIdSet.add(messageId);

    const messageData = this.extractMessageData(messageElement, messageId);
    if (messageData) {
      useShuangMessagesStore.getState().addMessage(messageData);
      console.log('[ShuangDialog:MessageFilter] 添加关注玩家消息:', messageData.senderName || senderId);
      console.log('[ShuangDialog:MessageFilter] 当前消息列表:', useShuangMessagesStore.getState().messages);
    }
  }

  private getMessageId(element: HTMLElement): string {
    const msgidElement = element.querySelector('[msgid]');
    if (msgidElement) {
      const msgid = msgidElement.getAttribute('msgid');
      if (msgid) {
        return msgid;
      }
    }

    const senderId = element.getAttribute('data-sender') || 'unknown';
    const time = element.getAttribute('data-time') || Date.now().toString();
    const content = element.textContent?.substring(0, 50) || '';
    return `${senderId}-${time}-${content}`;
  }

  private extractMessageData(element: HTMLElement, messageId: string): ShuangMessage | null {
    const senderId = element.getAttribute('data-sender');
    const timeElement = element.querySelector('.chat-room-time');
    const nameButton = element.querySelector('.ChatMessageName');

    if (!senderId) {
      console.log('[ShuangDialog:MessageFilter] extractMessageData: 没有senderId');
      return null;
    }

    if (!timeElement) {
      console.log('[ShuangDialog:MessageFilter] extractMessageData: 没有timeElement');
    }

    const timestamp = timeElement?.textContent || '';
    const senderName = nameButton?.textContent || senderId;

    let type: ShuangMessage['type'] = 'chat';
    if (element.classList.contains('ChatMessageActivity')) {
      type = 'activity';
    } else if (element.classList.contains('ChatMessageWhisper')) {
      type = 'whisper';
    } else if (element.classList.contains('ChatMessagePrivate')) {
      type = 'private';
    }

    console.log('[ShuangDialog:MessageFilter] extractMessageData: 提取成功', { senderId, senderName, timestamp, type });

    return {
      id: messageId,
      senderId,
      senderName,
      content: '',
      timestamp,
      originalElement: element.cloneNode(true) as HTMLElement,
      type
    };
  }
}

export const messageFilter = new MessageFilter();
