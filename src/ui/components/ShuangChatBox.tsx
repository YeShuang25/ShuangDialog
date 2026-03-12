import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useChatBoxStore } from '../../store/useChatBoxStore';

interface ChatBoxPosition {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const ShuangChatBox: React.FC = () => {
  const { chatBoxEnabled } = useChatBoxStore();
  const [gameChatBox, setGameChatBox] = useState<ChatBoxPosition | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const styleElementRef = useRef<HTMLStyleElement | null>(null);

  const updatePosition = useCallback(() => {
    const gameChatBoxElement = document.getElementById('chat-room-div');
    if (gameChatBoxElement) {
      const rect = gameChatBoxElement.getBoundingClientRect();
      console.log('[ShuangDialog] 游戏文本框位置:', {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      });
      setGameChatBox({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      });
      setIsVisible(true);
    } else {
      console.log('[ShuangDialog] 未找到游戏文本框元素');
      setIsVisible(false);
    }
  }, []);

  useEffect(() => {
    console.log('[ShuangDialog] 霜语文本框开关状态:', chatBoxEnabled);

    if (!chatBoxEnabled) {
      setGameChatBox(null);
      setIsVisible(false);
      if (styleElementRef.current) {
        styleElementRef.current.remove();
        styleElementRef.current = null;
      }
      return;
    }

    const gameChatBoxElement = document.getElementById('chat-room-div');
    if (!gameChatBoxElement) {
      console.warn('[ShuangDialog] 未找到游戏文本框元素 #chat-room-div');
      return;
    }

    updatePosition();

    const resizeObserver = new ResizeObserver(() => {
      updatePosition();
    });

    resizeObserver.observe(gameChatBoxElement);
    window.addEventListener('resize', updatePosition);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updatePosition);
      if (styleElementRef.current) {
        styleElementRef.current.remove();
        styleElementRef.current = null;
      }
    };
  }, [chatBoxEnabled, updatePosition]);

  useEffect(() => {
    if (!chatBoxEnabled || !gameChatBox) {
      return;
    }

    const shuangChatBoxHeight = gameChatBox.height / 3;
    const adjustedGameChatBoxTop = gameChatBox.top + shuangChatBoxHeight;
    const adjustedGameChatBoxHeight = gameChatBox.height - shuangChatBoxHeight;

    console.log('[ShuangDialog] 计算布局:', {
      霜语文本框高度: shuangChatBoxHeight,
      游戏文本框新位置: adjustedGameChatBoxTop,
      游戏文本框新高度: adjustedGameChatBoxHeight
    });

    if (styleElementRef.current) {
      styleElementRef.current.remove();
    }

    const styleEl = document.createElement('style');
    styleEl.id = 'shuang-chat-box-override-style';
    styleEl.textContent = `
      #chat-room-div {
        top: ${adjustedGameChatBoxTop}px !important;
        height: ${adjustedGameChatBoxHeight}px !important;
      }
    `;
    document.head.appendChild(styleEl);
    styleElementRef.current = styleEl;

    console.log('[ShuangDialog] 已注入样式覆盖');

    return () => {
      if (styleElementRef.current) {
        styleElementRef.current.remove();
        styleElementRef.current = null;
        console.log('[ShuangDialog] 已移除样式覆盖');
      }
    };
  }, [chatBoxEnabled, gameChatBox]);

  if (!chatBoxEnabled || !gameChatBox || !isVisible) {
    return null;
  }

  const shuangChatBoxHeight = gameChatBox.height / 3;

  return (
    <div
      style={{
        position: 'fixed',
        left: gameChatBox.left,
        top: gameChatBox.top,
        width: gameChatBox.width,
        height: shuangChatBoxHeight,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        zIndex: 9998,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div
        style={{
          padding: '8px 12px',
          backgroundColor: '#007acc',
          color: 'white',
          fontSize: '14px',
          fontWeight: 500,
          borderBottom: '1px solid #005a9e'
        }}
      >
        霜语文本框
      </div>
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '8px',
          fontSize: '14px',
          color: '#333'
        }}
      >
        <div style={{ color: '#999', textAlign: 'center', marginTop: '20px' }}>
          内容区域（待实现）
        </div>
      </div>
    </div>
  );
};
