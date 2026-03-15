import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useScale } from '../../context/ScaleContext';

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
  showVersion?: boolean;
}

import { APP_VERSION } from '../../../config/version';

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
  showHeader = true,
  showVersion = true
}) => {
  const scale = useScale();
  
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

  const loadSavedMinimized = () => {
    try {
      const saved = localStorage.getItem(`floating-window-${title}-minimized`);
      return saved ? JSON.parse(saved) : true;
    } catch (error) {
      console.warn('Failed to load saved minimized state:', error);
      return true;
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

  const scaledSize = {
    width: Math.round(size.width * scale),
    height: Math.round(size.height * scale)
  };

  const scaledPosition = {
    x: Math.round(position.x * scale),
    y: Math.round(position.y * scale)
  };

  const constrainToScreen = useCallback((pos: { x: number; y: number }, sz: { width: number; height: number }, minimized: boolean, currentScale: number) => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    const scaledWidth = minimized ? Math.round(120 * currentScale) : Math.round(sz.width * currentScale);
    const scaledHeight = minimized ? Math.round(40 * currentScale) : Math.round(sz.height * currentScale);
    
    let newX = Math.max(0, Math.min(screenWidth - scaledWidth, pos.x));
    let newY = Math.max(0, Math.min(screenHeight - scaledHeight, pos.y));
    
    let newWidth = sz.width;
    let newHeight = sz.height;
    
    if (!minimized) {
      if (newX + scaledWidth > screenWidth) {
        newWidth = Math.max(minSize.width, Math.round((screenWidth - newX) / currentScale));
      }
      if (newY + scaledHeight > screenHeight) {
        newHeight = Math.max(minSize.height, Math.round((screenHeight - newY) / currentScale));
      }
    }
    
    return {
      position: { x: Math.round(newX / currentScale), y: Math.round(newY / currentScale) },
      size: { width: newWidth, height: newHeight }
    };
  }, [minSize.width, minSize.height]);

  useEffect(() => {
    const handleResize = () => {
      const constrained = constrainToScreen(position, size, isMinimized, scale);
      
      if (constrained.position.x !== position.x || constrained.position.y !== position.y) {
        setPosition(constrained.position);
        try {
          localStorage.setItem(`floating-window-${title}-position`, JSON.stringify(constrained.position));
        } catch (error) {
          console.warn('Failed to save position:', error);
        }
      }
      
      if (!isMinimized && (constrained.size.width !== size.width || constrained.size.height !== size.height)) {
        setSize(constrained.size);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position, size, isMinimized, title, constrainToScreen, scale]);

  const getPositionFromEvent = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent): { clientX: number; clientY: number } => {
    if ('touches' in e) {
      const touches = 'nativeEvent' in e ? e.nativeEvent.touches : e.touches;
      if (touches && touches.length > 0) {
        return {
          clientX: touches[0].clientX,
          clientY: touches[0].clientY
        };
      }
    }
    if ('clientX' in e) {
      return {
        clientX: e.clientX,
        clientY: e.clientY
      };
    }
    return { clientX: 0, clientY: 0 };
  };

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const pos = getPositionFromEvent(e);
    setIsDragging(true);
    setDragStart({
      x: pos.clientX - scaledPosition.x,
      y: pos.clientY - scaledPosition.y
    });
    setMouseDownPos({ x: pos.clientX, y: pos.clientY });
    setDragDistance(0);
    e.preventDefault();
  }, [scaledPosition]);

  const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const pos = getPositionFromEvent(e);
    let newX = (pos.clientX - dragStart.x) / scale;
    let newY = (pos.clientY - dragStart.y) / scale;
    
    const screenWidth = window.innerWidth / scale;
    const screenHeight = window.innerHeight / scale;
    
    const windowWidth = isMinimized ? 120 : size.width;
    const windowHeight = isMinimized ? 40 : size.height;
     
    newX = Math.max(0, newX);
    newY = Math.max(0, newY);
    newX = Math.min(screenWidth - windowWidth, newX);
    newY = Math.min(screenHeight - windowHeight, newY);
    
    const newPosition = { x: Math.round(newX), y: Math.round(newY) };
    setPosition(newPosition);
    
    try {
      localStorage.setItem(`floating-window-${title}-position`, JSON.stringify(newPosition));
    } catch (error) {
      console.warn('Failed to save position:', error);
    }
    
    const distance = Math.sqrt(
      Math.pow(pos.clientX - mouseDownPos.x, 2) + 
      Math.pow(pos.clientY - mouseDownPos.y, 2)
    );
    setDragDistance(distance);
  }, [isDragging, dragStart, mouseDownPos, size.width, size.height, isMinimized, title, scale]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMinimizeClick = useCallback(() => {
    if (dragDistance < 5) {
      toggleMinimize();
    }
  }, [dragDistance]);

  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent, direction: string) => {
    if (isMinimized) return;

    const pos = getPositionFromEvent(e);
    setIsResizing(true);
    setResizeDirection(direction);
    setDragStart({
      x: pos.clientX,
      y: pos.clientY
    });

    e.preventDefault();
    e.stopPropagation();
  }, [isMinimized]);

  const handleResizeMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isResizing || !resizeDirection) return;
    e.preventDefault();
    
    const pos = getPositionFromEvent(e);
    const deltaX = (pos.clientX - dragStart.x) / scale;
    const deltaY = (pos.clientY - dragStart.y) / scale;
    
    let newWidth = size.width;
    let newHeight = size.height;
    let newX = position.x;
    let newY = position.y;

    switch (resizeDirection) {
      case 'n':
        newHeight = Math.max(minSize.height, size.height - deltaY);
        newY = position.y + (size.height - newHeight);
        break;
      case 's':
        newHeight = Math.max(minSize.height, size.height + deltaY);
        break;
      case 'e':
        newWidth = Math.max(minSize.width, size.width + deltaX);
        break;
      case 'w':
        newWidth = Math.max(minSize.width, size.width - deltaX);
        newX = position.x + (size.width - newWidth);
        break;
      case 'ne':
        newWidth = Math.max(minSize.width, size.width + deltaX);
        newHeight = Math.max(minSize.height, size.height - deltaY);
        newY = position.y + (size.height - newHeight);
        break;
      case 'nw':
        newWidth = Math.max(minSize.width, size.width - deltaX);
        newHeight = Math.max(minSize.height, size.height - deltaY);
        newX = position.x + (size.width - newWidth);
        newY = position.y + (size.height - newHeight);
        break;
      case 'se':
        newWidth = Math.max(minSize.width, size.width + deltaX);
        newHeight = Math.max(minSize.height, size.height + deltaY);
        break;
      case 'sw':
        newWidth = Math.max(minSize.width, size.width - deltaX);
        newHeight = Math.max(minSize.height, size.height + deltaY);
        newX = position.x + (size.width - newWidth);
        break;
    }

    const screenWidth = window.innerWidth / scale;
    const screenHeight = window.innerHeight / scale;
    
    newX = Math.max(0, newX);
    newY = Math.max(0, newY);
    newX = Math.min(screenWidth - newWidth, newX);
    newY = Math.min(screenHeight - newHeight, newY);
    
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

    setSize({ width: Math.round(newWidth), height: Math.round(newHeight) });
    setPosition({ x: Math.round(newX), y: Math.round(newY) });
    setDragStart({ x: pos.clientX, y: pos.clientY });
  }, [isResizing, resizeDirection, dragStart, size, position, minSize, scale]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      const moveHandler = isDragging ? handleMove : handleResizeMove;
      const endHandler = isDragging ? handleEnd : handleResizeEnd;
      
      document.addEventListener('mousemove', moveHandler);
      document.addEventListener('mouseup', endHandler);
      document.addEventListener('touchmove', moveHandler, { passive: false });
      document.addEventListener('touchend', endHandler);

      return () => {
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('mouseup', endHandler);
        document.removeEventListener('touchmove', moveHandler);
        document.removeEventListener('touchend', endHandler);
      };
    }
  }, [isDragging, isResizing, handleMove, handleEnd, handleResizeMove, handleResizeEnd]);

  const toggleMinimize = () => {
    const newMinimized = !isMinimized;
    setIsMinimized(newMinimized);
    
    try {
      localStorage.setItem(`floating-window-${title}-minimized`, JSON.stringify(newMinimized));
    } catch (error) {
      console.warn('Failed to save minimized state:', error);
    }
  };

  const minimizedStyle: React.CSSProperties = {
    position: 'fixed',
    left: scaledPosition.x,
    top: scaledPosition.y,
    width: `${120 * scale}px`,
    height: `${40 * scale}px`,
    backgroundColor: '#007acc',
    color: 'white',
    borderRadius: `${20 * scale}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    zIndex: 10001,
    fontSize: `${14 * scale}px`,
    fontWeight: 'bold',
    touchAction: 'none'
  };

  const normalStyle: React.CSSProperties = {
    position: 'fixed',
    left: scaledPosition.x,
    top: scaledPosition.y,
    width: scaledSize.width,
    height: scaledSize.height,
    backgroundColor: '#ffffff',
    border: `${1 * scale}px solid #ccc`,
    borderRadius: `${8 * scale}px`,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 10000,
    touchAction: 'none',
    ...style
  };

  if (isMinimized) {
    return (
      <div
        style={minimizedStyle}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        onClick={handleMinimizeClick}
        className={className}
      >
        {title}
      </div>
    );
  }

  const headerHeight = Math.round(24 * scale);
  const headerPadding = Math.round(4 * scale);
  const fontSize = Math.round(12 * scale);
  const buttonSize = Math.round(12 * scale);

  return (
    <div
      ref={windowRef}
      style={normalStyle}
      className={className}
    >
      {showHeader && (
        <div
          ref={headerRef}
          style={{
            padding: `${headerPadding}px ${headerPadding * 2}px`,
            backgroundColor: '#f8f9fa',
            borderBottom: `${1 * scale}px solid #e9ecef`,
            borderRadius: `${8 * scale}px ${8 * scale}px 0 0`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'move',
            userSelect: 'none',
            height: headerHeight,
            minHeight: headerHeight,
            touchAction: 'none'
          }}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: `${6 * scale}px` }}>
            <div 
              onClick={toggleMinimize}
              style={{
                cursor: 'pointer',
                width: buttonSize,
                height: buttonSize,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: `${10 * scale}px`,
                color: '#6c757d',
                borderRadius: `${1 * scale}px`,
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
              fontSize: `${fontSize}px`,
              lineHeight: '1',
              display: 'flex',
              alignItems: 'center',
              gap: `${4 * scale}px`
            }}>
              {title}
              {showVersion && (
                <span style={{
                  fontSize: `${9 * scale}px`,
                  color: '#6c757d',
                  fontWeight: 'normal',
                  opacity: 0.7
                }}>
                  {APP_VERSION}
                </span>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: `${6 * scale}px` }}>
            {onSettings && (
              <button
                onClick={onSettings}
                style={{
                  width: buttonSize,
                  height: buttonSize,
                  border: 'none',
                  backgroundColor: 'transparent',
                  borderRadius: `${1 * scale}px`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: `${8 * scale}px`,
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
                  width: buttonSize,
                  height: buttonSize,
                  border: 'none',
                  backgroundColor: 'transparent',
                  borderRadius: `${1 * scale}px`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: `${10 * scale}px`,
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

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {children}
      </div>

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: `${4 * scale}px`,
          cursor: 'n-resize'
        }}
        onMouseDown={(e) => handleResizeStart(e, 'n')}
        onTouchStart={(e) => handleResizeStart(e, 'n')}
      />
      
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: `${4 * scale}px`,
          cursor: 's-resize'
        }}
        onMouseDown={(e) => handleResizeStart(e, 's')}
        onTouchStart={(e) => handleResizeStart(e, 's')}
      />
      
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: `${4 * scale}px`,
          cursor: 'w-resize'
        }}
        onMouseDown={(e) => handleResizeStart(e, 'w')}
        onTouchStart={(e) => handleResizeStart(e, 'w')}
      />
      
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: `${4 * scale}px`,
          cursor: 'e-resize'
        }}
        onMouseDown={(e) => handleResizeStart(e, 'e')}
        onTouchStart={(e) => handleResizeStart(e, 'e')}
      />
      
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${8 * scale}px`,
          height: `${8 * scale}px`,
          cursor: 'nw-resize'
        }}
        onMouseDown={(e) => handleResizeStart(e, 'nw')}
        onTouchStart={(e) => handleResizeStart(e, 'nw')}
      />
      
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: `${8 * scale}px`,
          height: `${8 * scale}px`,
          cursor: 'ne-resize'
        }}
        onMouseDown={(e) => handleResizeStart(e, 'ne')}
        onTouchStart={(e) => handleResizeStart(e, 'ne')}
      />
      
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: `${8 * scale}px`,
          height: `${8 * scale}px`,
          cursor: 'sw-resize'
        }}
        onMouseDown={(e) => handleResizeStart(e, 'sw')}
        onTouchStart={(e) => handleResizeStart(e, 'sw')}
      />
      
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: `${8 * scale}px`,
          height: `${8 * scale}px`,
          cursor: 'se-resize'
        }}
        onMouseDown={(e) => handleResizeStart(e, 'se')}
        onTouchStart={(e) => handleResizeStart(e, 'se')}
      />
    </div>
  );
};
