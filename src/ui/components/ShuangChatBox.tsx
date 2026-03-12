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
  const [originalPosition, setOriginalPosition] = useState<ChatBoxPosition | null>(null);
  const styleElementRef = useRef<HTMLStyleElement | null>(null);
  const isInitializedRef = useRef(false);

  const captureOriginalPosition = useCallback(() => {
    const gameChatBoxElement = document.getElementById('chat-room-div');
    if (gameChatBoxElement) {
      const rect = gameChatBoxElement.getBoundingClientRect();
      console.log('[ShuangDialog] 捕获原始位置:', {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      });
      return {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      };
    }
    return null;
  }, []);

  useEffect(() => {
    console.log('[ShuangDialog] 霜语文本框开关状态:', chatBoxEnabled);

    if (!chatBoxEnabled) {
      setOriginalPosition(null);
      isInitializedRef.current = false;
      if (styleElementRef.current) {
        styleElementRef.current.remove();
        styleElementRef.current = null;
        console.log('[ShuangDialog] 已移除样式覆盖');
      }
      return;
    }

    if (isInitializedRef.current) {
      console.log('[ShuangDialog] 已经初始化，跳过');
      return;
    }

    const position = captureOriginalPosition();
    if (!position) {
      console.warn('[ShuangDialog] 未找到游戏文本框元素 #chat-room-div');
      return;
    }

    setOriginalPosition(position);
    isInitializedRef.current = true;

    const shuangChatBoxHeight = position.height / 3;
    const adjustedGameChatBoxTop = position.top + shuangChatBoxHeight;
    const adjustedGameChatBoxHeight = position.height - shuangChatBoxHeight;

    console.log('[ShuangDialog] 计算布局:', {
      原始高度: position.height,
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
      isInitializedRef.current = false;
    };
  }, [chatBoxEnabled, captureOriginalPosition]);

  if (!chatBoxEnabled || !originalPosition) {
    return null;
  }

  const shuangChatBoxHeight = originalPosition.height / 3;

  return (
    <div
      style={{
        position: 'fixed',
        left: originalPosition.left,
        top: originalPosition.top,
        width: originalPosition.width,
        height: shuangChatBoxHeight,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid #ccc',
        borderRadius: '4px 4px 0 0',
        boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)',
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
