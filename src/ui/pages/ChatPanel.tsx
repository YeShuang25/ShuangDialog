// 聊天面板主组件
import React, { useEffect, useRef } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { useSettingStore } from '../../store/useSettingStore';
import { ChatParser } from '../../modules/chat/parser';
import { ChatFilter } from '../../modules/chat/filter';
import { getDispatcher } from '../../core/dispatcher';
import { FloatingWindow } from '../components/FloatingWindow';

export const ChatPanel: React.FC = () => {
  const messages = useChatStore((state) => state.messages);
  const activeChannel = useChatStore((state) => state.activeChannel);
  const addMessage = useChatStore((state) => state.addMessage);
  const setActiveChannel = useChatStore((state) => state.setActiveChannel);
  const chatSettings = useSettingStore((state) => state.chat);
  const filterSettings = useSettingStore((state) => state.filter);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<ChatFilter>(new ChatFilter());

  useEffect(() => {
    // 订阅聊天数据包
    const dispatcher = getDispatcher();
    const unsubscribe = dispatcher.subscribe('chat', (packet) => {
      const parsedMessage = ChatParser.parsePacket(packet);
      if (parsedMessage) {
        const filterResult = filterSettings.enabled 
          ? filterRef.current.filterMessage(parsedMessage)
          : { shouldShow: true, isFiltered: false };
        
        if (filterResult.shouldShow) {
          addMessage(parsedMessage, filterResult);
        }
      }
    });

    return unsubscribe;
  }, [addMessage, filterSettings.enabled]);

  useEffect(() => {
    // 自动滚动到底部
    if (chatSettings.autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatSettings.autoScroll]);

  const filteredMessages = messages.filter(msg => msg.channel === activeChannel);

  const messagesStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  };

  const messageStyle = (message: any): React.CSSProperties => ({
    padding: '4px 8px',
    borderRadius: '4px',
    backgroundColor: message.highlightReason 
      ? (chatSettings.theme === 'dark' ? '#3a3a00' : '#ffffcc')
      : 'transparent',
    borderLeft: message.isPrivate 
      ? '3px solid #007acc' 
      : 'none',
    opacity: message.isFiltered ? 0.6 : 1
  });

  return (
    <FloatingWindow
      title="霜语聊天"
      defaultPosition={chatSettings.position}
      defaultSize={{ width: chatSettings.position.width, height: chatSettings.position.height }}
      style={{
        backgroundColor: chatSettings.theme === 'dark' ? '#1a1a1a' : '#ffffff',
        color: chatSettings.theme === 'dark' ? '#ffffff' : '#000000',
        fontFamily: chatSettings.fontFamily,
        fontSize: `${chatSettings.fontSize}px`,
        opacity: chatSettings.opacity
      }}
    >
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* 频道切换栏 */}
        <div style={{
          padding: '4px 8px',
          borderBottom: `1px solid ${chatSettings.theme === 'dark' ? '#333' : '#ddd'}`,
          display: 'flex',
          gap: '4px'
        }}>
          <button 
            onClick={() => setActiveChannel('world')}
            style={{ 
              padding: '2px 6px',
              fontSize: '12px',
              border: activeChannel === 'world' ? '1px solid #007acc' : '1px solid #ccc',
              backgroundColor: activeChannel === 'world' ? '#007acc' : 'transparent',
              color: activeChannel === 'world' ? '#ffffff' : (chatSettings.theme === 'dark' ? '#ccc' : '#666'),
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            世界
          </button>
          <button 
            onClick={() => setActiveChannel('guild')}
            style={{ 
              padding: '2px 6px',
              fontSize: '12px',
              border: activeChannel === 'guild' ? '1px solid #007acc' : '1px solid #ccc',
              backgroundColor: activeChannel === 'guild' ? '#007acc' : 'transparent',
              color: activeChannel === 'guild' ? '#ffffff' : (chatSettings.theme === 'dark' ? '#ccc' : '#666'),
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            公会
          </button>
          {chatSettings.showChannel && (
            <span style={{ marginLeft: 'auto', color: '#666', fontSize: '12px', alignSelf: 'center' }}>
              [{activeChannel}]
            </span>
          )}
        </div>
        
        {/* 消息列表 */}
        <div style={messagesStyle}>
          {filteredMessages.map((message) => (
            <div key={message.id} style={messageStyle(message)}>
              {chatSettings.showTimestamp && (
                <span style={{ color: '#666', marginRight: '8px' }}>
                  [{new Date(message.timestamp).toLocaleTimeString()}]
                </span>
              )}
              
              {chatSettings.showChannel && message.channel !== 'world' && (
                <span style={{ color: '#007acc', marginRight: '8px' }}>
                  [{message.channel}]
                </span>
              )}
              
              <span style={{ 
                color: message.isSystem ? '#999' : '#007acc',
                fontWeight: message.isSystem ? 'normal' : 'bold',
                marginRight: '8px'
              }}>
                {message.sender}:
              </span>
              
              <span>
                {message.filteredMessage || message.message}
              </span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </FloatingWindow>
  );
};
