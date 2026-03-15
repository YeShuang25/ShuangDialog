import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ScaleContextType {
  scale: number;
}

const ScaleContext = createContext<ScaleContextType>({ scale: 1.0 });

const BASE_SCREEN_WIDTH = 1280;
const BASE_SCREEN_HEIGHT = 720;
const MIN_SCALE = 0.5;
const MAX_SCALE = 1.5;

const calculateScale = (): number => {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  
  const scaleX = screenWidth / BASE_SCREEN_WIDTH;
  const scaleY = screenHeight / BASE_SCREEN_HEIGHT;
  
  const scale = Math.min(scaleX, scaleY);
  
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
};

export const ScaleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [scale, setScale] = useState(() => calculateScale());

  useEffect(() => {
    const handleResize = () => {
      setScale(calculateScale());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <ScaleContext.Provider value={{ scale }}>
      {children}
    </ScaleContext.Provider>
  );
};

export const useScale = (): number => {
  const { scale } = useContext(ScaleContext);
  return scale;
};

export const useScaledSize = (baseSize: number): number => {
  const { scale } = useContext(ScaleContext);
  return Math.round(baseSize * scale);
};

export const useScaledPx = (baseValue: number): string => {
  const { scale } = useContext(ScaleContext);
  return `${Math.round(baseValue * scale)}px`;
};
