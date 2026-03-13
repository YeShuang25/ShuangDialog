import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ShuangConfigState {
  followedPlayerIds: string[];
  addFollowedPlayerId: (playerId: string) => void;
  removeFollowedPlayerId: (playerId: string) => void;
  setFollowedPlayerIds: (playerIds: string[]) => void;
  isPlayerFollowed: (playerId: string) => boolean;
}

export const useShuangConfigStore = create<ShuangConfigState>()(
  persist(
    (set, get) => ({
      followedPlayerIds: [],
      
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
      }
    }),
    {
      name: 'shuang-config-storage',
    }
  )
);
