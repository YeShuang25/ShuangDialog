import { useState, useCallback, useEffect, useRef } from 'react';

export interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface UseDragOptions {
  initialX?: number;
  initialY?: number;
  onDragStart?: () => void;
  onDragEnd?: (x: number, y: number) => void;
  onDrag?: (x: number, y: number) => void;
}

export const useDrag = (options: UseDragOptions = {}) => {
  const { initialX = 0, initialY = 0, onDragStart, onDragEnd, onDrag } = options;
  
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: initialX,
    currentY: initialY
  });
  
  const dragStateRef = useRef(dragState);
  dragStateRef.current = dragState;

  const getPositionFromEvent = (e: MouseEvent | TouchEvent): { clientX: number; clientY: number } => {
    if ('touches' in e && e.touches.length > 0) {
      return {
        clientX: e.touches[0].clientX,
        clientY: e.touches[0].clientY
      };
    }
    if ('clientX' in e) {
      return {
        clientX: e.clientX,
        clientY: e.clientY
      };
    }
    return { clientX: 0, clientY: 0 };
  };

  const startDrag = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const pos = getPositionFromEvent(e.nativeEvent);
    setDragState(prev => ({
      ...prev,
      isDragging: true,
      startX: pos.clientX - prev.currentX,
      startY: pos.clientY - prev.currentY
    }));
    onDragStart?.();
    e.preventDefault();
  }, [onDragStart]);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!dragStateRef.current.isDragging) return;
      
      const pos = getPositionFromEvent(e);
      const newX = pos.clientX - dragStateRef.current.startX;
      const newY = pos.clientY - dragStateRef.current.startY;
      
      setDragState(prev => ({
        ...prev,
        currentX: newX,
        currentY: newY
      }));
      onDrag?.(newX, newY);
    };

    const handleEnd = () => {
      if (dragStateRef.current.isDragging) {
        setDragState(prev => ({
          ...prev,
          isDragging: false
        }));
        onDragEnd?.(dragStateRef.current.currentX, dragStateRef.current.currentY);
      }
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [onDrag, onDragEnd]);

  const setPosition = useCallback((x: number, y: number) => {
    setDragState(prev => ({
      ...prev,
      currentX: x,
      currentY: y
    }));
  }, []);

  return {
    dragState,
    startDrag,
    setPosition,
    bindDragEvents: {
      onMouseDown: startDrag,
      onTouchStart: startDrag
    }
  };
};

export const useSimpleDrag = (initialX: number = 0, initialY: number = 0, elementWidth: number = 60, elementHeight: number = 30) => {
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragDistanceRef = useRef(0);
  const startPosRef = useRef({ x: 0, y: 0 });

  const constrainPosition = useCallback((pos: { x: number; y: number }) => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    const newX = Math.max(0, Math.min(screenWidth - elementWidth, pos.x));
    const newY = Math.max(0, Math.min(screenHeight - elementHeight, pos.y));
    
    return { x: newX, y: newY };
  }, [elementWidth, elementHeight]);

  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => constrainPosition(prev));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [constrainPosition]);

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

  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const pos = getPositionFromEvent(e);
    setIsDragging(true);
    dragStartRef.current = {
      x: pos.clientX - position.x,
      y: pos.clientY - position.y
    };
    startPosRef.current = { x: pos.clientX, y: pos.clientY };
    dragDistanceRef.current = 0;
    e.preventDefault();
  }, [position]);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      
      const pos = getPositionFromEvent(e);
      let newX = pos.clientX - dragStartRef.current.x;
      let newY = pos.clientY - dragStartRef.current.y;

      const constrained = constrainPosition({ x: newX, y: newY });
      setPosition(constrained);

      dragDistanceRef.current = Math.sqrt(
        Math.pow(pos.clientX - startPosRef.current.x, 2) +
        Math.pow(pos.clientY - startPosRef.current.y, 2)
      );
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, constrainPosition]);

  const getDragDistance = () => dragDistanceRef.current;

  return {
    position,
    setPosition,
    isDragging,
    handleStart,
    getDragDistance,
    bindDragEvents: {
      onMouseDown: handleStart,
      onTouchStart: handleStart
    }
  };
};
