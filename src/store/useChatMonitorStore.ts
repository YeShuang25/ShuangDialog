import { create } from 'zustand';

interface ChatMonitorState {
  chatMonitorEnabled: boolean;
  toggleChatMonitor: () => void;
  setChatMonitorEnabled: (enabled: boolean) => void;
}

export const useChatMonitorStore = create<ChatMonitorState>((set) => ({
  chatMonitorEnabled: false,
  toggleChatMonitor: () => set((state) => ({ chatMonitorEnabled: !state.chatMonitorEnabled })),
  setChatMonitorEnabled: (enabled: boolean) => set({ chatMonitorEnabled: enabled })
}));

import { logger } from '../utils/logger';

// 导出聊天监控工具函数
export const chatMonitor = {
  log: (message: string, data?: unknown, source: string = 'ChatMonitor') => {
    const { chatMonitorEnabled } = useChatMonitorStore.getState();
    if (chatMonitorEnabled) {
      logger.debug(message, data, source);
    }
  },
  
  info: (message: string, data?: unknown, source: string = 'ChatMonitor') => {
    const { chatMonitorEnabled } = useChatMonitorStore.getState();
    if (chatMonitorEnabled) {
      logger.info(message, data, source);
    }
  },
  
  warn: (message: string, data?: unknown, source: string = 'ChatMonitor') => {
    const { chatMonitorEnabled } = useChatMonitorStore.getState();
    if (chatMonitorEnabled) {
      logger.warn(message, data, source);
    }
  },
  
  error: (message: string, data?: unknown, source: string = 'ChatMonitor') => {
    const { chatMonitorEnabled } = useChatMonitorStore.getState();
    if (chatMonitorEnabled) {
      logger.error(message, data, source);
    }
  }
};
