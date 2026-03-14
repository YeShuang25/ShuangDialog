import { useShuangMessagesStore, ShuangMessage } from '../store/useShuangMessagesStore';
import { useShuangConfigStore, MessageTypeFilter } from '../store/useShuangConfigStore';

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
    
    const followedPlayers = useShuangConfigStore.getState().followedPlayers;
    console.log('[ShuangDialog:MessageFilter] 当前关注的玩家列表:', followedPlayers);

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

  private getMessageType(element: HTMLElement): MessageTypeFilter {
    if (element.classList.contains('ChatMessageChat')) {
      return 'chat';
    }
    if (element.classList.contains('ChatMessageEmote')) {
      return 'emote';
    }
    if (element.classList.contains('ChatMessageActivity')) {
      return 'activity';
    }
    return 'other';
  }

  private processMessage(messageElement: HTMLElement) {
    if (messageElement.classList.contains('bce-pending')) {
      console.log('[ShuangDialog:MessageFilter] 跳过正在发送中的消息:', messageElement);
      return;
    }

    const senderId = messageElement.getAttribute('data-sender');
    if (!senderId) {
      console.log('[ShuangDialog:MessageFilter] 消息没有senderId:', messageElement);
      return;
    }

    const messageType = this.getMessageType(messageElement);
    const followedPlayers = useShuangConfigStore.getState().followedPlayers;
    const senderPlayer = followedPlayers.find(p => p.id === senderId);
    
    const isSenderFollowed = !!senderPlayer;
    const isMessageTypeEnabled = senderPlayer ? senderPlayer.messageTypes.includes(messageType) : false;
    
    if (isSenderFollowed && !isMessageTypeEnabled) {
      console.log(`[ShuangDialog:MessageFilter] 玩家 ${senderId} 的消息类型 ${messageType} 未启用，跳过`);
      return;
    }
    
    let isTargetFollowed = false;
    let targetPlayerId: string | null = null;
    if (!isSenderFollowed && messageElement.classList.contains('ChatMessageActivity')) {
      const result = this.checkTargetPlayerWithId(messageElement, followedPlayers);
      isTargetFollowed = result.isFollowed;
      targetPlayerId = result.playerId;
      
      if (isTargetFollowed && targetPlayerId) {
        const targetPlayer = followedPlayers.find(p => p.id === targetPlayerId);
        if (targetPlayer && !targetPlayer.messageTypes.includes(messageType)) {
          console.log(`[ShuangDialog:MessageFilter] 目标玩家 ${targetPlayerId} 的消息类型 ${messageType} 未启用，跳过`);
          return;
        }
      }
    }
    
    console.log(`[ShuangDialog:MessageFilter] 消息发送者ID: ${senderId}, 发送者是否关注: ${isSenderFollowed}, 目标是否关注: ${isTargetFollowed}`);
    
    if (!isSenderFollowed && !isTargetFollowed) {
      return;
    }

    const messageId = this.getMessageId(messageElement);
    
    if (this.messageIdSet.has(messageId)) {
      console.log('[ShuangDialog:MessageFilter] 消息已存在，跳过:', messageId);
      return;
    }
    
    this.messageIdSet.add(messageId);

    const messageData = this.extractMessageData(messageElement, messageId, messageType);
    if (messageData) {
      useShuangMessagesStore.getState().addMessage(messageData);
      console.log('[ShuangDialog:MessageFilter] 添加关注玩家消息:', messageData.senderName || senderId);
      console.log('[ShuangDialog:MessageFilter] 当前消息列表:', useShuangMessagesStore.getState().messages);
    }
  }

  private checkTargetPlayerWithId(messageElement: HTMLElement, followedPlayers: { id: string; messageTypes: MessageTypeFilter[] }[]): { isFollowed: boolean; playerId: string | null } {
    const textContent = messageElement.textContent || '';
    
    const nameButtons = document.querySelectorAll('.ChatMessageName');
    const playerIdMap = new Map<string, string>();
    
    nameButtons.forEach((btn) => {
      const name = btn.textContent?.trim();
      const message = btn.closest('.ChatMessage');
      const id = message?.getAttribute('data-sender');
      if (name && id) {
        playerIdMap.set(name, id);
      }
    });
    
    for (const [name, id] of playerIdMap) {
      const player = followedPlayers.find(p => p.id === id);
      if (player && textContent.includes(name)) {
        console.log(`[ShuangDialog:MessageFilter] 检测到目标玩家 ${name} (${id}) 在消息中`);
        return { isFollowed: true, playerId: id };
      }
    }
    
    return { isFollowed: false, playerId: null };
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

  private extractMessageData(element: HTMLElement, messageId: string, _messageType: MessageTypeFilter): ShuangMessage | null {
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
    } else if (element.classList.contains('ChatMessageEmote')) {
      type = 'emote';
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
      originalElement: element,
      type
    };
  }
}

export const messageFilter = new MessageFilter();
