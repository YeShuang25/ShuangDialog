import { create } from 'zustand';
import { telegramForwarder, TelegramConfig } from '../core/telegramForwarder';

interface TelegramStore extends TelegramConfig {
  setBotToken: (token: string) => void;
  setChatId: (chatId: string) => void;
  setEnabled: (enabled: boolean) => void;
  setFilterEnabled: (filterEnabled: boolean) => void;
  loadConfig: () => void;
  saveConfig: () => void;
  testConnection: () => Promise<{ success: boolean; message: string }>;
}

const STORAGE_KEY = 'shuang-dialog-telegram-config';

export const useTelegramStore = create<TelegramStore>((set, get) => ({
  botToken: '',
  chatId: '',
  enabled: false,
  filterEnabled: true,

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

  loadConfig: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
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
    try {
      const { botToken, chatId, enabled, filterEnabled } = get();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ botToken, chatId, enabled, filterEnabled }));
    } catch (e) {
      console.error('[TelegramStore] 保存配置失败:', e);
    }
  },

  testConnection: async () => {
    const { botToken, chatId } = get();
    telegramForwarder.setConfig({ botToken, chatId });
    return telegramForwarder.testConnection();
  }
}));
