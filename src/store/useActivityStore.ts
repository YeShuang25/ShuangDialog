import { create } from 'zustand';

interface ActivityData {
  id: string;
  timestamp: number;
  eventName: string;
  data: unknown;
}

interface ActivityStore {
  activityPackets: ActivityData[];
  addActivityPacket: (eventName: string, data: unknown) => void;
  clearActivityPackets: () => void;
  getActivityPacketsAsJSON: () => string;
}

export const useActivityStore = create<ActivityStore>((set, get) => ({
  activityPackets: [],
  
  addActivityPacket: (eventName: string, data: unknown) => {
    const newPacket: ActivityData = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      eventName,
      data
    };
    
    set((state) => ({
      activityPackets: [...state.activityPackets, newPacket]
    }));
  },
  
  clearActivityPackets: () => {
    set({ activityPackets: [] });
  },
  
  getActivityPacketsAsJSON: () => {
    const { activityPackets } = get();
    return JSON.stringify(activityPackets, null, 2);
  }
}));