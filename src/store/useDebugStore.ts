import { create } from 'zustand';

interface DebugState {
  debugMode: boolean;
  toggleDebugMode: () => void;
  setDebugMode: (enabled: boolean) => void;
}

export const useDebugStore = create<DebugState>((set) => ({
  debugMode: false,
  toggleDebugMode: () => set((state) => ({ debugMode: !state.debugMode })),
  setDebugMode: (enabled: boolean) => set({ debugMode: enabled })
}));

import { logger } from '../utils/logger';

// 导出调试工具函数
export const debug = {
  log: (message: string, data?: unknown, source?: string) => {
    const { debugMode } = useDebugStore.getState();
    if (debugMode) {
      logger.debug(message, data, source);
    }
  },
  
  info: (message: string, data?: unknown, source?: string) => {
    const { debugMode } = useDebugStore.getState();
    if (debugMode) {
      logger.info(message, data, source);
    }
  },
  
  warn: (message: string, data?: unknown, source?: string) => {
    const { debugMode } = useDebugStore.getState();
    if (debugMode) {
      logger.warn(message, data, source);
    }
  },
  
  error: (message: string, data?: unknown, source?: string) => {
    const { debugMode } = useDebugStore.getState();
    if (debugMode) {
      logger.error(message, data, source);
    }
  }
};