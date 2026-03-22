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

  refresh() {
    log('MESSAGE_FILTER', '刷新消息筛选器');
    
    useShuangMessagesStore.getState().clearMessages();
    
    const textAreaElement = document.getElementById('TextAreaChatLog');
    if (!textAreaElement) {
      error('MESSAGE_FILTER', '未找到游戏文本框，无法刷新消息');
      return;
    }
    
    this.processExistingMessages(textAreaElement);
    log('MESSAGE_FILTER', '消息筛选器刷新完成');
  }

  private processExistingMessages(textAreaElement: HTMLElement) {
    const messages = textAreaElement.querySelectorAll('.ChatMessage');
    log('MESSAGE_FILTER', `处理已存在的消息，共 ${messages.length} 条`);
    
    const messageArray = Array.from(messages).filter((msg): msg is HTMLElement => msg instanceof HTMLElement);
    
    this.processMessagesInOrder(messageArray, 0);
  }

  private async processMessagesInOrder(messages: HTMLElement[], index: number) {
    if (index >= messages.length) return;
    
    const msg = messages[index];
    
    if (msg.classList.contains('bce-pending')) {
      this.processMessagesInOrder(messages, index + 1);
      return;
    }
    
    if (this.isRoomEnterMessage(msg)) {
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          this.processRoomEnterMessage(msg);
          resolve();
        }, 100);
      });
    } else {
      this.processMessage(msg, false);
    }
    
    this.processMessagesInOrder(messages, index + 1);
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

  private isRoomEnterMessage(element: HTMLElement): boolean {
    const result = element.classList.contains('chat-room-sep');
    log('MESSAGE_FILTER', `isRoomEnterMessage检查: ${result}`, element.className);
    return result;
  }

  private extractRoomEnterData(element: HTMLElement): { time: string; roomName: string } | null {
    log('MESSAGE_FILTER', '完整元素HTML:', element.outerHTML);
    
    const timeElement = element.querySelector('.chat-room-time');
    const time = timeElement?.textContent || '';
    
    const roomButton = element.querySelector('.chat-room-sep-header');
    if (!roomButton) {
      log('MESSAGE_FILTER', 'extractRoomEnterData: 未找到 roomButton');
      return null;
    }
    
    const dataRoom = roomButton.getAttribute('data-room');
    const textContent = roomButton.textContent?.trim() || '';
    log('MESSAGE_FILTER', `extractRoomEnterData: data-room属性=${dataRoom}, textContent=${textContent}`);
    
    const roomName = dataRoom || textContent;
    
    if (!roomName) return null;
    
    return { time, roomName };
  }

  private processMessage(messageElement: HTMLElement, handleRoomEnter: boolean = true) {
    log('MESSAGE_FILTER', 'processMessage 被调用', messageElement.className);
    
    if (messageElement.classList.contains('bce-pending')) {
      log('MESSAGE_FILTER', '跳过正在发送中的消息:', messageElement);
      return;
    }

    if (this.isRoomEnterMessage(messageElement)) {
      if (handleRoomEnter) {
        log('MESSAGE_FILTER', '检测到进入房间消息（实时），延迟处理等待渲染完成');
        setTimeout(() => {
          this.processRoomEnterMessage(messageElement);
        }, 100);
      }
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
    
    this.processTelegramForward(messageElement, messageType, senderPlayer, followedPlayers);
    
    this.processSpecialFollow(messageElement, messageType, senderPlayer, followedPlayers);
  }

  private processRoomEnterMessage(messageElement: HTMLElement) {
    const roomData = this.extractRoomEnterData(messageElement);
    if (roomData) {
      log('MESSAGE_FILTER', `房间数据: ${JSON.stringify(roomData)}, TG启用: ${telegramForwarder.isEnabled()}`);
      if (telegramForwarder.isEnabled()) {
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const timeTag = roomData.time.replace(/:/g, '');
        const roomTag = roomData.roomName.replace(/\s+/g, '_');
        const tagMessage = `#${dateStr}_${timeTag}_${roomTag}`;
        telegramForwarder.sendMessage(`🚪 进入房间\n${tagMessage}\n─────────────────`);
        log('MESSAGE_FILTER', '已发送TG消息:', tagMessage);
      }
      
      const senderId = messageElement.getAttribute('data-sender');
      log('MESSAGE_FILTER', `发送者ID: ${senderId}`);
      if (senderId) {
        const followedPlayers = useShuangConfigStore.getState().followedPlayers;
        const senderPlayer = followedPlayers.find(p => p.id === senderId);
        log('MESSAGE_FILTER', `发送者是否关注: ${!!senderPlayer}`);
        
        if (senderPlayer) {
          const excludedTypes = senderPlayer.excludedMessageTypes || [];
          const isExcluded = excludedTypes.includes('other');
          log('MESSAGE_FILTER', `房间消息类型是否被排除: ${isExcluded}, 排除列表: ${JSON.stringify(excludedTypes)}`);
          
          if (!isExcluded) {
            const messageData: ShuangMessage = {
              id: `${senderId}-${roomData.time}-${Date.now()}`,
              senderId,
              senderName: senderId,
              content: `进入房间 ${roomData.roomName}`,
              timestamp: roomData.time,
              originalElement: messageElement,
              type: 'other'
            };
            useShuangMessagesStore.getState().addMessage(messageData);
            log('MESSAGE_FILTER', '添加进入房间消息到霜语:', messageData);
          } else {
            log('MESSAGE_FILTER', '房间消息已被排除，不添加到霜语');
          }
        }
      }
    } else {
      log('MESSAGE_FILTER', 'extractRoomEnterData 返回 null');
    }
  }

  private processTelegramForward(
    messageElement: HTMLElement, 
    messageType: MessageTypeFilter,
    senderPlayer: { id: string; messageTypes: string[]; excludedMessageTypes?: string[]; contentMatch?: boolean; excludeMatch?: boolean } | undefined,
    followedPlayers: { id: string; messageTypes: string[]; excludedMessageTypes?: string[]; contentMatch?: boolean; excludeMatch?: boolean }[]
  ) {
    if (!telegramForwarder.isEnabled()) {
      return;
    }

    if (!telegramForwarder.isFilterEnabled()) {
      const messageData = this.extractMessageData(messageElement, messageType);
      if (messageData) {
        this.forwardToTelegram(messageData);
      }
      return;
    }

    const shouldForward = this.checkMessageMatch(messageElement, senderPlayer, followedPlayers);
    if (shouldForward) {
      const messageData = this.extractMessageData(messageElement, messageType);
      if (messageData) {
        this.forwardToTelegram(messageData);
      }
    }
  }

  private processSpecialFollow(
    messageElement: HTMLElement,
    messageType: MessageTypeFilter,
    senderPlayer: { id: string; messageTypes: string[]; excludedMessageTypes?: string[]; contentMatch?: boolean; excludeMatch?: boolean } | undefined,
    followedPlayers: { id: string; messageTypes: string[]; excludedMessageTypes?: string[]; contentMatch?: boolean; excludeMatch?: boolean }[]
  ) {
    const senderId = messageElement.getAttribute('data-sender') || '';
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
    }
  }

  private checkMessageMatch(
    messageElement: HTMLElement,
    senderPlayer: { id: string; messageTypes: string[]; excludedMessageTypes?: string[]; contentMatch?: boolean; excludeMatch?: boolean } | undefined,
    followedPlayers: { id: string; messageTypes: string[]; excludedMessageTypes?: string[]; contentMatch?: boolean; excludeMatch?: boolean }[]
  ): boolean {
    const messageType = this.getMessageType(messageElement);
    
    const isSenderFollowed = !!senderPlayer;
    const isMessageTypeExcluded = senderPlayer ? (senderPlayer.excludedMessageTypes || []).includes(messageType) : false;
    const isMessageTypeEnabled = senderPlayer ? senderPlayer.messageTypes.includes(messageType) : false;
    
    if (isSenderFollowed && isMessageTypeExcluded) {
      return false;
    }
    
    if (isSenderFollowed && isMessageTypeEnabled) {
      return true;
    }
    
    if (this.checkExcludeContentMatch(messageElement, followedPlayers)) {
      return false;
    }
    
    const isContentMatched = this.checkContentMatch(messageElement, followedPlayers);
    const isGlobalKeywordMatched = this.checkGlobalKeywords(messageElement);
    
    return isContentMatched || isGlobalKeywordMatched;
  }

  private forwardToTelegram(messageData: ShuangMessage) {
    if (telegramForwarder.isEnabled()) {
      telegramForwarder.sendFormattedMessage(
        messageData.senderName || messageData.senderId,
        messageData.senderId,
        messageData.content,
        messageData.type,
        messageData.originalContent,
        messageData.replyInfo
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
      '.button-tooltip',
      '.chat-room-message-reply',
      '.chat-room-message-original'
    ];
    
    for (const selector of excludeSelectors) {
      clone.querySelectorAll(selector).forEach(el => el.remove());
    }
    
    return clone.textContent?.trim() || '';
  }

  private extractReplyInfo(element: HTMLElement): { senderName: string; content: string } | null {
    const replyButton = element.querySelector('.chat-room-message-reply');
    if (!replyButton) return null;
    
    const replyText = replyButton.textContent || '';
    const colonIndex = replyText.indexOf(': ');
    
    if (colonIndex > 0) {
      return {
        senderName: replyText.substring(0, colonIndex),
        content: replyText.substring(colonIndex + 2)
      };
    }
    
    return null;
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

  private checkContentMatch(messageElement: HTMLElement, followedPlayers: { id: string; contentMatch?: boolean }[]): boolean {
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
    const originalContent = this.getOriginalContent(element);
    const replyInfo = this.extractReplyInfo(element);

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

    log('MESSAGE_FILTER', 'extractMessageData: 提取成功', { senderId, senderName, timestamp, type, content, originalContent, replyInfo });

    return {
      id: messageId,
      senderId,
      senderName,
      content,
      timestamp,
      originalElement: element,
      type,
      ...(originalContent && { originalContent }),
      ...(replyInfo && { replyInfo })
    };
  }

  private getOriginalContent(element: HTMLElement): string | undefined {
    const originalElement = element.querySelector('.chat-room-message-original');
    if (originalElement) {
      return originalElement.textContent?.trim() || undefined;
    }
    return undefined;
  }
}

export const messageFilter = new MessageFilter();
