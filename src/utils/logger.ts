// 日志工具 (调试用)
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  data?: unknown;
  source: string;
}

export class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private logLevel = LogLevel.DEBUG;
  private enableConsole = true;

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  public setMaxLogs(max: number): void {
    this.maxLogs = max;
    this.trimLogs();
  }

  public setConsoleEnabled(enabled: boolean): void {
    this.enableConsole = enabled;
  }

  private addLog(level: LogLevel, message: string, data?: unknown, source = 'ShuangDialog'): void {
    if (level < this.logLevel) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      data,
      source
    };

    this.logs.push(logEntry);
    this.trimLogs();

    if (this.enableConsole) {
      this.outputToConsole(logEntry);
    }
  }

  private trimLogs(): void {
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  private outputToConsole(log: LogEntry): void {
    const timestamp = new Date(log.timestamp).toISOString();
    const prefix = `[${timestamp}] [${log.source}] [${LogLevel[log.level]}]`;

    switch (log.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, log.message, log.data || '');
        break;
      case LogLevel.INFO:
        console.info(prefix, log.message, log.data || '');
        break;
      case LogLevel.WARN:
        console.warn(prefix, log.message, log.data || '');
        break;
      case LogLevel.ERROR:
        console.error(prefix, log.message, log.data || '');
        break;
    }
  }

  public debug(message: string, data?: unknown, source = 'ShuangDialog'): void {
    this.addLog(LogLevel.DEBUG, message, data, source);
  }

  public info(message: string, data?: unknown, source = 'ShuangDialog'): void {
    this.addLog(LogLevel.INFO, message, data, source);
  }

  public warn(message: string, data?: unknown, source = 'ShuangDialog'): void {
    this.addLog(LogLevel.WARN, message, data, source);
  }

  public error(message: string, data?: unknown, source = 'ShuangDialog'): void {
    this.addLog(LogLevel.ERROR, message, data, source);
  }

  public getLogs(level?: LogLevel, source?: string, limit?: number): LogEntry[] {
    let filteredLogs = this.logs;

    if (level !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.level >= level);
    }

    if (source) {
      filteredLogs = filteredLogs.filter(log => log.source === source);
    }

    if (limit && limit > 0) {
      filteredLogs = filteredLogs.slice(-limit);
    }

    return filteredLogs;
  }

  public clearLogs(): void {
    this.logs = [];
  }

  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  public getStats(): {
    total: number;
    byLevel: Record<string, number>;
    bySource: Record<string, number>;
  } {
    const stats = {
      total: this.logs.length,
      byLevel: {} as Record<string, number>,
      bySource: {} as Record<string, number>
    };

    for (const log of this.logs) {
      const levelName = LogLevel[log.level];
      stats.byLevel[levelName] = (stats.byLevel[levelName] || 0) + 1;
      stats.bySource[log.source] = (stats.bySource[log.source] || 0) + 1;
    }

    return stats;
  }
}

// 导出单例实例
export const logger = Logger.getInstance();

// 便捷的导出函数
export const logDebug = (message: string, data?: unknown, source?: string) => logger.debug(message, data, source);
export const logInfo = (message: string, data?: unknown, source?: string) => logger.info(message, data, source);
export const logWarn = (message: string, data?: unknown, source?: string) => logger.warn(message, data, source);
export const logError = (message: string, data?: unknown, source?: string) => logger.error(message, data, source);
