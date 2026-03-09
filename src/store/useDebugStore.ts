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

// 导出调试工具函数
export const debug = {
  log: (message: string, data?: unknown, source?: string) => {
    const { debugMode } = useDebugStore.getState();
    if (debugMode) {
      const timestamp = new Date().toISOString();
      const sourceText = source ? `[${source}] ` : '';
      console.log(`🔍 ${timestamp} ${sourceText}${message}`, data || '');
    }
  },
  
  info: (message: string, data?: unknown, source?: string) => {
    const { debugMode } = useDebugStore.getState();
    if (debugMode) {
      const timestamp = new Date().toISOString();
      const sourceText = source ? `[${source}] ` : '';
      console.info(`ℹ️ ${timestamp} ${sourceText}${message}`, data || '');
    }
  },
  
  warn: (message: string, data?: unknown, source?: string) => {
    const { debugMode } = useDebugStore.getState();
    if (debugMode) {
      const timestamp = new Date().toISOString();
      const sourceText = source ? `[${source}] ` : '';
      console.warn(`⚠️ ${timestamp} ${sourceText}${message}`, data || '');
    }
  },
  
  error: (message: string, data?: unknown, source?: string) => {
    const { debugMode } = useDebugStore.getState();
    if (debugMode) {
      const timestamp = new Date().toISOString();
      const sourceText = source ? `[${source}] ` : '';
      console.error(`❌ ${timestamp} ${sourceText}${message}`, data || '');
    }
  }
};