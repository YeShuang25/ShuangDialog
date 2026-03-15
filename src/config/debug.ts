export type DebugModule = 'SHUANG_CHAT_BOX' | 'CHAT_EXPORTER' | 'FLOATING_BALL' | 'MESSAGE_FILTER';

const debugState: Record<DebugModule, boolean> = {
  SHUANG_CHAT_BOX: false,
  CHAT_EXPORTER: false,
  FLOATING_BALL: false,
  MESSAGE_FILTER: false,
};

export const DEBUG_CONFIG = debugState;

export function isDebugEnabled(module: DebugModule): boolean {
  return debugState[module] || false;
}

export function setDebugEnabled(module: DebugModule, enabled: boolean): void {
  debugState[module] = enabled;
}

export function toggleDebugModule(module: DebugModule): boolean {
  debugState[module] = !debugState[module];
  return debugState[module];
}

export function getAllDebugModules(): { module: DebugModule; enabled: boolean }[] {
  return Object.entries(debugState).map(([module, enabled]) => ({
    module: module as DebugModule,
    enabled
  }));
}

export function log(module: DebugModule, message: string, ...args: any[]): void {
  if (isDebugEnabled(module)) {
    console.log(`[ShuangDialog:${module}] ${message}`, ...args);
  }
}

export function warn(module: DebugModule, message: string, ...args: any[]): void {
  if (isDebugEnabled(module)) {
    console.warn(`[ShuangDialog:${module}] ${message}`, ...args);
  }
}

export function error(module: DebugModule, message: string, ...args: any[]): void {
  console.error(`[ShuangDialog:${module}] ${message}`, ...args);
}
