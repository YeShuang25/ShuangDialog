import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MessageTypeFilter = 'chat' | 'emote' | 'activity' | 'other';

export interface FollowedPlayer {
  id: string;
  name: string;
  messageTypes: MessageTypeFilter[];
  contentMatch: boolean;
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
  addFollowedPlayer: (id: string, name?: string) => void;
  removeFollowedPlayer: (id: string) => void;
  updatePlayerName: (id: string, name: string) => void;
  togglePlayerMessageType: (playerId: string, messageType: MessageTypeFilter) => void;
  setPlayerMessageTypes: (playerId: string, messageTypes: MessageTypeFilter[]) => void;
  togglePlayerContentMatch: (playerId: string) => void;
  isPlayerFollowed: (id: string) => boolean;
  getPlayerMessageTypes: (id: string) => MessageTypeFilter[];
  setFontScale: (scale: number) => void;
}

export const useShuangConfigStore = create<ShuangConfigState>()(
  persist(
    (set, get) => ({
      followedPlayers: [],
      fontScale: 1.0,
      
      addFollowedPlayer: (id: string, name: string = '') => {
        set((state) => {
          if (state.followedPlayers.some(p => p.id === id)) {
            return state;
          }
          return {
            followedPlayers: [...state.followedPlayers, {
              id,
              name: name || id,
              messageTypes: [...ALL_MESSAGE_TYPES],
              contentMatch: false
            }]
          };
        });
      },
      
      removeFollowedPlayer: (id: string) => {
        set((state) => ({
          followedPlayers: state.followedPlayers.filter(p => p.id !== id)
        }));
      },
      
      updatePlayerName: (id: string, name: string) => {
        set((state) => ({
          followedPlayers: state.followedPlayers.map(p => 
            p.id === id ? { ...p, name } : p
          )
        }));
      },
      
      togglePlayerMessageType: (playerId: string, messageType: MessageTypeFilter) => {
        set((state) => ({
          followedPlayers: state.followedPlayers.map(p => {
            if (p.id !== playerId) return p;
            const types = p.messageTypes;
            const newTypes = types.includes(messageType)
              ? types.filter(t => t !== messageType)
              : [...types, messageType];
            return { ...p, messageTypes: newTypes };
          })
        }));
      },
      
      setPlayerMessageTypes: (playerId: string, messageTypes: MessageTypeFilter[]) => {
        set((state) => ({
          followedPlayers: state.followedPlayers.map(p => 
            p.id === playerId ? { ...p, messageTypes } : p
          )
        }));
      },
      
      togglePlayerContentMatch: (playerId: string) => {
        set((state) => ({
          followedPlayers: state.followedPlayers.map(p => 
            p.id === playerId ? { ...p, contentMatch: !p.contentMatch } : p
          )
        }));
      },
      
      isPlayerFollowed: (id: string) => {
        return get().followedPlayers.some(p => p.id === id);
      },
      
      getPlayerMessageTypes: (id: string) => {
        const player = get().followedPlayers.find(p => p.id === id);
        return player ? player.messageTypes : [];
      },
      
      setFontScale: (scale: number) => {
        set({ fontScale: Math.max(0.5, Math.min(2.0, scale)) });
      }
    }),
    {
      name: 'shuang-config-storage',
      migrate: (persisted: any) => {
        if (persisted.followedPlayerIds && Array.isArray(persisted.followedPlayerIds)) {
          persisted.followedPlayers = persisted.followedPlayerIds.map((id: string) => ({
            id,
            name: id,
            messageTypes: [...ALL_MESSAGE_TYPES],
            contentMatch: false
          }));
          delete persisted.followedPlayerIds;
        }
        if (persisted.followedPlayers && Array.isArray(persisted.followedPlayers)) {
          persisted.followedPlayers = persisted.followedPlayers.map((p: any) => ({
            ...p,
            contentMatch: p.contentMatch ?? false
          }));
        }
        return persisted;
      }
    }
  )
);
