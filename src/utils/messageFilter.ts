import { useShuangMessagesStore, ShuangMessage } from '../store/useShuangMessagesStore';
import { useShuangConfigStore } from '../store/useShuangConfigStore';
import { log } from '../config/debug';

export class MessageFilter {
  private observer: MutationObserver | null = null;
  private messageIdSet: Set<string> = new Set();

  start() {
    const textAreaElement = document.getElementById('TextAreaChatLog');
    if (!textAreaElement) {
      log('SHUANG_CHAT_BOX', '未找到游戏文本框，无法启动消息筛选器');
      return;
    }

    log('SHUANG_CHAT_BOX', '启动消息筛选器');

    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement && node.classList.contains('ChatMessage')) {
            this.processMessage(node as HTMLElement);
          }
        });
      });
    });

    this.observer.observe(textAreaElement, {
      childList: true,
      subtree: false
    });

    this.processExistingMessages(textAreaElement);
  }

  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    log('SHUANG_CHAT_BOX', '停止消息筛选器');
  }

  private processExistingMessages(textAreaElement: HTMLElement) {
    const messages = textAreaElement.querySelectorAll('.ChatMessage');
    messages.forEach((msg) => {
      if (msg instanceof HTMLElement) {
        this.processMessage(msg);
      }
    });
  }

  private processMessage(messageElement: HTMLElement) {
    const messageId = messageElement.getAttribute('msgid') || this.generateMessageId(messageElement);
    
    if (this.messageIdSet.has(messageId)) {
      return;
    }
    
    this.messageIdSet.add(messageId);

    const senderId = messageElement.getAttribute('data-sender');
    if (!senderId) {
      return;
    }

    const isFollowed = useShuangConfigStore.getState().isPlayerFollowed(senderId);
    if (!isFollowed) {
      return;
    }

    const messageData = this.extractMessageData(messageElement, messageId);
    if (messageData) {
      useShuangMessagesStore.getState().addMessage(messageData);
      log('SHUANG_CHAT_BOX', '添加关注玩家消息:', messageData.senderName, messageData.content);
    }
  }

  private extractMessageData(element: HTMLElement, messageId: string): ShuangMessage | null {
    const senderId = element.getAttribute('data-sender');
    const timeElement = element.querySelector('.chat-room-time');
    const nameButton = element.querySelector('.ChatMessageName');
    const contentElement = element.querySelector('.chat-room-message-content');

    if (!senderId || !timeElement) {
      return null;
    }

    const timestamp = timeElement.textContent || '';
    const senderName = nameButton?.textContent || senderId;
    const content = contentElement?.textContent || '';

    let type: ShuangMessage['type'] = 'chat';
    if (element.classList.contains('ChatMessageActivity')) {
      type = 'activity';
    } else if (element.classList.contains('ChatMessageWhisper')) {
      type = 'whisper';
    } else if (element.classList.contains('ChatMessagePrivate')) {
      type = 'private';
    }

    return {
      id: messageId,
      senderId,
      senderName,
      content,
      timestamp,
      originalElement: element,
      type
    };
  }

  private generateMessageId(element: HTMLElement): string {
    const senderId = element.getAttribute('data-sender') || 'unknown';
    const time = element.getAttribute('data-time') || Date.now().toString();
    return `${senderId}-${time}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const messageFilter = new MessageFilter();
