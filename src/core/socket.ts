// Socket Hook 逻辑 - 核心数据监听中枢
import { GamePacket, SocketHook } from './types';

export class GameSocketCore {
  private hooks: SocketHook[] = [];
  private isConnected = false;

  constructor() {
    this.initSocketConnection();
  }

  private initSocketConnection() {
    // 这里实现与游戏socket的连接逻辑
    // 具体实现取决于游戏的API
    this.connectToGameSocket();
  }

  private connectToGameSocket() {
    // 模拟socket连接
    // 实际实现需要根据游戏的socket API来调整
    try {
      // 假设游戏提供了全局的socket对象
      if (typeof window !== 'undefined' && (window as any).gameSocket) {
        const gameSocket = (window as any).gameSocket;
        
        gameSocket.on('connect', () => {
          this.isConnected = true;
          this.hooks.forEach(hook => hook.onConnect());
        });

        gameSocket.on('disconnect', () => {
          this.isConnected = false;
          this.hooks.forEach(hook => hook.onDisconnect());
        });

        gameSocket.on('data', (rawData: unknown) => {
          const packet = this.parseGameData(rawData);
          if (packet) {
            this.hooks.forEach(hook => hook.onData(packet));
          }
        });

        gameSocket.on('error', (error: Error) => {
          this.hooks.forEach(hook => hook.onError(error));
        });
      } else {
        console.warn('[ShuangDialog] 游戏socket对象未找到，使用模拟模式');
        this.startSimulationMode();
      }
    } catch (error) {
      console.error('[ShuangDialog] Socket连接失败:', error);
      this.hooks.forEach(hook => hook.onError(error as Error));
    }
  }

  private startSimulationMode() {
    // 模拟模式，用于开发和测试
    console.log('[ShuangDialog] 启动模拟模式');
    setInterval(() => {
      if (this.isConnected && this.hooks.length > 0) {
        const mockPacket: GamePacket = {
          type: 'chat',
          timestamp: Date.now(),
          data: {
            channel: 'world',
            sender: '测试用户',
            message: '这是一条测试消息',
            timestamp: Date.now()
          }
        };
        this.hooks.forEach(hook => hook.onData(mockPacket));
      }
    }, 5000);
  }

  private parseGameData(rawData: unknown): GamePacket | null {
    try {
      // 这里实现数据包解析逻辑
      // 根据实际的游戏数据格式来调整
      if (typeof rawData === 'object' && rawData !== null) {
        const data = rawData as any;
        return {
          type: data.type || 'system',
          timestamp: data.timestamp || Date.now(),
          data: data.data || data
        };
      }
      return null;
    } catch (error) {
      console.error('[ShuangDialog] 数据解析失败:', error);
      return null;
    }
  }

  public addHook(hook: SocketHook): void {
    this.hooks.push(hook);
  }

  public removeHook(hook: SocketHook): void {
    const index = this.hooks.indexOf(hook);
    if (index > -1) {
      this.hooks.splice(index, 1);
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// 全局核心实例
let coreInstance: GameSocketCore | null = null;

export function initCore(): GameSocketCore {
  if (!coreInstance) {
    coreInstance = new GameSocketCore();
  }
  return coreInstance;
}

export function getCore(): GameSocketCore | null {
  return coreInstance;
}
