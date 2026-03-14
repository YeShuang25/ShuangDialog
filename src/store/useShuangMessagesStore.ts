import { create } from 'zustand';

export interface ShuangMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  originalElement: HTMLElement;
  originalHTML: string;
  type: 'chat' | 'activity' | 'whisper' | 'private';
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
