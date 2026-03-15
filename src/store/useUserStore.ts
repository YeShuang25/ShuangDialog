import { create } from 'zustand';

interface UserState {
  currentUserId: string | null;
  isLoggedIn: boolean;
  setUserId: (id: string) => void;
  clearUser: () => void;
  checkLoginStatus: () => string | null;
}

export const useUserStore = create<UserState>((set, get) => ({
  currentUserId: null,
  isLoggedIn: false,
  
  setUserId: (id: string) => {
    set({ currentUserId: id, isLoggedIn: true });
  },
  
  clearUser: () => {
    set({ currentUserId: null, isLoggedIn: false });
  },
  
  checkLoginStatus: () => {
    const player = (window as any).Player;
    if (player && player.MemberNumber) {
      const userId = player.MemberNumber.toString();
      const currentId = get().currentUserId;
      
      if (currentId !== userId) {
        set({ currentUserId: userId, isLoggedIn: true });
      }
      return userId;
    }
    return null;
  }
}));

export function getStorageKey(baseKey: string, userId?: string): string {
  const id = userId || useUserStore.getState().currentUserId;
  if (id) {
    return `${baseKey}-${id}`;
  }
  return baseKey;
}

export function migrateOldConfig(userId: string): boolean {
  const oldKey = 'shuang-config-storage';
  const newKey = `${oldKey}-${userId}`;
  
  const oldData = localStorage.getItem(oldKey);
  const newData = localStorage.getItem(newKey);
  
  if (oldData && !newData) {
    try {
      const parsed = JSON.parse(oldData);
      if (parsed.state) {
        const migratedData = {
          followedPlayers: parsed.state.followedPlayers || [],
          fontScale: parsed.state.fontScale || 1.0,
          globalKeywords: parsed.state.globalKeywords || []
        };
        localStorage.setItem(newKey, JSON.stringify(migratedData));
        console.log(`[ShuangDialog] 迁移旧配置到 ${newKey}`);
        return true;
      }
    } catch (e) {
      console.error('[ShuangDialog] 迁移配置失败:', e);
    }
  }
  return false;
}

export function initUserStore(): Promise<string | null> {
  return new Promise((resolve) => {
    const checkPlayer = () => {
      const player = (window as any).Player;
      if (player && player.MemberNumber) {
        const userId = player.MemberNumber.toString();
        useUserStore.getState().setUserId(userId);
        console.log(`[ShuangDialog] 用户登录成功，ID: ${userId}`);
        resolve(userId);
        return true;
      }
      return false;
    };
    
    if (checkPlayer()) {
      return;
    }
    
    console.log('[ShuangDialog] 等待用户登录...');
    
    const interval = setInterval(() => {
      if (checkPlayer()) {
        clearInterval(interval);
      }
    }, 500);
  });
}

export function watchLoginStatus(): void {
  let lastUserId: string | null = null;
  
  setInterval(() => {
    const player = (window as any).Player;
    if (player && player.MemberNumber) {
      const currentUserId = player.MemberNumber.toString();
      
      if (lastUserId !== null && lastUserId !== currentUserId) {
        console.log(`[ShuangDialog] 检测到用户切换: ${lastUserId} -> ${currentUserId}`);
        window.location.reload();
        return;
      }
      
      lastUserId = currentUserId;
    }
  }, 1000);
}
