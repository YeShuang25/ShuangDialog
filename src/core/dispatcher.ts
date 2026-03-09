// 数据分发中心
import { GamePacket, SocketHook } from './types';
import { getCore } from './socket';
import { debug } from '../store/useDebugStore';

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
    debug.log('数据分发中心已连接', null, 'Dispatcher');
  }

  private handleDisconnect() {
    debug.log('数据分发中心已断开', null, 'Dispatcher');
  }

  private handleData(packet: any) {
    // 直接传递原始数据，不做类型分类
    const handlers = this.handlers.get('all');
    
    if (handlers) {
      handlers.forEach((handler, index) => {
        try {
          handler(packet);
        } catch (error) {
          debug.error(`处理器 ${index} 执行失败`, error, 'Dispatcher');
        }
      });
    }
  }

  private handleError(error: Error) {
    debug.error('数据分发中心错误', error, 'Dispatcher');
  }

  public subscribe(
    handler: (packet: any) => void
  ): () => void {
    const packetType = 'all';
    
    if (!this.handlers.has(packetType)) {
      this.handlers.set(packetType, new Set());
    }
    
    const handlers = this.handlers.get(packetType)!;
    handlers.add(handler);
    
    debug.log(`订阅所有事件，当前订阅者数量: ${handlers.size}`, handler, 'Dispatcher');

    // 返回取消订阅函数
    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(packetType);
      }
      debug.log(`取消订阅所有事件，剩余订阅者数量: ${handlers.size}`, null, 'Dispatcher');
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
