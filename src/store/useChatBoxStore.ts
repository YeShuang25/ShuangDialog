import { create } from 'zustand';

interface ChatBoxState {
  chatBoxEnabled: boolean;
  toggleChatBox: () => void;
  setChatBoxEnabled: (enabled: boolean) => void;
}

export const useChatBoxStore = create<ChatBoxState>((set) => ({
  chatBoxEnabled: false,
  toggleChatBox: () => set((state) => ({ chatBoxEnabled: !state.chatBoxEnabled })),
  setChatBoxEnabled: (enabled: boolean) => set({ chatBoxEnabled: enabled })
}));
