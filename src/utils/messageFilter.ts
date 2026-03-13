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
    this.messageIdSet.clear();
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
    const senderId = messageElement.getAttribute('data-sender');
    if (!senderId) {
      return;
    }

    const isFollowed = useShuangConfigStore.getState().isPlayerFollowed(senderId);
    if (!isFollowed) {
      return;
    }

    const messageId = this.getMessageId(messageElement);
    
    if (this.messageIdSet.has(messageId)) {
      return;
    }
    
    this.messageIdSet.add(messageId);

    const messageData = this.extractMessageData(messageElement, messageId);
    if (messageData) {
      useShuangMessagesStore.getState().addMessage(messageData);
      log('SHUANG_CHAT_BOX', '添加关注玩家消息:', messageData.senderName || senderId);
    }
  }

  private getMessageId(element: HTMLElement): string {
    const msgid = element.getAttribute('msgid');
    if (msgid) {
      return msgid;
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

    if (!senderId || !timeElement) {
      return null;
    }

    const timestamp = timeElement.textContent || '';
    const senderName = nameButton?.textContent || senderId;

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
      content: '',
      timestamp,
      originalElement: element.cloneNode(true) as HTMLElement,
      type
    };
  }
}

export const messageFilter = new MessageFilter();
