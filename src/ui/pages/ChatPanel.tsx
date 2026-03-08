// 聊天面板主组件
import React, { useEffect, useRef } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { useSettingStore } from '../../store/useSettingStore';
import { ChatParser } from '../../modules/chat/parser';
import { ChatFilter } from '../../modules/chat/filter';
import { getDispatcher } from '../../core/dispatcher';

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

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    left: chatSettings.position.x,
    top: chatSettings.position.y,
    width: chatSettings.position.width,
    height: chatSettings.position.height,
    backgroundColor: chatSettings.theme === 'dark' ? '#1a1a1a' : '#ffffff',
    color: chatSettings.theme === 'dark' ? '#ffffff' : '#000000',
    border: `1px solid ${chatSettings.theme === 'dark' ? '#333' : '#ccc'}`,
    borderRadius: '8px',
    fontFamily: chatSettings.fontFamily,
    fontSize: `${chatSettings.fontSize}px`,
    opacity: chatSettings.opacity,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 10000,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
  };

  const headerStyle: React.CSSProperties = {
    padding: '8px 12px',
    backgroundColor: chatSettings.theme === 'dark' ? '#2a2a2a' : '#f5f5f5',
    borderBottom: `1px solid ${chatSettings.theme === 'dark' ? '#333' : '#ddd'}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'move'
  };

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
    <div style={panelStyle}>
      <div style={headerStyle}>
        <div>
          <strong>霜语聊天</strong>
          {chatSettings.showChannel && (
            <span style={{ marginLeft: '8px', color: '#666' }}>
              [{activeChannel}]
            </span>
          )}
        </div>
        <div>
          <button 
            onClick={() => setActiveChannel('world')}
            style={{ 
              marginRight: '4px',
              padding: '2px 6px',
              fontSize: '12px',
              border: activeChannel === 'world' ? '1px solid #007acc' : '1px solid #ccc',
              backgroundColor: activeChannel === 'world' ? '#007acc' : 'transparent',
              color: activeChannel === 'world' ? '#ffffff' : '#666',
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
              color: activeChannel === 'guild' ? '#ffffff' : '#666',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            公会
          </button>
        </div>
      </div>
      
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
  );
};
