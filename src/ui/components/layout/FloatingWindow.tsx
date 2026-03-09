import React, { useState, useRef, useCallback } from 'react';

export interface FloatingWindowProps {
  title: string;
  children: React.ReactNode;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
  minSize?: { width: number; height: number };
  onClose?: () => void;
  onSettings?: () => void;
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
  onSettings,
  className = '',
  style = {},
  showHeader = true
}) => {
  // 从localStorage加载保存的位置，如果没有则使用默认位置
  const loadSavedPosition = () => {
    try {
      const saved = localStorage.getItem(`floating-window-${title}-position`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load saved position:', error);
    }
    return defaultPosition;
  };

  // 从localStorage加载保存的最小化状态
  const loadSavedMinimized = () => {
    try {
      const saved = localStorage.getItem(`floating-window-${title}-minimized`);
      return saved ? JSON.parse(saved) : true; // 默认最小化
    } catch (error) {
      console.warn('Failed to load saved minimized state:', error);
      return true; // 默认最小化
    }
  };

  const [position, setPosition] = useState(loadSavedPosition);
  const [size, setSize] = useState(defaultSize);
  const [isMinimized, setIsMinimized] = useState(loadSavedMinimized);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragDistance, setDragDistance] = useState(0);
  const [mouseDownPos, setMouseDownPos] = useState({ x: 0, y: 0 });

  const windowRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // 拖拽逻辑
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    setMouseDownPos({ x: e.clientX, y: e.clientY });
    setDragDistance(0);

    e.preventDefault();
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      let newX = e.clientX - dragStart.x;
      let newY = e.clientY - dragStart.y;
      
      // 限制窗口不超出屏幕范围
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      const windowWidth = isMinimized ? 120 : size.width;
      const windowHeight = isMinimized ? 40 : size.height;
       
      // 确保窗口不会超出左边界
      newX = Math.max(0, newX);
      // 确保窗口不会超出上边界
      newY = Math.max(0, newY);
      // 确保窗口不会超出右边界
      newX = Math.min(screenWidth - windowWidth, newX);
      // 确保窗口不会超出下边界
      newY = Math.min(screenHeight - windowHeight, newY);
      
      const newPosition = { x: newX, y: newY };
      setPosition(newPosition);
      
      // 保存位置到localStorage
      try {
        localStorage.setItem(`floating-window-${title}-position`, JSON.stringify(newPosition));
      } catch (error) {
        console.warn('Failed to save position:', error);
      }
      
      // 计算拖拽距离
      const distance = Math.sqrt(
        Math.pow(e.clientX - mouseDownPos.x, 2) + 
        Math.pow(e.clientY - mouseDownPos.y, 2)
      );
      setDragDistance(distance);
    }
  }, [isDragging, dragStart, mouseDownPos, size.width, size.height, isMinimized, title]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 处理悬浮球点击（区分拖拽和点击）
  const handleMinimizeClick = useCallback(() => {
    // 如果拖拽距离小于5px，认为是点击，否则是拖拽
    if (dragDistance < 5) {
      toggleMinimize();
    }
  }, [dragDistance]);

  // 调整大小逻辑
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, direction: string) => {
    if (isMinimized) return;

    setIsResizing(true);
    setResizeDirection(direction);
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });

    e.preventDefault();
    e.stopPropagation();
  }, [isMinimized]);

  const handleResizeMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing && resizeDirection) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      let newWidth = size.width;
      let newHeight = size.height;
      let newX = position.x;
      let newY = position.y;

      // 根据拖拽方向调整大小和位置
      switch (resizeDirection) {
        case 'n': // 上
          newHeight = Math.max(minSize.height, size.height - deltaY);
          newY = position.y + (size.height - newHeight);
          break;
        case 's': // 下
          newHeight = Math.max(minSize.height, size.height + deltaY);
          break;
        case 'e': // 右
          newWidth = Math.max(minSize.width, size.width + deltaX);
          break;
        case 'w': // 左
          newWidth = Math.max(minSize.width, size.width - deltaX);
          newX = position.x + (size.width - newWidth);
          break;
        case 'ne': // 右上
          newWidth = Math.max(minSize.width, size.width + deltaX);
          newHeight = Math.max(minSize.height, size.height - deltaY);
          newY = position.y + (size.height - newHeight);
          break;
        case 'nw': // 左上
          newWidth = Math.max(minSize.width, size.width - deltaX);
          newHeight = Math.max(minSize.height, size.height - deltaY);
          newX = position.x + (size.width - newWidth);
          newY = position.y + (size.height - newHeight);
          break;
        case 'se': // 右下
          newWidth = Math.max(minSize.width, size.width + deltaX);
          newHeight = Math.max(minSize.height, size.height + deltaY);
          break;
        case 'sw': // 左下
          newWidth = Math.max(minSize.width, size.width - deltaX);
          newHeight = Math.max(minSize.height, size.height + deltaY);
          newX = position.x + (size.width - newWidth);
          break;
      }

      // 限制窗口不超出屏幕范围
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      // 确保窗口不会超出左边界
      newX = Math.max(0, newX);
      // 确保窗口不会超出上边界
      newY = Math.max(0, newY);
      // 确保窗口不会超出右边界
      newX = Math.min(screenWidth - newWidth, newX);
      // 确保窗口不会超出下边界
      newY = Math.min(screenHeight - newHeight, newY);
      
      // 如果位置调整导致窗口超出边界，调整窗口大小
      if (newX < 0) {
        newWidth = Math.max(minSize.width, newWidth + newX);
        newX = 0;
      }
      if (newY < 0) {
        newHeight = Math.max(minSize.height, newHeight + newY);
        newY = 0;
      }
      if (newX + newWidth > screenWidth) {
        newWidth = Math.max(minSize.width, screenWidth - newX);
      }
      if (newY + newHeight > screenHeight) {
        newHeight = Math.max(minSize.height, screenHeight - newY);
      }

      setSize({ width: newWidth, height: newHeight });
      setPosition({ x: newX, y: newY });
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, [isResizing, resizeDirection, dragStart, size, position, minSize]);

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
    const newMinimized = !isMinimized;
    setIsMinimized(newMinimized);
    
    // 保存最小化状态到localStorage
    try {
      localStorage.setItem(`floating-window-${title}-minimized`, JSON.stringify(newMinimized));
    } catch (error) {
      console.warn('Failed to save minimized state:', error);
    }
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
        onClick={handleMinimizeClick}
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
            padding: '4px 8px',
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #e9ecef',
            borderRadius: '8px 8px 0 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'move',
            userSelect: 'none',
            height: '24px',
            minHeight: '24px'
          }}
          onMouseDown={handleMouseDown}
        >
          {/* 左侧：标题和最小化图标 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div 
              onClick={toggleMinimize}
              style={{
                cursor: 'pointer',
                width: '12px',
                height: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                color: '#6c757d',
                borderRadius: '1px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="最小化"
            >
              −
            </div>
            <div style={{ 
              fontWeight: '500', 
              color: '#495057', 
              fontSize: '12px',
              lineHeight: '1'
            }}>
              {title}
            </div>
          </div>
          
          {/* 右侧：设置按钮和关闭按钮 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {onSettings && (
              <button
                onClick={onSettings}
                style={{
                  width: '12px',
                  height: '12px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  borderRadius: '1px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8px',
                  color: '#6c757d',
                  transition: 'background-color 0.2s',
                  lineHeight: '1'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title="设置"
              >
                ⚙️
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  width: '12px',
                  height: '12px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  borderRadius: '1px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: '#6c757d',
                  transition: 'background-color 0.2s',
                  lineHeight: '1'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,0,0,0.1)';
                  e.currentTarget.style.color = '#dc3545';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#6c757d';
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

      {/* 调整大小手柄 - 四周 */}
      {/* 上 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          cursor: 'n-resize'
        }}
        onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
      />
      
      {/* 下 */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '4px',
          cursor: 's-resize'
        }}
        onMouseDown={(e) => handleResizeMouseDown(e, 's')}
      />
      
      {/* 左 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '4px',
          cursor: 'w-resize'
        }}
        onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
      />
      
      {/* 右 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '4px',
          cursor: 'e-resize'
        }}
        onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
      />
      
      {/* 左上 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '8px',
          height: '8px',
          cursor: 'nw-resize'
        }}
        onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
      />
      
      {/* 右上 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '8px',
          height: '8px',
          cursor: 'ne-resize'
        }}
        onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
      />
      
      {/* 左下 */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '8px',
          height: '8px',
          cursor: 'sw-resize'
        }}
        onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
      />
      
      {/* 右下 */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '8px',
          height: '8px',
          cursor: 'se-resize'
        }}
        onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
      />
    </div>
  );
};