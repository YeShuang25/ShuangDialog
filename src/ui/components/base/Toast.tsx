import React, { useState, useEffect } from 'react';

export interface ToastProps {
  message: string;
  duration?: number;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  duration = 3000,
  type = 'success',
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const backgroundColor = {
    success: '#28a745',
    error: '#dc3545',
    info: '#007acc'
  }[type];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '100px',
        left: '50%',
        transform: `translateX(-50%) ${isAnimating ? 'translateY(20px)' : 'translateY(0)'}`,
        backgroundColor,
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        fontSize: '14px',
        fontWeight: '500',
        zIndex: 10002,
        opacity: isAnimating ? 0 : 1,
        transition: 'all 0.3s ease-out',
        pointerEvents: 'none',
        maxWidth: '80%',
        textAlign: 'center'
      }}
    >
      {message}
    </div>
  );
};

export const useToast = () => {
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  const ToastComponent = () => {
    if (!toast) return null;
    return (
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    );
  };

  return {
    showToast,
    hideToast,
    ToastComponent
  };
};