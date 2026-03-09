import { useState, useCallback } from 'react';

export interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export const useDrag = (initialX: number = 0, initialY: number = 0) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: initialX,
    currentY: initialY
  });

  const startDrag = useCallback((e: React.MouseEvent) => {
    setDragState(prev => ({
      ...prev,
      isDragging: true,
      startX: e.clientX - prev.currentX,
      startY: e.clientY - prev.currentY
    }));
    e.preventDefault();
  }, []);

  const onDrag = useCallback((e: MouseEvent) => {
    if (dragState.isDragging) {
      setDragState(prev => ({
        ...prev,
        currentX: e.clientX - prev.startX,
        currentY: e.clientY - prev.startY
      }));
    }
  }, [dragState.isDragging]);

  const stopDrag = useCallback(() => {
    setDragState(prev => ({
      ...prev,
      isDragging: false
    }));
  }, []);

  return {
    dragState,
    startDrag,
    onDrag,
    stopDrag
  };
};