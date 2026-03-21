import { useShuangMessagesStore, ShuangMessage } from '../store/useShuangMessagesStore';
import { useShuangConfigStore, MessageTypeFilter } from '../store/useShuangConfigStore';
import { telegramForwarder } from '../core/telegramForwarder';
import { log, error } from '../config/debug';

export class MessageFilter {
  private observer: MutationObserver | null = null;

  start() {
    log('MESSAGE_FILTER', 'start() 被调用');
    
    const textAreaElement = document.getElementById('TextAreaChatLog');
    if (!textAreaElement) {
      error('MESSAGE_FILTER', '未找到游戏文本框，无法启动消息筛选器');
      return;
    }

    log('MESSAGE_FILTER', '找到游戏文本框，启动消息筛选器');
    
    const followedPlayers = useShuangConfigStore.getState().followedPlayers;
    log('MESSAGE_FILTER', '当前关注的玩家列表:', followedPlayers);

    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement && node.classList.contains('ChatMessage')) {
            log('MESSAGE_FILTER', '检测到新消息:', node);
            this.processMessage(node as HTMLElement);
          }
        });
      });
    });

    this.observer.observe(textAreaElement, {
      childList: true,
      subtree: true
    });

    log('MESSAGE_FILTER', 'MutationObserver 已启动');
    
    this.processExistingMessages(textAreaElement);
  }

  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    log('MESSAGE_FILTER', '停止消息筛选器');
  }

  private processExistingMessages(textAreaElement: HTMLElement) {
    const messages = textAreaElement.querySelectorAll('.ChatMessage');
    log('MESSAGE_FILTER', `处理已存在的消息，共 ${messages.length} 条`);
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
    if (element.classList.contains('ChatMessageActivity') || element.classList.contains('ChatMessageAction')) {
      return 'activity';
    }
    return 'other';
  }

  private processMessage(messageElement: HTMLElement) {
    if (messageElement.classList.contains('bce-pending')) {
      log('MESSAGE_FILTER', '跳过正在发送中的消息:', messageElement);
      return;
    }

    const senderId = messageElement.getAttribute('data-sender');
    if (!senderId) {
      log('MESSAGE_FILTER', '消息没有senderId:', messageElement);
      return;
    }

    const messageType = this.getMessageType(messageElement);
    const followedPlayers = useShuangConfigStore.getState().followedPlayers;
    const senderPlayer = followedPlayers.find(p => p.id === senderId);
    
    if (senderPlayer) {
      this.updatePlayerNameFromChatRoom(senderId);
    }
    
    if (telegramForwarder.isEnabled() && !telegramForwarder.isFilterEnabled()) {
      const messageData = this.extractMessageData(messageElement, messageType);
      if (messageData) {
        this.forwardToTelegram(messageData);
      }
      return;
    }
    
    const isSenderFollowed = !!senderPlayer;
    const isMessageTypeExcluded = senderPlayer ? (senderPlayer.excludedMessageTypes || []).includes(messageType) : false;
    const isMessageTypeEnabled = senderPlayer ? senderPlayer.messageTypes.includes(messageType) : false;
    
    if (isSenderFollowed && isMessageTypeExcluded) {
      log('MESSAGE_FILTER', `玩家 ${senderId} 的消息类型 ${messageType} 已排除，跳过`);
      return;
    }
    
    if (isSenderFollowed && isMessageTypeEnabled) {
      log('MESSAGE_FILTER', `玩家 ${senderId} 的消息类型 ${messageType} 已启用，直接通过`);
      const messageData = this.extractMessageData(messageElement, messageType);
      if (messageData) {
        useShuangMessagesStore.getState().addMessage(messageData);
        log('MESSAGE_FILTER', '添加关注玩家消息:', messageData.senderName || senderId);
        this.forwardToTelegram(messageData);
      }
      return;
    }
    
    if (this.checkExcludeContentMatch(messageElement, followedPlayers)) {
      log('MESSAGE_FILTER', '排除内容匹配成功，跳过消息');
      return;
    }
    
    const isContentMatched = this.checkContentMatch(messageElement, followedPlayers);
    const isGlobalKeywordMatched = this.checkGlobalKeywords(messageElement);
    
    log('MESSAGE_FILTER', `消息发送者ID: ${senderId}, 发送者是否关注: ${isSenderFollowed}, 类型启用: ${isMessageTypeEnabled}, 内容匹配: ${isContentMatched}, 全局关键字匹配: ${isGlobalKeywordMatched}`);
    
    if (!isContentMatched && !isGlobalKeywordMatched) {
      return;
    }

    const messageData = this.extractMessageData(messageElement, messageType);
    if (messageData) {
      useShuangMessagesStore.getState().addMessage(messageData);
      log('MESSAGE_FILTER', '添加关注玩家消息:', messageData.senderName || senderId);
      log('MESSAGE_FILTER', '当前消息列表:', useShuangMessagesStore.getState().messages);
      this.forwardToTelegram(messageData);
    }
  }

  private forwardToTelegram(messageData: ShuangMessage) {
    if (telegramForwarder.isEnabled()) {
      telegramForwarder.sendFormattedMessage(
        messageData.senderName || messageData.senderId,
        messageData.senderId,
        messageData.content,
        messageData.type
      );
    }
  }

  private getMessageTextContent(element: HTMLElement): string {
    const clone = element.cloneNode(true) as HTMLElement;
    
    const excludeSelectors = [
      '.chat-room-time',
      '.chat-room-sender', 
      '.ChatMessageName',
      '.chat-room-metadata',
      '.chat-room-message-popup',
      '.menubar',
      'button[name="reply"]',
      '.button-tooltip'
    ];
    
    for (const selector of excludeSelectors) {
      clone.querySelectorAll(selector).forEach(el => el.remove());
    }
    
    return clone.textContent?.trim() || '';
  }

  private updatePlayerNameFromChatRoom(playerId: string) {
    try {
      const chatRoomCharacter = (window as any).ChatRoomCharacter;
      if (!chatRoomCharacter || !Array.isArray(chatRoomCharacter)) {
        return;
      }
      
      const roomPlayer = chatRoomCharacter.find((p: any) => 
        p && (p.MemberNumber === playerId || p.MemberNumber === parseInt(playerId))
      );
      
      if (roomPlayer) {
        const displayName = roomPlayer.Nickname || roomPlayer.Name || '';
        if (displayName) {
          useShuangConfigStore.getState().updatePlayerName(playerId, displayName);
        }
      }
    } catch (e) {
      error('MESSAGE_FILTER', '更新玩家名字失败:', e);
    }
  }

  private checkExcludeContentMatch(messageElement: HTMLElement, followedPlayers: { id: string; excludeMatch?: boolean }[]): boolean {
    const playersWithExcludeMatch = followedPlayers.filter(p => p.excludeMatch);
    if (playersWithExcludeMatch.length === 0) {
      return false;
    }

    const playerNamesMap = this.getPlayerNamesFromChatRoom(playersWithExcludeMatch);
    const messageText = this.getMessageTextContent(messageElement);
    
    for (const player of playersWithExcludeMatch) {
      const names = playerNamesMap.get(player.id) || [];
      
      for (const name of names) {
        if (name && name.trim()) {
          const escapedName = name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(escapedName);
          if (regex.test(messageText)) {
            log('MESSAGE_FILTER', `排除内容匹配成功: 玩家 ${player.id} 的名字 "${name}" 在消息中`);
            return true;
          }
        }
      }
    }
    
    return false;
  }

  private checkContentMatch(messageElement: HTMLElement, followedPlayers: { id: string; contentMatch: boolean }[]): boolean {
    const playersWithContentMatch = followedPlayers.filter(p => p.contentMatch);
    if (playersWithContentMatch.length === 0) {
      return false;
    }

    const playerNamesMap = this.getPlayerNamesFromChatRoom(playersWithContentMatch);
    const messageText = this.getMessageTextContent(messageElement);
    
    for (const player of playersWithContentMatch) {
      const names = playerNamesMap.get(player.id) || [];
      
      for (const name of names) {
        if (name && name.trim()) {
          const escapedName = name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(escapedName);
          if (regex.test(messageText)) {
            log('MESSAGE_FILTER', `内容匹配成功: 玩家 ${player.id} 的名字 "${name}" 在消息中`);
            return true;
          }
        }
      }
    }
    
    return false;
  }

  private checkGlobalKeywords(messageElement: HTMLElement): boolean {
    const globalKeywords = useShuangConfigStore.getState().globalKeywords;
    if (globalKeywords.length === 0) {
      return false;
    }

    const messageText = this.getMessageTextContent(messageElement);
    
    for (const keyword of globalKeywords) {
      if (keyword && keyword.trim()) {
        const escapedKeyword = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedKeyword);
        if (regex.test(messageText)) {
          log('MESSAGE_FILTER', `全局关键字匹配成功: "${keyword}" 在消息中`);
          return true;
        }
      }
    }
    
    return false;
  }

  private getPlayerNamesFromChatRoom(players: { id: string }[]): Map<string, string[]> {
    const playerNamesMap = new Map<string, string[]>();
    
    try {
      const chatRoomCharacter = (window as any).ChatRoomCharacter;
      if (!chatRoomCharacter || !Array.isArray(chatRoomCharacter)) {
        log('MESSAGE_FILTER', '未找到 ChatRoomCharacter');
        return playerNamesMap;
      }
      
      for (const player of players) {
        const roomPlayer = chatRoomCharacter.find((p: any) => 
          p && p.MemberNumber === player.id || p && p.MemberNumber === parseInt(player.id)
        );
        
        if (roomPlayer) {
          const names: string[] = [];
          const displayName = roomPlayer.Nickname || roomPlayer.Name || '';
          
          if (roomPlayer.Name) names.push(roomPlayer.Name);
          if (roomPlayer.Nickname && roomPlayer.Nickname !== roomPlayer.Name) {
            names.push(roomPlayer.Nickname);
          }
          
          if (names.length > 0) {
            playerNamesMap.set(player.id, names);
            log('MESSAGE_FILTER', `玩家 ${player.id} 的名字:`, names);
          }
          
          if (displayName) {
            useShuangConfigStore.getState().updatePlayerName(player.id, displayName);
          }
        }
      }
    } catch (e) {
      error('MESSAGE_FILTER', '获取玩家名字失败:', e);
    }
    
    return playerNamesMap;
  }

  private extractMessageData(element: HTMLElement, _messageType: MessageTypeFilter): ShuangMessage | null {
    const senderId = element.getAttribute('data-sender');
    const timeElement = element.querySelector('.chat-room-time');
    const nameButton = element.querySelector('.ChatMessageName');

    if (!senderId) {
      log('MESSAGE_FILTER', 'extractMessageData: 没有senderId');
      return null;
    }

    const timestamp = timeElement?.textContent || '';
    const senderName = nameButton?.textContent || senderId;
    const messageId = `${senderId}-${timestamp}-${Date.now()}`;
    const content = this.getMessageTextContent(element);

    let type: ShuangMessage['type'] = 'chat';
    if (element.classList.contains('ChatMessageActivity') || element.classList.contains('ChatMessageAction')) {
      type = 'activity';
    } else if (element.classList.contains('ChatMessageEmote')) {
      type = 'emote';
    } else if (element.classList.contains('ChatMessageWhisper')) {
      type = 'whisper';
    } else if (element.classList.contains('ChatMessagePrivate')) {
      type = 'private';
    }

    log('MESSAGE_FILTER', 'extractMessageData: 提取成功', { senderId, senderName, timestamp, type, content });

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
}

export const messageFilter = new MessageFilter();
