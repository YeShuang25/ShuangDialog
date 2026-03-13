export const DEBUG_CONFIG = {
  SHUANG_CHAT_BOX: true,
  CHAT_EXPORTER: false,
  FLOATING_BALL: false,
};

export function isDebugEnabled(module: keyof typeof DEBUG_CONFIG): boolean {
  return DEBUG_CONFIG[module] || false;
}

export function log(module: keyof typeof DEBUG_CONFIG, message: string, ...args: any[]) {
  if (isDebugEnabled(module)) {
    console.log(`[ShuangDialog:${module}] ${message}`, ...args);
  }
}

export function warn(module: keyof typeof DEBUG_CONFIG, message: string, ...args: any[]) {
  if (isDebugEnabled(module)) {
    console.warn(`[ShuangDialog:${module}] ${message}`, ...args);
  }
}

export function error(module: keyof typeof DEBUG_CONFIG, message: string, ...args: any[]) {
  console.error(`[ShuangDialog:${module}] ${message}`, ...args);
}
