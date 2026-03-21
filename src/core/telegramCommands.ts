import { telegramForwarder } from '../core/telegramForwarder';
import { log, error } from '../config/debug';

declare global {
  interface Window {
    ServerSend?: (message: string, data: any) => void;
    Player?: any;
    ChatRoomCharacter?: any[];
  }
}

function sendChatMessage(content: string, type: 'Chat' | 'Emote' | 'Whisper' = 'Chat') {
  if (!window.ServerSend) {
    error('TELEGRAM_COMMAND', 'ServerSend 函数不可用');
    return false;
  }

  if (!window.Player) {
    error('TELEGRAM_COMMAND', 'Player 对象不可用');
    return false;
  }

  try {
    window.ServerSend('ChatRoomChat', {
      Type: type,
      Content: content,
      Dictionary: []
    });
    log('TELEGRAM_COMMAND', `发送${type}消息成功:`, content);
    return true;
  } catch (e) {
    error('TELEGRAM_COMMAND', '发送消息失败', e);
    return false;
  }
}

function handleSayCommand(args: string) {
  if (!args.trim()) {
    telegramForwarder.sendMessage('用法: /say <消息内容>\n发送一条普通聊天消息');
    return;
  }

  const success = sendChatMessage(args, 'Chat');
  if (success) {
    telegramForwarder.sendMessage(`✅ 已发送: ${args}`);
  } else {
    telegramForwarder.sendMessage('❌ 发送失败，请确保你在聊天室中');
  }
}

function handleEmoteCommand(args: string) {
  if (!args.trim()) {
    telegramForwarder.sendMessage('用法: /emote <动作内容>\n发送一条动作消息');
    return;
  }

  const success = sendChatMessage(args, 'Emote');
  if (success) {
    telegramForwarder.sendMessage(`✅ 已发送动作: ${args}`);
  } else {
    telegramForwarder.sendMessage('❌ 发送失败，请确保你在聊天室中');
  }
}

function handleHelpCommand() {
  const helpText = `<b>霜语 Telegram 命令帮助</b>

<b>可用命令：</b>
/say &lt;消息&gt; - 发送普通聊天消息
/emote &lt;动作&gt; - 发送动作消息
/players - 查询房间玩家列表
/help - 显示此帮助信息

<b>快捷方式：</b>
直接发送消息 - 普通聊天
*动作内容 - 发送动作消息

<b>示例：</b>
你好 → 发送"你好"
*微微一笑 → 发送动作"微微一笑"`;
  
  telegramForwarder.sendMessage(helpText, { parseMode: 'HTML' });
}

function handlePlayersCommand() {
  const characters = window.ChatRoomCharacter;
  
  if (!characters || !Array.isArray(characters) || characters.length === 0) {
    telegramForwarder.sendMessage('❌ 未获取到房间玩家信息，请确保你在聊天室中');
    return;
  }
  
  const playerCount = characters.length;
  const playerList = characters.map((p: any) => {
    const id = p.MemberNumber || '未知';
    const name = p.Name || '未知';
    const nickname = p.Nickname || '';
    const displayName = nickname ? `${nickname} (${name})` : name;
    return `<code>[${id}]</code> ${displayName}`;
  }).join('\n');
  
  const message = `<b>🏠 房间玩家 (${playerCount}人)</b>\n\n${playerList}`;
  
  telegramForwarder.sendMessage(message, { parseMode: 'HTML' });
  log('TELEGRAM_COMMAND', `查询房间玩家: ${playerCount}人`);
}

function handleDefaultMessage(text: string) {
  const success = sendChatMessage(text, 'Chat');
  if (!success) {
    telegramForwarder.sendMessage('❌ 发送失败，请确保你在聊天室中');
  }
}

export function initTelegramCommands() {
  telegramForwarder.registerCommand('say', handleSayCommand);
  telegramForwarder.registerCommand('emote', handleEmoteCommand);
  telegramForwarder.registerCommand('e', handleEmoteCommand);
  telegramForwarder.registerCommand('players', handlePlayersCommand);
  telegramForwarder.registerCommand('p', handlePlayersCommand);
  telegramForwarder.registerCommand('help', handleHelpCommand);
  telegramForwarder.registerCommand('h', handleHelpCommand);
  telegramForwarder.registerCommand('__default__', handleDefaultMessage);
  
  log('TELEGRAM_COMMAND', 'Telegram命令已初始化');
}
