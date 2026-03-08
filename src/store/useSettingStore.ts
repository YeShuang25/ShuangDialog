// 存储用户设置
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChatSettings {
  fontSize: number;
  fontFamily: string;
  theme: 'light' | 'dark' | 'auto';
  showTimestamp: boolean;
  showChannel: boolean;
  autoScroll: boolean;
  maxMessages: number;
  opacity: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface NotificationSettings {
  enabled: boolean;
  privateMessages: boolean;
  mentions: boolean;
  systemMessages: boolean;
  sound: boolean;
  soundVolume: number;
}

export interface FilterSettings {
  enabled: boolean;
  rules: Array<{
    id: string;
    name: string;
    enabled: boolean;
    type: 'channel' | 'user' | 'keyword' | 'regex';
    pattern: string;
    action: 'hide' | 'highlight' | 'replace';
    replacement?: string;
    priority: number;
  }>;
}

export interface SettingsState {
  // 聊天设置
  chat: ChatSettings;
  
  // 通知设置
  notification: NotificationSettings;
  
  // 过滤设置
  filter: FilterSettings;
  
  // Actions
  updateChatSettings: (settings: Partial<ChatSettings>) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  updateFilterSettings: (settings: Partial<FilterSettings>) => void;
  resetSettings: () => void;
  exportSettings: () => string;
  importSettings: (settingsJson: string) => boolean;
}

const defaultChatSettings: ChatSettings = {
  fontSize: 14,
  fontFamily: 'Arial, sans-serif',
  theme: 'dark',
  showTimestamp: true,
  showChannel: true,
  autoScroll: true,
  maxMessages: 1000,
  opacity: 0.9,
  position: {
    x: 100,
    y: 100,
    width: 400,
    height: 600
  }
};

const defaultNotificationSettings: NotificationSettings = {
  enabled: true,
  privateMessages: true,
  mentions: true,
  systemMessages: false,
  sound: true,
  soundVolume: 0.5
};

const defaultFilterSettings: FilterSettings = {
  enabled: true,
  rules: []
};

export const useSettingStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      chat: defaultChatSettings,
      notification: defaultNotificationSettings,
      filter: defaultFilterSettings,

      updateChatSettings: (settings) => {
        set((state) => ({
          chat: { ...state.chat, ...settings }
        }));
      },

      updateNotificationSettings: (settings) => {
        set((state) => ({
          notification: { ...state.notification, ...settings }
        }));
      },

      updateFilterSettings: (settings) => {
        set((state) => ({
          filter: { ...state.filter, ...settings }
        }));
      },

      resetSettings: () => {
        set({
          chat: defaultChatSettings,
          notification: defaultNotificationSettings,
          filter: defaultFilterSettings
        });
      },

      exportSettings: () => {
        const state = get();
        return JSON.stringify({
          chat: state.chat,
          notification: state.notification,
          filter: state.filter
        }, null, 2);
      },

      importSettings: (settingsJson) => {
        try {
          const settings = JSON.parse(settingsJson);
          if (settings.chat) {
            get().updateChatSettings(settings.chat);
          }
          if (settings.notification) {
            get().updateNotificationSettings(settings.notification);
          }
          if (settings.filter) {
            get().updateFilterSettings(settings.filter);
          }
          return true;
        } catch (error) {
          console.error('[ShuangDialog] 设置导入失败:', error);
          return false;
        }
      }
    }),
    {
      name: 'shuang-dialog-settings',
      version: 1
    }
  )
);
