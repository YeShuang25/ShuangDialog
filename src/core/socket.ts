import { GamePacket, SocketHook } from './types';

// 核心模块 - Socket 连接管理
interface SocketCore {
  addHook(hook: SocketHook): void;
  emit(eventName: string, data: unknown): void;
  hooks: SocketHook[];
}

// 全局单例
let coreInstance: SocketCore | null = null;

/**
 * 创建核心 Socket 管理模块
 */
function createCore(): SocketCore {
  const hooks: SocketHook[] = [];

  return {
    hooks,
    addHook(hook: SocketHook) {
      hooks.push(hook);
    },
    emit(eventName: string, data: unknown) {
      // 分发数据给所有已注册的 hook
      const packet: GamePacket = {
        type: 'system', // 默认类型
        timestamp: Date.now(),
        data: { eventName, payload: data }
      };
      
      hooks.forEach(hook => {
        try {
          hook.onData(packet);
        } catch (error) {
          hook.onError(error as Error);
        }
      });
    }
  };
}

/**
 * 初始化核心模块并挂载 Socket Hook
 */
export function initCore(): SocketCore {
  if (coreInstance) {
    return coreInstance;
  }

  coreInstance = createCore();
  
  // 检查 Socket 是否存在
  if (typeof (window as any).ServerSocket !== 'undefined' && (window as any).ServerSocket !== null) {
    
    console.log('[ShuangDialog] 正在挂载全局消息监听器 (核心劫持模式)...');

    const ServerSocket = (window as any).ServerSocket;
    
    // 1. 保存原本的处理函数
    const originalOnevent = ServerSocket.onevent;

    // 2. 重写 onevent 函数
    ServerSocket.onevent = function (packet: any) {
      // packet.data 是一个数组，格式为: ["事件名称", 数据对象1, 数据对象2...]
      const eventName = packet.data ? packet.data[0] : '未知事件';
      const eventData = packet.data ? packet.data[1] : null;

      console.log(
        `%c[全局劫持] 事件: ${eventName}`,
        'color: red; font-weight: bold;',
        eventData || packet.data
      );

      // 分发事件给注册的 hooks
      if (coreInstance) {
        coreInstance.emit(eventName, eventData);
      }

      // 3. 调用原本的函数，确保游戏正常运行
      // 这一步非常关键，相当于把消息继续往下传
      originalOnevent.call(this, packet);
    };

    console.log('[ShuangDialog] 全局监听器挂载成功！现在将捕获所有事件。');
  } else {
    console.error('[ShuangDialog] ServerSocket 未初始化。');
  }

  return coreInstance;
}

/**
 * 获取核心模块实例
 */
export function getCore(): SocketCore | null {
  return coreInstance;
}
