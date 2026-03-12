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
  const [currentPosition, setCurrentPosition] = useState<ChatBoxPosition | null>(null);
  const isInitializedRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);

  const capturePosition = useCallback(() => {
    const gameChatBoxElement = document.getElementById('chat-room-div');
    if (gameChatBoxElement) {
      const rect = gameChatBoxElement.getBoundingClientRect();
      return {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      };
    }
    return null;
  }, []);

  const applyLayout = useCallback((position: ChatBoxPosition) => {
    const gameChatBoxElement = document.getElementById('chat-room-div');
    if (!gameChatBoxElement) return;

    const shuangChatBoxHeight = position.height / 3;
    const adjustedGameChatBoxTop = position.top + shuangChatBoxHeight;
    const adjustedGameChatBoxHeight = position.height - shuangChatBoxHeight;

    console.log('[ShuangDialog] 应用布局:', {
      霜语文本框高度: shuangChatBoxHeight,
      游戏文本框新位置: adjustedGameChatBoxTop,
      游戏文本框新高度: adjustedGameChatBoxHeight
    });

    gameChatBoxElement.style.top = `${adjustedGameChatBoxTop}px`;
    gameChatBoxElement.style.height = `${adjustedGameChatBoxHeight}px`;

    setCurrentPosition(position);
  }, []);

  const handleResize = useCallback(() => {
    if (!chatBoxEnabled || !isInitializedRef.current) return;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      const newPosition = capturePosition();
      if (newPosition) {
        console.log('[ShuangDialog] 窗口大小改变，重新计算布局');
        setOriginalPosition(newPosition);
        applyLayout(newPosition);
      }
    });
  }, [chatBoxEnabled, capturePosition, applyLayout]);

  useEffect(() => {
    console.log('[ShuangDialog] 霜语文本框开关状态:', chatBoxEnabled);

    if (!chatBoxEnabled) {
      setOriginalPosition(null);
      setCurrentPosition(null);
      isInitializedRef.current = false;
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      const gameChatBoxElement = document.getElementById('chat-room-div');
      if (gameChatBoxElement && originalPosition) {
        gameChatBoxElement.style.top = `${originalPosition.top}px`;
        gameChatBoxElement.style.height = `${originalPosition.height}px`;
        console.log('[ShuangDialog] 恢复游戏文本框原始位置');
      }
      return;
    }

    if (isInitializedRef.current) {
      console.log('[ShuangDialog] 已经初始化，跳过');
      return;
    }

    const position = capturePosition();
    if (!position) {
      console.warn('[ShuangDialog] 未找到游戏文本框元素 #chat-room-div');
      return;
    }

    console.log('[ShuangDialog] 捕获原始位置:', position);
    setOriginalPosition(position);
    isInitializedRef.current = true;

    applyLayout(position);

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      const gameChatBoxElement = document.getElementById('chat-room-div');
      if (gameChatBoxElement && originalPosition) {
        gameChatBoxElement.style.top = `${originalPosition.top}px`;
        gameChatBoxElement.style.height = `${originalPosition.height}px`;
        console.log('[ShuangDialog] 恢复游戏文本框原始位置');
      }
      
      isInitializedRef.current = false;
    };
  }, [chatBoxEnabled, capturePosition, applyLayout, handleResize, originalPosition]);

  if (!chatBoxEnabled || !currentPosition) {
    return null;
  }

  const shuangChatBoxHeight = currentPosition.height / 3;

  return (
    <div
      style={{
        position: 'fixed',
        left: currentPosition.left,
        top: currentPosition.top,
        width: currentPosition.width,
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
