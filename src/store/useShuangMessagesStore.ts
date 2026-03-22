import { create } from 'zustand';

export interface ReplyInfo {
  senderName: string;
  content: string;
}

export interface ShuangMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  originalContent?: string;
  timestamp: string;
  originalElement: HTMLElement;
  type: 'chat' | 'emote' | 'activity' | 'whisper' | 'private' | 'other';
  replyInfo?: ReplyInfo;
}

interface ShuangMessagesState {
  messages: ShuangMessage[];
  addMessage: (message: ShuangMessage) => void;
  removeMessage: (id: string) => void;
  clearMessages: () => void;
  getMessagesBySenderId: (senderId: string) => ShuangMessage[];
}

export const useShuangMessagesStore = create<ShuangMessagesState>((set, get) => ({
  messages: [],
  
  addMessage: (message: ShuangMessage) => {
    set((state) => ({
      messages: [...state.messages, message]
    }));
  },
  
  removeMessage: (id: string) => {
    set((state) => ({
      messages: state.messages.filter(msg => msg.id !== id)
    }));
  },
  
  clearMessages: () => {
    set({ messages: [] });
  },
  
  getMessagesBySenderId: (senderId: string) => {
    return get().messages.filter(msg => msg.senderId === senderId);
  }
}));
