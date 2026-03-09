import { GamePacket, SocketHook } from './types';
import { debug } from '../store/useDebugStore';

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
      debug.log(`添加新的Socket Hook，当前Hook数量: ${hooks.length}`, hook, 'SocketCore');
    },
    emit(eventName: string, data: unknown) {
      // 分发数据给所有已注册的 hook
      const packet: GamePacket = {
        type: 'system', // 默认类型
        timestamp: Date.now(),
        data: { eventName, payload: data }
      };
      
      debug.log(`分发事件: ${eventName}`, data, 'SocketCore');
      
      hooks.forEach((hook, index) => {
        try {
          debug.log(`调用Hook ${index} 处理事件: ${eventName}`, null, 'SocketCore');
          hook.onData(packet);
        } catch (error) {
          debug.error(`Hook ${index} 处理事件 ${eventName} 时出错`, error, 'SocketCore');
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
    
    debug.log('[ShuangDialog] 正在挂载全局消息监听器 (核心劫持模式)...', null, 'SocketCore');

    const ServerSocket = (window as any).ServerSocket;
    
    // 1. 保存原本的处理函数
    const originalOnevent = ServerSocket.onevent;

    // 2. 重写 onevent 函数
    ServerSocket.onevent = function (packet: any) {
      // packet.data 是一个数组，格式为: ["事件名称", 数据对象1, 数据对象2...]
      const eventName = packet.data ? packet.data[0] : '未知事件';
      const eventData = packet.data ? packet.data[1] : null;

      // 调试信息输出
      debug.log(`[全局劫持] 捕获事件: ${eventName}`, eventData || packet.data, 'SocketHook');

      // 分发事件给注册的 hooks
      if (coreInstance) {
        coreInstance.emit(eventName, eventData);
      }

      // 3. 调用原本的函数，确保游戏正常运行
      // 这一步非常关键，相当于把消息继续往下传
      debug.log(`[全局劫持] 调用原始事件处理器`, null, 'SocketHook');
      originalOnevent.call(this, packet);
    };

    debug.log('[ShuangDialog] 全局监听器挂载成功！现在将捕获所有事件。', null, 'SocketCore');
  } else {
    debug.error('[ShuangDialog] ServerSocket 未初始化。', null, 'SocketCore');
  }

  return coreInstance;
}

/**
 * 获取核心模块实例
 */
export function getCore(): SocketCore | null {
  return coreInstance;
}
