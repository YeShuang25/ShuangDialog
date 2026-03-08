// Zustand 存储聊天记录
import { create } from 'zustand';
import { ParsedChatMessage } from '../modules/chat/parser';

export interface ChatMessage extends ParsedChatMessage {
  isFiltered: boolean;
  filteredMessage?: string;
  highlightReason?: string;
}

export interface ChatState {
  messages: ChatMessage[];
  channels: Set<string>;
  activeChannel: string;
  isScrollLocked: boolean;
  maxMessages: number;
  
  // Actions
  addMessage: (message: ParsedChatMessage, filterResult?: { isFiltered: boolean; filteredMessage?: string; highlightReason?: string }) => void;
  clearMessages: () => void;
  setActiveChannel: (channel: string) => void;
  toggleScrollLock: () => void;
  setMaxMessages: (max: number) => void;
  getMessagesByChannel: (channel: string) => ChatMessage[];
  getAllChannels: () => string[];
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  channels: new Set(),
  activeChannel: 'world',
  isScrollLocked: false,
  maxMessages: 1000,

  addMessage: (message, filterResult) => {
    set((state) => {
      const chatMessage: ChatMessage = {
        ...message,
        isFiltered: filterResult?.isFiltered || false,
        filteredMessage: filterResult?.filteredMessage,
        highlightReason: filterResult?.highlightReason
      };

      const newMessages = [...state.messages, chatMessage];
      
      // 限制消息数量
      if (newMessages.length > state.maxMessages) {
        newMessages.splice(0, newMessages.length - state.maxMessages);
      }

      // 更新频道列表
      const newChannels = new Set(state.channels);
      newChannels.add(message.channel);

      return {
        messages: newMessages,
        channels: newChannels
      };
    });
  },

  clearMessages: () => {
    set({ messages: [], channels: new Set() });
  },

  setActiveChannel: (channel) => {
    set({ activeChannel: channel });
  },

  toggleScrollLock: () => {
    set((state) => ({ isScrollLocked: !state.isScrollLocked }));
  },

  setMaxMessages: (max) => {
    set({ maxMessages: max });
  },

  getMessagesByChannel: (channel) => {
    const state = get();
    return state.messages.filter(msg => msg.channel === channel);
  },

  getAllChannels: () => {
    const state = get();
    return Array.from(state.channels);
  }
}));
