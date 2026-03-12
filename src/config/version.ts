// 版本管理配置
export const APP_VERSION = 'v2.1';

// 版本历史记录
export const VERSION_HISTORY = [
  {
    version: 'v1.0',
    date: '2026-03-10',
    description: '初始版本 - 基础聊天窗口和悬浮球功能'
  },
  {
    version: 'v1.1',
    date: '2026-03-10',
    description: '修复调试模式日志输出问题，优化日志系统'
  },
  {
    version: 'v1.2',
    date: '2026-03-10',
    description: '添加BCEMsg内容过滤功能，减少日志噪音'
  },
  {
    version: 'v1.3',
    date: '2026-03-10',
    description: '添加Activity类型事件数据包下载功能'
  },
  {
    version: 'v1.4',
    date: '2026-03-11',
    description: '添加聊天对话框监控功能，支持消息变化监控和日志输出'
  },
  {
    version: 'v1.5',
    date: '2026-03-11',
    description: '修复聊天监控功能，支持Activity类型消息的正确解析'
  },
  {
    version: 'v1.6',
    date: '2026-03-11',
    description: '优化聊天监控功能，只监控ChatMessageChat类型的消息'
  },
  {
    version: 'v1.7',
    date: '2026-03-11',
    description: '添加聊天框导出功能，支持导出为HTML文件'
  },
  {
    version: 'v1.8',
    date: '2026-03-11',
    description: '优化聊天框导出功能，改进HTML格式化和可读性'
  },
  {
    version: 'v1.9',
    date: '2026-03-12',
    description: '更新版本号至v1.9'
  },
  {
    version: 'v1.10',
    date: '2026-03-12',
    description: '修复导出功能，支持原始消息内容的导出'
  },
  {
    version: 'v1.11',
    date: '2026-03-12',
    description: '重构导出功能，使用原始HTML结构保留完整信息'
  },
  {
    version: 'v1.12',
    date: '2026-03-12',
    description: '优化导出功能，添加成功提示通知'
  },
  {
    version: 'v2.0',
    date: '2026-03-12',
    description: '重构UI界面，简化悬浮球，删除聊天界面，改为菜单栏模式'
  },
  {
    version: 'v2.1',
    date: '2026-03-12',
    description: '修复聊天导出功能：解决时间和玩家ID贴在一起的问题，移除私聊末尾的多余信息，保留玩家名字颜色'
  }
];

// 获取当前版本信息
export function getVersionInfo() {
  return {
    version: APP_VERSION,
    buildDate: new Date().toISOString().split('T')[0],
    history: VERSION_HISTORY
  };
}