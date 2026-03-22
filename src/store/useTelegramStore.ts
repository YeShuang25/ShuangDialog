import { create } from 'zustand';
import { telegramForwarder, TelegramConfig } from '../core/telegramForwarder';
import { useUserStore, getStorageKey } from './useUserStore';

interface ChatInfo {
  id: number;
  type: string;
  title?: string;
  username?: string;
  firstName?: string;
}

interface TelegramStore extends TelegramConfig {
  setBotToken: (token: string) => void;
  setChatId: (chatId: string) => void;
  setEnabled: (enabled: boolean) => void;
  setFilterEnabled: (filterEnabled: boolean) => void;
  setCommandEnabled: (commandEnabled: boolean) => void;
  loadConfig: () => void;
  saveConfig: () => void;
  testConnection: () => Promise<{ success: boolean; message: string }>;
  fetchChatIds: () => Promise<{ 
    success: boolean; 
    chats?: ChatInfo[];
    message?: string;
    error?: string;
  }>;
}

const BASE_STORAGE_KEY = 'shuang-dialog-telegram-config';

export const useTelegramStore = create<TelegramStore>((set, get) => ({
  botToken: '',
  chatId: '',
  enabled: false,
  filterEnabled: true,
  commandEnabled: false,

  setBotToken: (token) => {
    set({ botToken: token });
    get().saveConfig();
    telegramForwarder.setConfig({ botToken: token });
  },

  setChatId: (chatId) => {
    set({ chatId });
    get().saveConfig();
    telegramForwarder.setConfig({ chatId });
  },

  setEnabled: (enabled) => {
    set({ enabled });
    get().saveConfig();
    telegramForwarder.setConfig({ enabled });
  },

  setFilterEnabled: (filterEnabled) => {
    set({ filterEnabled });
    get().saveConfig();
    telegramForwarder.setConfig({ filterEnabled });
  },

  setCommandEnabled: (commandEnabled) => {
    set({ commandEnabled });
    get().saveConfig();
    telegramForwarder.setConfig({ commandEnabled });
  },

  loadConfig: () => {
    const userId = useUserStore.getState().currentUserId;
    if (!userId) return;
    
    try {
      const key = getStorageKey(BASE_STORAGE_KEY, userId);
      const saved = localStorage.getItem(key);
      if (saved) {
        const config = JSON.parse(saved);
        set(config);
        telegramForwarder.setConfig(config);
      }
    } catch (e) {
      console.error('[TelegramStore] 加载配置失败:', e);
    }
  },

  saveConfig: () => {
    const userId = useUserStore.getState().currentUserId;
    if (!userId) return;
    
    try {
      const key = getStorageKey(BASE_STORAGE_KEY, userId);
      const { botToken, chatId, enabled, filterEnabled, commandEnabled } = get();
      localStorage.setItem(key, JSON.stringify({ botToken, chatId, enabled, filterEnabled, commandEnabled }));
    } catch (e) {
      console.error('[TelegramStore] 保存配置失败:', e);
    }
  },

  testConnection: async () => {
    const { botToken, chatId } = get();
    telegramForwarder.setConfig({ botToken, chatId });
    return telegramForwarder.testConnection();
  },

  fetchChatIds: async () => {
    const { botToken } = get();
    telegramForwarder.setConfig({ botToken });
    return telegramForwarder.fetchChatIds();
  }
}));
