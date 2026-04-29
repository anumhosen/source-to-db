import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { VscClose, VscWarning, VscCheck, VscInfo, VscError } from 'react-icons/vsc';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 5000, actions = null) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, duration, actions }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration || 8000),
    warning: (msg, duration) => addToast(msg, 'warning', duration),
    info: (msg, duration) => addToast(msg, 'info', duration),
    apiError: (msg) =>
      addToast(
        <>
          <p className='font-medium mb-1'>API Key Required</p>
          <p className='text-sm opacity-90'>{msg}</p>
          <button
            onClick={() => {
              window.location.hash = '#/settings';
            }}
            className='mt-2 text-xs underline hover:no-underline opacity-80 hover:opacity-100'
          >
            Configure in Settings →
          </button>
        </>,
        'error',
        0,
      ),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Toast Container */}
      <div className='fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none'>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ id, message, type, duration, onClose }) {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 200);
  };

  const icons = {
    success: <VscCheck className='w-4 h-4 text-green-400 flex-shrink-0' />,
    error: <VscError className='w-4 h-4 text-red-400 flex-shrink-0' />,
    warning: <VscWarning className='w-4 h-4 text-yellow-400 flex-shrink-0' />,
    info: <VscInfo className='w-4 h-4 text-blue-400 flex-shrink-0' />,
  };

  const bgColors = {
    success: 'bg-green-900/40 border-green-800',
    error: 'bg-red-900/40 border-red-800',
    warning: 'bg-yellow-900/40 border-yellow-800',
    info: 'bg-blue-900/40 border-blue-800',
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-2.5 px-4 py-3 rounded-lg border shadow-lg 
                   backdrop-blur-sm transition-all duration-200 ${bgColors[type]} 
                   ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}`}
    >
      <div className='flex-shrink-0 mt-0.5'>{icons[type]}</div>
      <div className='flex-1 text-sm text-gray-200 min-w-0'>{message}</div>
      <button
        onClick={handleClose}
        className='flex-shrink-0 p-0.5 text-gray-500 hover:text-gray-300 rounded transition-colors'
      >
        <VscClose className='w-3.5 h-3.5' />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Return a no-op toast if used outside provider
    return {
      success: () => {},
      error: () => {},
      warning: () => {},
      info: () => {},
      apiError: () => {},
    };
  }
  return context;
}
