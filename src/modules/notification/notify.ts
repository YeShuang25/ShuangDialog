// 通知模块
import { NotificationPacket, GamePacket } from '../../core/types';
import { debug } from '../../store/useDebugStore';

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
}

export class NotificationManager {
  private isEnabled = false;
  private permission: NotificationPermission = 'default';
  private queue: NotificationPacket[] = [];

  constructor() {
    this.init();
  }

  private async init() {
    if ('Notification' in window) {
      this.permission = await Notification.requestPermission();
      this.isEnabled = this.permission === 'granted';
    } else {
      debug.warn('[ShuangDialog] 浏览器不支持通知API');
    }
  }

  public async requestPermission(): Promise<boolean> {
    if ('Notification' in window) {
      this.permission = await Notification.requestPermission();
      this.isEnabled = this.permission === 'granted';
      
      if (this.isEnabled) {
        this.processQueue();
      }
      
      return this.isEnabled;
    }
    return false;
  }

  public isNotificationEnabled(): boolean {
    return this.isEnabled;
  }

  public showNotification(packet: NotificationPacket): void {
    if (!this.isEnabled) {
      this.queue.push(packet);
      return;
    }

    const options: NotificationOptions = {
      title: packet.data.title,
      body: packet.data.content,
      tag: `shuang-dialog-${packet.timestamp}`,
      requireInteraction: packet.data.priority === 'high'
    };

    this.createBrowserNotification(options);
  }

  private createBrowserNotification(options: NotificationOptions): void {
    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || this.getDefaultIcon(),
        badge: options.badge,
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      notification.onshow = () => {
        debug.log('[ShuangDialog] 通知已显示:', options.title);
      };

      notification.onerror = (error) => {
          debug.error('[ShuangDialog] 通知显示失败:', error);
        };

      // 自动关闭低优先级通知
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }
    } catch (error) {
        debug.error('[ShuangDialog] 创建通知失败:', error);
      }
  }

  private getDefaultIcon(): string {
    // 返回默认图标，可以是base64或者URL
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyUzYuNDggMjIgMTIgMjJTMjIgMTcuNTIgMjIgMTJTMTcuNTIgMiAxMiAyWk0xMyAxN0gxMVYxMUgxM1YxN1pNMTMgOUgxMVY3SDEzVjlaIiBmaWxsPSIjNzc3Ii8+Cjwvc3ZnPgo=';
  }

  private processQueue(): void {
    while (this.queue.length > 0) {
      const packet = this.queue.shift();
      if (packet) {
        this.showNotification(packet);
      }
    }
  }

  public createNotificationPacket(
    title: string,
    content: string,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): NotificationPacket {
    return {
      type: 'notification',
      timestamp: Date.now(),
      data: {
        title,
        content,
        priority
      }
    };
  }

  public handleGamePacket(packet: GamePacket): void {
    // 根据游戏数据包创建通知
    if (packet.type === 'chat') {
      const chatPacket = packet as any;
      if (this.shouldNotifyForChat(chatPacket)) {
        const notification = this.createNotificationPacket(
          `来自 ${chatPacket.data.sender} 的消息`,
          chatPacket.data.message,
          'medium'
        );
        this.showNotification(notification);
      }
    }
  }

  private shouldNotifyForChat(chatPacket: any): boolean {
    // 判断是否应该为聊天消息显示通知
    // 例如：私聊消息、提及用户的消息等
    const message = chatPacket.data.message || '';
    const channel = chatPacket.data.channel || '';
    
    // 私聊消息总是通知
    if (channel.includes('whisper') || channel.includes('private')) {
      return true;
    }
    
    // 包含用户名的消息通知
    const username = this.getCurrentUsername();
    if (username && message.includes(`@${username}`)) {
      return true;
    }
    
    return false;
  }

  private getCurrentUsername(): string {
    // 获取当前用户名的逻辑
    // 这需要根据游戏的具体实现来调整
    return (window as any).gameUsername || '';
  }

  public clearQueue(): void {
    this.queue = [];
  }

  public getQueueLength(): number {
    return this.queue.length;
  }
}

// 全局通知管理器实例
let notificationManager: NotificationManager | null = null;

export function getNotificationManager(): NotificationManager {
  if (!notificationManager) {
    notificationManager = new NotificationManager();
  }
  return notificationManager;
}
