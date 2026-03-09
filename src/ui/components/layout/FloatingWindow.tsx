import React, { useState, useRef, useCallback } from 'react';

export interface FloatingWindowProps {
  title: string;
  children: React.ReactNode;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
  minSize?: { width: number; height: number };
  onClose?: () => void;
  className?: string;
  style?: React.CSSProperties;
  showHeader?: boolean;
}

export const FloatingWindow: React.FC<FloatingWindowProps> = ({
  title,
  children,
  defaultPosition = { x: 100, y: 100 },
  defaultSize = { width: 400, height: 600 },
  minSize = { width: 200, height: 150 },
  onClose,
  className = '',
  style = {},
  showHeader = true
}) => {
  const [position, setPosition] = useState(defaultPosition);
  const [size, setSize] = useState(defaultSize);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const windowRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // 拖拽逻辑
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });

    e.preventDefault();
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const windowWidth = isMinimized ? 120 : size.width;
      const windowHeight = isMinimized ? 40 : size.height;
      
      const newX = Math.max(0, Math.min(window.innerWidth - windowWidth, e.clientX - dragStart.x));
      const newY = Math.max(0, Math.min(window.innerHeight - windowHeight, e.clientY - dragStart.y));

      setPosition({ x: newX, y: newY });
    }
  }, [isDragging, dragStart, size.width, isMinimized]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 调整大小逻辑
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    if (isMinimized) return;

    setIsResizing(true);
    setDragStart({
      x: e.clientX - size.width,
      y: e.clientY - size.height
    });

    e.preventDefault();
    e.stopPropagation();
  }, [size, isMinimized]);

  const handleResizeMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = Math.max(minSize.width, e.clientX - dragStart.x);
      const newHeight = Math.max(minSize.height, e.clientY - dragStart.y);

      setSize({ width: newWidth, height: newHeight });
    }
  }, [isResizing, dragStart, minSize]);

  const handleResizeMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // 事件监听器
  React.useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', isDragging ? handleMouseMove : handleResizeMouseMove);
      document.addEventListener('mouseup', isDragging ? handleMouseUp : handleResizeMouseUp);

      return () => {
        document.removeEventListener('mousemove', isDragging ? handleMouseMove : handleResizeMouseMove);
        document.removeEventListener('mouseup', isDragging ? handleMouseUp : handleResizeMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp, handleResizeMouseMove, handleResizeMouseUp]);

  // 最小化按钮
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // 最小化状态的样式
  const minimizedStyle: React.CSSProperties = {
    position: 'fixed',
    left: position.x,
    top: position.y,
    width: '120px',
    height: '40px',
    backgroundColor: '#007acc',
    color: 'white',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    zIndex: 10001,
    fontSize: '14px',
    fontWeight: 'bold'
  };

  // 正常状态的样式
  const normalStyle: React.CSSProperties = {
    position: 'fixed',
    left: position.x,
    top: position.y,
    width: size.width,
    height: size.height,
    backgroundColor: '#ffffff',
    border: '1px solid #ccc',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 10000,
    ...style
  };

  if (isMinimized) {
    return (
      <div
        style={minimizedStyle}
        onMouseDown={handleMouseDown}
        onClick={toggleMinimize}
        className={className}
      >
        {title}
      </div>
    );
  }

  return (
    <div
      ref={windowRef}
      style={normalStyle}
      className={className}
    >
      {/* 标题栏 */}
      {showHeader && (
        <div
          ref={headerRef}
          style={{
            padding: '8px 12px',
            backgroundColor: '#f5f5f5',
            borderBottom: '1px solid #ddd',
            borderRadius: '8px 8px 0 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'move',
            userSelect: 'none'
          }}
          onMouseDown={handleMouseDown}
        >
          <div style={{ fontWeight: 'bold', color: '#333' }}>
            {title}
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={toggleMinimize}
              style={{
                width: '20px',
                height: '20px',
                border: 'none',
                backgroundColor: '#ffcc00',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                color: '#333'
              }}
              title="最小化"
            >
              −
            </button>
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  width: '20px',
                  height: '20px',
                  border: 'none',
                  backgroundColor: '#ff4444',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  color: 'white'
                }}
                title="关闭"
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* 内容区域 */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {children}
      </div>

      {/* 调整大小手柄 */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '20px',
          height: '20px',
          cursor: 'nw-resize',
          background: 'linear-gradient(-45deg, transparent 0%, transparent 40%, #ccc 40%, #ccc 60%, transparent 60%)'
        }}
        onMouseDown={handleResizeMouseDown}
      />
    </div>
  );
};