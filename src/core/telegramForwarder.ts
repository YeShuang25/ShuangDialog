import { log, error } from '../config/debug';

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
  filterEnabled: boolean;
  commandEnabled: boolean;
}

interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  disable_notification?: boolean;
}

interface TelegramResponse {
  ok: boolean;
  result?: any;
  description?: string;
  error_code?: number;
}

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    date: number;
    text?: string;
  };
}

type CommandHandler = (args: string, chatId: number) => void;

class TelegramForwarder {
  private config: TelegramConfig = {
    botToken: '',
    chatId: '',
    enabled: false,
    filterEnabled: true,
    commandEnabled: false
  };

  private baseUrl: string = '';
  private lastUpdateId: number = 0;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private commandHandlers: Map<string, CommandHandler> = new Map();
  private processedMessageIds: Set<number> = new Set();
  private readonly MAX_PROCESSED_IDS = 100;

  setConfig(config: Partial<TelegramConfig>) {
    const wasCommandEnabled = this.config.commandEnabled;
    this.config = { ...this.config, ...config };
    if (this.config.botToken) {
      this.baseUrl = `https://api.telegram.org/bot${this.config.botToken}`;
    }
    log('TELEGRAM_FORWARDER', '配置已更新', this.config.enabled ? '已启用' : '已禁用');
    
    if (config.commandEnabled !== undefined && config.commandEnabled !== wasCommandEnabled) {
      if (config.commandEnabled && this.config.botToken) {
        this.startPolling();
      } else {
        this.stopPolling();
      }
    }
  }

  getConfig(): TelegramConfig {
    return { ...this.config };
  }

  isEnabled(): boolean {
    return this.config.enabled && !!this.config.botToken && !!this.config.chatId;
  }

  isFilterEnabled(): boolean {
    return this.config.filterEnabled;
  }

  isCommandEnabled(): boolean {
    return this.config.commandEnabled;
  }

  registerCommand(command: string, handler: CommandHandler) {
    this.commandHandlers.set(command.toLowerCase(), handler);
    log('TELEGRAM_FORWARDER', `注册命令: ${command}`);
  }

  startPolling() {
    if (this.pollInterval) return;
    
    log('TELEGRAM_FORWARDER', '开始轮询Telegram更新');
    this.pollInterval = setInterval(() => this.pollUpdates(), 2000);
  }

  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
      log('TELEGRAM_FORWARDER', '停止轮询Telegram更新');
    }
  }

  private async pollUpdates() {
    if (!this.config.botToken || !this.config.commandEnabled) return;

    try {
      const params: Record<string, any> = {
        timeout: 30,
        allowed_updates: ['message']
      };
      
      if (this.lastUpdateId > 0) {
        params.offset = this.lastUpdateId + 1;
      }

      const result = await this.request('getUpdates', params);
      
      if (result.ok && result.result && Array.isArray(result.result)) {
        for (const update of result.result as TelegramUpdate[]) {
          this.lastUpdateId = update.update_id;
          this.handleUpdate(update);
        }
      }
    } catch (e) {
      error('TELEGRAM_FORWARDER', '轮询更新失败', e);
    }
  }

  private handleUpdate(update: TelegramUpdate) {
    if (!update.message?.text) return;

    const messageId = update.message.message_id;
    if (this.processedMessageIds.has(messageId)) {
      log('TELEGRAM_FORWARDER', `跳过已处理的消息ID: ${messageId}`);
      return;
    }

    this.processedMessageIds.add(messageId);
    if (this.processedMessageIds.size > this.MAX_PROCESSED_IDS) {
      const idsArray = Array.from(this.processedMessageIds);
      this.processedMessageIds = new Set(idsArray.slice(-this.MAX_PROCESSED_IDS));
    }

    const chatId = update.message.chat.id;
    const allowedChatId = parseInt(this.config.chatId);
    
    if (chatId !== allowedChatId) {
      log('TELEGRAM_FORWARDER', `忽略来自未授权chat的消息: ${chatId}`);
      return;
    }

    const text = update.message.text;
    
    if (text.startsWith('/')) {
      const parts = text.slice(1).split(' ');
      const command = parts[0].toLowerCase();
      const args = parts.slice(1).join(' ');
      
      const handler = this.commandHandlers.get(command);
      if (handler) {
        log('TELEGRAM_FORWARDER', `执行命令: /${command}`, args);
        handler(args, chatId);
      } else {
        this.sendMessage(`未知命令: /${command}\n可用命令: /say, /emote, /help`, { parseMode: 'HTML' });
      }
    } else if (text.startsWith('*')) {
      const emoteHandler = this.commandHandlers.get('emote');
      if (emoteHandler) {
        const emoteContent = text.slice(1);
        log('TELEGRAM_FORWARDER', '转发emote消息到游戏聊天:', emoteContent);
        emoteHandler(emoteContent, chatId);
      }
    } else {
      const defaultHandler = this.commandHandlers.get('__default__');
      if (defaultHandler) {
        log('TELEGRAM_FORWARDER', '转发消息到游戏聊天:', text);
        defaultHandler(text, chatId);
      }
    }
  }

  private async request(method: string, params: Record<string, any>): Promise<TelegramResponse> {
    if (!this.baseUrl) {
      error('TELEGRAM_FORWARDER', 'Bot Token 未配置');
      return { ok: false, description: 'Bot Token 未配置' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/${method}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
      });

      const data: TelegramResponse = await response.json();
      
      if (!data.ok) {
        error('TELEGRAM_FORWARDER', `API错误: ${data.description}`, data.error_code);
      }

      return data;
    } catch (e) {
      error('TELEGRAM_FORWARDER', '请求失败', e);
      return { ok: false, description: String(e) };
    }
  }

  async sendMessage(text: string, options?: {
    parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
    silent?: boolean;
  }): Promise<boolean> {
    if (!this.isEnabled()) {
      log('TELEGRAM_FORWARDER', '转发未启用或配置不完整');
      return false;
    }

    const message: TelegramMessage = {
      chat_id: this.config.chatId,
      text: text,
      parse_mode: options?.parseMode,
      disable_notification: options?.silent
    };

    const result = await this.request('sendMessage', message);
    
    if (result.ok) {
      log('TELEGRAM_FORWARDER', '消息发送成功');
      return true;
    }
    
    return false;
  }

  async sendFormattedMessage(
    senderName: string,
    senderId: string,
    messageContent: string,
    messageType: string,
    replyInfo?: { senderName: string; content: string }
  ): Promise<boolean> {
    const typeEmoji: Record<string, string> = {
      'ChatMessageChat': '💬',
      'ChatMessageEmote': '🎭',
      'ChatMessageAction': '🎬',
      'ChatMessageActivity': '⚡',
      'default': '📝'
    };

    const emoji = typeEmoji[messageType] || typeEmoji['default'];
    
    let text = `<b>${emoji} ${this.escapeHtml(senderName)}</b> <code>[${senderId}]</code>\n`;
    
    if (replyInfo) {
      text += `<i>↩️ 回复 ${this.escapeHtml(replyInfo.senderName)}: ${this.escapeHtml(replyInfo.content)}</i>\n`;
    }
    
    text += this.escapeHtml(messageContent);
    
    return this.sendMessage(text, { parseMode: 'HTML' });
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.config.botToken) {
      return { success: false, message: '请先配置 Bot Token' };
    }

    if (!this.config.chatId) {
      return { success: false, message: '请先配置 Chat ID' };
    }

    const result = await this.request('getMe', {});
    
    if (result.ok && result.result) {
      const botInfo = result.result;
      return { 
        success: true, 
        message: `连接成功！Bot: @${botInfo.username} (${botInfo.first_name})` 
      };
    }
    
    return { 
      success: false, 
      message: result.description || '连接失败，请检查 Bot Token' 
    };
  }

  async getBotInfo(): Promise<{ username?: string; firstName?: string; error?: string }> {
    if (!this.config.botToken) {
      return { error: 'Bot Token 未配置' };
    }

    const result = await this.request('getMe', {});
    
    if (result.ok && result.result) {
      return {
        username: result.result.username,
        firstName: result.result.first_name
      };
    }
    
    return { error: result.description || '获取Bot信息失败' };
  }
}

export const telegramForwarder = new TelegramForwarder();
