// 数据分发中心
import { GamePacket, SocketHook } from './types';
import { getCore } from './socket';

export type PacketHandler<T extends GamePacket = GamePacket> = (packet: T) => void;

export class DataDispatcher {
  private handlers: Map<string, Set<PacketHandler>> = new Map();

  constructor() {
    this.init();
  }

  private init() {
    const core = getCore();
    if (core) {
      const hook: SocketHook = {
        onConnect: () => this.handleConnect(),
        onDisconnect: () => this.handleDisconnect(),
        onData: (packet) => this.handleData(packet),
        onError: (error) => this.handleError(error)
      };
      core.addHook(hook);
    }
  }

  private handleConnect() {
    console.log('[ShuangDialog] 数据分发中心已连接');
  }

  private handleDisconnect() {
    console.log('[ShuangDialog] 数据分发中心已断开');
  }

  private handleData(packet: GamePacket) {
    const handlers = this.handlers.get(packet.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(packet);
        } catch (error) {
          console.error('[ShuangDialog] 处理器执行失败:', error);
        }
      });
    }
  }

  private handleError(error: Error) {
    console.error('[ShuangDialog] 数据分发中心错误:', error);
  }

  public subscribe<T extends GamePacket>(
    packetType: T['type'], 
    handler: PacketHandler<T>
  ): () => void {
    if (!this.handlers.has(packetType)) {
      this.handlers.set(packetType, new Set());
    }
    
    const handlers = this.handlers.get(packetType)!;
    handlers.add(handler as PacketHandler);

    // 返回取消订阅函数
    return () => {
      handlers.delete(handler as PacketHandler);
      if (handlers.size === 0) {
        this.handlers.delete(packetType);
      }
    };
  }

  public getSubscribedTypes(): string[] {
    return Array.from(this.handlers.keys());
  }
}

// 全局分发器实例
let dispatcherInstance: DataDispatcher | null = null;

export function getDispatcher(): DataDispatcher {
  if (!dispatcherInstance) {
    dispatcherInstance = new DataDispatcher();
  }
  return dispatcherInstance;
}
