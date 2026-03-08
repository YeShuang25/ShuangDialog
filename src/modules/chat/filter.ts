// 敏感词过滤/频道过滤
import { ParsedChatMessage } from './parser';

export interface FilterRule {
  id: string;
  name: string;
  enabled: boolean;
  type: 'channel' | 'user' | 'keyword' | 'regex';
  pattern: string;
  action: 'hide' | 'highlight' | 'replace';
  replacement?: string;
  priority: number;
}

export interface FilterResult {
  shouldShow: boolean;
  isFiltered: boolean;
  filteredMessage?: string;
  highlightReason?: string;
}

export class ChatFilter {
  private rules: FilterRule[] = [];

  constructor() {
    this.loadDefaultRules();
  }

  private loadDefaultRules() {
    // 默认过滤规则
    this.rules = [
      {
        id: 'system_messages',
        name: '系统消息过滤',
        enabled: false,
        type: 'channel',
        pattern: 'system',
        action: 'hide',
        priority: 1
      },
      {
        id: 'combat_messages',
        name: '战斗消息过滤',
        enabled: false,
        type: 'channel',
        pattern: 'combat',
        action: 'hide',
        priority: 2
      }
    ];
  }

  public addRule(rule: FilterRule): void {
    this.rules.push(rule);
    this.sortRulesByPriority();
  }

  public removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }

  public updateRule(ruleId: string, updates: Partial<FilterRule>): void {
    const ruleIndex = this.rules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex !== -1) {
      this.rules[ruleIndex] = { ...this.rules[ruleIndex], ...updates };
      this.sortRulesByPriority();
    }
  }

  public getRules(): FilterRule[] {
    return [...this.rules];
  }

  public getEnabledRules(): FilterRule[] {
    return this.rules.filter(rule => rule.enabled);
  }

  private sortRulesByPriority(): void {
    this.rules.sort((a, b) => a.priority - b.priority);
  }

  public filterMessage(message: ParsedChatMessage): FilterResult {
    let result: FilterResult = {
      shouldShow: true,
      isFiltered: false
    };

    const enabledRules = this.getEnabledRules();

    for (const rule of enabledRules) {
      const ruleResult = this.applyRule(message, rule);
      
      if (ruleResult.action === 'hide') {
        return {
          shouldShow: false,
          isFiltered: true
        };
      }

      if (ruleResult.action === 'highlight') {
        result.highlightReason = rule.name;
      }

      if (ruleResult.action === 'replace' && ruleResult.replacement) {
        result.filteredMessage = ruleResult.replacement;
        result.isFiltered = true;
      }
    }

    return result;
  }

  private applyRule(message: ParsedChatMessage, rule: FilterRule): {
    action: 'hide' | 'highlight' | 'replace' | 'none';
    replacement?: string;
  } {
    let matches = false;

    switch (rule.type) {
      case 'channel':
        matches = this.matchChannel(message.channel, rule.pattern);
        break;
      case 'user':
        matches = this.matchUser(message.sender, rule.pattern);
        break;
      case 'keyword':
        matches = this.matchKeyword(message.message, rule.pattern);
        break;
      case 'regex':
        matches = this.matchRegex(message.message, rule.pattern);
        break;
    }

    if (matches) {
      if (rule.action === 'replace' && rule.replacement) {
        const replacedMessage = this.replaceContent(message.message, rule.pattern, rule.replacement);
        return {
          action: 'replace',
          replacement: replacedMessage
        };
      }
      return { action: rule.action };
    }

    return { action: 'none' };
  }

  private matchChannel(channel: string, pattern: string): boolean {
    return channel.toLowerCase().includes(pattern.toLowerCase());
  }

  private matchUser(sender: string, pattern: string): boolean {
    return sender.toLowerCase().includes(pattern.toLowerCase());
  }

  private matchKeyword(message: string, pattern: string): boolean {
    return message.toLowerCase().includes(pattern.toLowerCase());
  }

  private matchRegex(message: string, pattern: string): boolean {
    try {
      const regex = new RegExp(pattern, 'i');
      return regex.test(message);
    } catch {
      return false;
    }
  }

  private replaceContent(message: string, pattern: string, replacement: string): string {
    try {
      // 尝试作为正则表达式处理
      const regex = new RegExp(pattern, 'gi');
      return message.replace(regex, replacement);
    } catch {
      // 如果不是有效的正则表达式，作为普通字符串处理
      return message.replace(
        new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
        replacement
      );
    }
  }

  public exportRules(): string {
    return JSON.stringify(this.rules, null, 2);
  }

  public importRules(rulesJson: string): boolean {
    try {
      const importedRules = JSON.parse(rulesJson) as FilterRule[];
      if (Array.isArray(importedRules)) {
        this.rules = importedRules;
        this.sortRulesByPriority();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}
