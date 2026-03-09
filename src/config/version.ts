// 版本管理配置
export const APP_VERSION = 'v1.0';

// 版本历史记录
export const VERSION_HISTORY = [
  {
    version: 'v1.0',
    date: '2026-03-10',
    description: '初始版本 - 基础聊天窗口和悬浮球功能'
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