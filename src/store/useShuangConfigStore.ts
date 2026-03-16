import { create } from 'zustand';
import { useUserStore, getStorageKey } from './useUserStore';

export type MessageTypeFilter = 'chat' | 'emote' | 'activity' | 'other';

export type MessageFilterStatus = 'enabled' | 'excluded' | 'disabled';

export interface FollowedPlayer {
  id: string;
  name: string;
  messageTypes: MessageTypeFilter[];
  excludedMessageTypes: MessageTypeFilter[];
  contentMatch: boolean;
  excludeMatch: boolean;
}

export const ALL_MESSAGE_TYPES: MessageTypeFilter[] = ['chat', 'emote', 'activity', 'other'];

const MESSAGE_TYPE_LABELS: Record<MessageTypeFilter, string> = {
  chat: '对话',
  emote: 'Emote',
  activity: '动作',
  other: '其他'
};

export const getMessageTypeLabel = (type: MessageTypeFilter): string => MESSAGE_TYPE_LABELS[type];

interface ShuangConfigState {
  followedPlayers: FollowedPlayer[];
  fontScale: number;
  globalKeywords: string[];
  addFollowedPlayer: (id: string, name?: string) => void;
  removeFollowedPlayer: (id: string) => void;
  updatePlayerName: (id: string, name: string) => void;
  togglePlayerMessageType: (playerId: string, messageType: MessageTypeFilter) => void;
  setPlayerMessageTypes: (playerId: string, messageTypes: MessageTypeFilter[]) => void;
  togglePlayerMessageTypeExclude: (playerId: string, messageType: MessageTypeFilter) => void;
  setPlayerMessageTypeStatus: (playerId: string, messageType: MessageTypeFilter, status: MessageFilterStatus) => void;
  togglePlayerContentMatch: (playerId: string) => void;
  togglePlayerExcludeMatch: (playerId: string) => void;
  setGlobalKeywords: (keywords: string[]) => void;
  isPlayerFollowed: (id: string) => boolean;
  getPlayerMessageTypes: (id: string) => MessageTypeFilter[];
  setFontScale: (scale: number) => void;
  loadUserConfig: () => void;
}

const BASE_STORAGE_KEY = 'shuang-config-storage';

function loadFromStorage(userId: string | null): { followedPlayers: FollowedPlayer[]; fontScale: number; globalKeywords: string[] } | null {
  if (!userId) return null;
  
  const key = getStorageKey(BASE_STORAGE_KEY, userId);
  const str = localStorage.getItem(key);
  if (!str) return null;
  
  try {
    const data = JSON.parse(str);
    const migratedPlayers = (data.followedPlayers || []).map((p: any) => ({
      ...p,
      excludedMessageTypes: p.excludedMessageTypes || [],
      excludeMatch: p.excludeMatch || false
    }));
    return {
      followedPlayers: migratedPlayers,
      fontScale: data.fontScale || 1.0,
      globalKeywords: data.globalKeywords || []
    };
  } catch {
    return null;
  }
}

function saveToStorage(userId: string | null, state: { followedPlayers: FollowedPlayer[]; fontScale: number; globalKeywords: string[] }) {
  if (!userId) return;
  
  const key = getStorageKey(BASE_STORAGE_KEY, userId);
  localStorage.setItem(key, JSON.stringify(state));
  console.log(`[ShuangDialog] 保存配置到 ${key}`);
}

export const useShuangConfigStore = create<ShuangConfigState>()((set, get) => ({
  followedPlayers: [],
  fontScale: 1.0,
  globalKeywords: [],
  
  addFollowedPlayer: (id: string, name: string = '') => {
    set((state) => {
      if (state.followedPlayers.some(p => p.id === id)) {
        return state;
      }
      const newState = {
        ...state,
        followedPlayers: [...state.followedPlayers, {
          id,
          name: name || id,
          messageTypes: [...ALL_MESSAGE_TYPES],
          excludedMessageTypes: [],
          contentMatch: true,
          excludeMatch: false
        }]
      };
      saveToStorage(useUserStore.getState().currentUserId, {
        followedPlayers: newState.followedPlayers,
        fontScale: newState.fontScale,
        globalKeywords: newState.globalKeywords
      });
      return newState;
    });
  },
  
  removeFollowedPlayer: (id: string) => {
    set((state) => {
      const newState = {
        ...state,
        followedPlayers: state.followedPlayers.filter(p => p.id !== id)
      };
      saveToStorage(useUserStore.getState().currentUserId, {
        followedPlayers: newState.followedPlayers,
        fontScale: newState.fontScale,
        globalKeywords: newState.globalKeywords
      });
      return newState;
    });
  },
  
  updatePlayerName: (id: string, name: string) => {
    set((state) => {
      const newState = {
        ...state,
        followedPlayers: state.followedPlayers.map(p => 
          p.id === id ? { ...p, name } : p
        )
      };
      saveToStorage(useUserStore.getState().currentUserId, {
        followedPlayers: newState.followedPlayers,
        fontScale: newState.fontScale,
        globalKeywords: newState.globalKeywords
      });
      return newState;
    });
  },
  
  togglePlayerMessageType: (playerId: string, messageType: MessageTypeFilter) => {
    set((state) => {
      const newState = {
        ...state,
        followedPlayers: state.followedPlayers.map(p => {
          if (p.id !== playerId) return p;
          const types = p.messageTypes;
          const newTypes = types.includes(messageType)
            ? types.filter(t => t !== messageType)
            : [...types, messageType];
          return { ...p, messageTypes: newTypes };
        })
      };
      saveToStorage(useUserStore.getState().currentUserId, {
        followedPlayers: newState.followedPlayers,
        fontScale: newState.fontScale,
        globalKeywords: newState.globalKeywords
      });
      return newState;
    });
  },
  
  setPlayerMessageTypes: (playerId: string, messageTypes: MessageTypeFilter[]) => {
    set((state) => {
      const newState = {
        ...state,
        followedPlayers: state.followedPlayers.map(p => 
          p.id === playerId ? { ...p, messageTypes } : p
        )
      };
      saveToStorage(useUserStore.getState().currentUserId, {
        followedPlayers: newState.followedPlayers,
        fontScale: newState.fontScale,
        globalKeywords: newState.globalKeywords
      });
      return newState;
    });
  },
  
  togglePlayerMessageTypeExclude: (playerId: string, messageType: MessageTypeFilter) => {
    set((state) => {
      const newState = {
        ...state,
        followedPlayers: state.followedPlayers.map(p => {
          if (p.id !== playerId) return p;
          const excludedTypes = p.excludedMessageTypes || [];
          const newExcludedTypes = excludedTypes.includes(messageType)
            ? excludedTypes.filter(t => t !== messageType)
            : [...excludedTypes, messageType];
          return { ...p, excludedMessageTypes: newExcludedTypes };
        })
      };
      saveToStorage(useUserStore.getState().currentUserId, {
        followedPlayers: newState.followedPlayers,
        fontScale: newState.fontScale,
        globalKeywords: newState.globalKeywords
      });
      return newState;
    });
  },
  
  setPlayerMessageTypeStatus: (playerId: string, messageType: MessageTypeFilter, status: MessageFilterStatus) => {
    set((state) => {
      const newState = {
        ...state,
        followedPlayers: state.followedPlayers.map(p => {
          if (p.id !== playerId) return p;
          let newTypes = p.messageTypes.filter(t => t !== messageType);
          let newExcludedTypes = (p.excludedMessageTypes || []).filter(t => t !== messageType);
          
          if (status === 'enabled') {
            newTypes = [...newTypes, messageType];
          } else if (status === 'excluded') {
            newExcludedTypes = [...newExcludedTypes, messageType];
          }
          
          return { ...p, messageTypes: newTypes, excludedMessageTypes: newExcludedTypes };
        })
      };
      saveToStorage(useUserStore.getState().currentUserId, {
        followedPlayers: newState.followedPlayers,
        fontScale: newState.fontScale,
        globalKeywords: newState.globalKeywords
      });
      return newState;
    });
  },
  
  togglePlayerContentMatch: (playerId: string) => {
    set((state) => {
      const newState = {
        ...state,
        followedPlayers: state.followedPlayers.map(p => 
          p.id === playerId ? { ...p, contentMatch: !p.contentMatch } : p
        )
      };
      saveToStorage(useUserStore.getState().currentUserId, {
        followedPlayers: newState.followedPlayers,
        fontScale: newState.fontScale,
        globalKeywords: newState.globalKeywords
      });
      return newState;
    });
  },
  
  togglePlayerExcludeMatch: (playerId: string) => {
    set((state) => {
      const newState = {
        ...state,
        followedPlayers: state.followedPlayers.map(p => 
          p.id === playerId ? { ...p, excludeMatch: !p.excludeMatch } : p
        )
      };
      saveToStorage(useUserStore.getState().currentUserId, {
        followedPlayers: newState.followedPlayers,
        fontScale: newState.fontScale,
        globalKeywords: newState.globalKeywords
      });
      return newState;
    });
  },
  
  setGlobalKeywords: (keywords: string[]) => {
    set((state) => {
      const newState = { ...state, globalKeywords: keywords };
      saveToStorage(useUserStore.getState().currentUserId, {
        followedPlayers: newState.followedPlayers,
        fontScale: newState.fontScale,
        globalKeywords: newState.globalKeywords
      });
      return newState;
    });
  },
  
  isPlayerFollowed: (id: string) => {
    return get().followedPlayers.some(p => p.id === id);
  },
  
  getPlayerMessageTypes: (id: string) => {
    const player = get().followedPlayers.find(p => p.id === id);
    return player ? player.messageTypes : [];
  },
  
  setFontScale: (scale: number) => {
    set((state) => {
      const newState = { ...state, fontScale: Math.max(0.5, Math.min(2.0, scale)) };
      saveToStorage(useUserStore.getState().currentUserId, {
        followedPlayers: newState.followedPlayers,
        fontScale: newState.fontScale,
        globalKeywords: newState.globalKeywords
      });
      return newState;
    });
  },
  
  loadUserConfig: () => {
    const userId = useUserStore.getState().currentUserId;
    console.log(`[ShuangDialog] 加载用户 ${userId} 的配置...`);
    
    const data = loadFromStorage(userId);
    if (data) {
      set({
        followedPlayers: data.followedPlayers,
        fontScale: data.fontScale,
        globalKeywords: data.globalKeywords
      });
      console.log(`[ShuangDialog] 配置加载完成:`, data);
    } else {
      set({
        followedPlayers: [],
        fontScale: 1.0,
        globalKeywords: []
      });
      console.log(`[ShuangDialog] 用户 ${userId} 无保存配置，使用默认值`);
    }
  }
}));
