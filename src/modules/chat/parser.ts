// 解析聊天数据包
import { ChatPacket, GamePacket } from '../../core/types';

export interface ParsedChatMessage {
  id: string;
  channel: string;
  sender: string;
  message: string;
  timestamp: number;
  isSystem: boolean;
  isPrivate: boolean;
  mentions: string[];
  emotes: Array<{
    id: string;
    name: string;
    positions: Array<{ start: number; end: number }>;
  }>;
}

export class ChatParser {
  private static messageIdCounter = 0;

  public static parsePacket(packet: GamePacket): ParsedChatMessage | null {
    if (packet.type !== 'chat') {
      return null;
    }

    const chatPacket = packet as ChatPacket;
    const data = chatPacket.data;

    return {
      id: this.generateMessageId(),
      channel: data.channel || 'unknown',
      sender: data.sender || 'System',
      message: data.message || '',
      timestamp: data.timestamp || packet.timestamp,
      isSystem: data.sender === 'System' || !data.sender,
      isPrivate: this.isPrivateMessage(data.channel),
      mentions: this.extractMentions(data.message),
      emotes: this.extractEmotes(data.message)
    };
  }

  private static generateMessageId(): string {
    return `msg_${Date.now()}_${++this.messageIdCounter}`;
  }

  private static isPrivateMessage(channel: string): boolean {
    const privateChannels = ['whisper', 'private', 'pm', 'tell'];
    return privateChannels.some(pc => channel.toLowerCase().includes(pc));
  }

  private static extractMentions(message: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(message)) !== null) {
      mentions.push(match[1]);
    }

    return mentions;
  }

  private static extractEmotes(message: string): Array<{
    id: string;
    name: string;
    positions: Array<{ start: number; end: number }>;
  }> {
    // 这里可以根据游戏的表情系统来实现
    // 暂时返回空数组
    return [];
  }

  public static formatMessage(parsed: ParsedChatMessage): string {
    const timestamp = new Date(parsed.timestamp).toLocaleTimeString();
    const channelPrefix = parsed.channel !== 'world' ? `[${parsed.channel}]` : '';
    const senderPrefix = parsed.isSystem ? '[系统]' : `${parsed.sender}:`;
    
    return `${timestamp} ${channelPrefix} ${senderPrefix} ${parsed.message}`;
  }
}
