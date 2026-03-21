import { log, error } from '../config/debug';

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
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

class TelegramForwarder {
  private config: TelegramConfig = {
    botToken: '',
    chatId: '',
    enabled: false
  };

  private baseUrl: string = '';

  setConfig(config: Partial<TelegramConfig>) {
    this.config = { ...this.config, ...config };
    if (this.config.botToken) {
      this.baseUrl = `https://api.telegram.org/bot${this.config.botToken}`;
    }
    log('TELEGRAM_FORWARDER', '配置已更新', this.config.enabled ? '已启用' : '已禁用');
  }

  getConfig(): TelegramConfig {
    return { ...this.config };
  }

  isEnabled(): boolean {
    return this.config.enabled && !!this.config.botToken && !!this.config.chatId;
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
    messageType: string
  ): Promise<boolean> {
    const typeEmoji: Record<string, string> = {
      'ChatMessageChat': '💬',
      'ChatMessageEmote': '🎭',
      'ChatMessageAction': '🎬',
      'ChatMessageActivity': '⚡',
      'default': '📝'
    };

    const emoji = typeEmoji[messageType] || typeEmoji['default'];
    
    const text = `<b>${emoji} ${this.escapeHtml(senderName)}</b> <code>[${senderId}]</code>\n${this.escapeHtml(messageContent)}`;
    
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
