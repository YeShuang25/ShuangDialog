// 游戏数据包类型定义

export interface GamePacket {
  type: 'chat' | 'system' | 'notification' | 'combat';
  timestamp: number;
  data: unknown;
}

export interface ChatPacket extends GamePacket {
  type: 'chat';
  data: {
    channel: string;
    sender: string;
    message: string;
    timestamp: number;
  };
}

export interface SystemPacket extends GamePacket {
  type: 'system';
  data: {
    message: string;
    level: 'info' | 'warning' | 'error';
  };
}

export interface NotificationPacket extends GamePacket {
  type: 'notification';
  data: {
    title: string;
    content: string;
    priority: 'low' | 'medium' | 'high';
  };
}

export interface SocketHook {
  onConnect: () => void;
  onDisconnect: () => void;
  onData: (packet: any) => void;
  onError: (error: Error) => void;
}
