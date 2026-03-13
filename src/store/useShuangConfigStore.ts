import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ShuangConfigState {
  followedPlayerIds: string[];
  fontScale: number;
  addFollowedPlayerId: (playerId: string) => void;
  removeFollowedPlayerId: (playerId: string) => void;
  setFollowedPlayerIds: (playerIds: string[]) => void;
  isPlayerFollowed: (playerId: string) => boolean;
  setFontScale: (scale: number) => void;
}

export const useShuangConfigStore = create<ShuangConfigState>()(
  persist(
    (set, get) => ({
      followedPlayerIds: [],
      fontScale: 1.0,
      
      addFollowedPlayerId: (playerId: string) => {
        set((state) => {
          if (state.followedPlayerIds.includes(playerId)) {
            return state;
          }
          return {
            followedPlayerIds: [...state.followedPlayerIds, playerId]
          };
        });
      },
      
      removeFollowedPlayerId: (playerId: string) => {
        set((state) => ({
          followedPlayerIds: state.followedPlayerIds.filter(id => id !== playerId)
        }));
      },
      
      setFollowedPlayerIds: (playerIds: string[]) => {
        set({ followedPlayerIds: playerIds });
      },
      
      isPlayerFollowed: (playerId: string) => {
        return get().followedPlayerIds.includes(playerId);
      },
      
      setFontScale: (scale: number) => {
        set({ fontScale: Math.max(0.5, Math.min(2.0, scale)) });
      }
    }),
    {
      name: 'shuang-config-storage',
    }
  )
);
