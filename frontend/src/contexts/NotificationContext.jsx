import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setNotifications((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showSuccess = useCallback((msg, dur) => addNotification(msg, 'success', dur), [addNotification]);
  const showError = useCallback((msg, dur) => addNotification(msg, 'error', dur), [addNotification]);
  const showWarning = useCallback((msg, dur) => addNotification(msg, 'warning', dur), [addNotification]);
  const showInfo = useCallback((msg, dur) => addNotification(msg, 'info', dur), [addNotification]);

  return (
    <NotificationContext.Provider
      value={{
        addNotification,
        removeNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
      }}
    >
      {children}
      {/* Toast List Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        {notifications.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start justify-between gap-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 transform translate-y-0 animate-fade-in-up font-chakra ${
              toast.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300'
                : toast.type === 'error'
                ? 'bg-rose-950/80 border-rose-500/30 text-rose-300'
                : toast.type === 'warning'
                ? 'bg-amber-950/80 border-amber-500/30 text-amber-300'
                : 'bg-zinc-900/80 border-zinc-700/50 text-zinc-300'
            }`}
          >
            <div className="flex-1 text-sm font-medium pr-1">
              {toast.message}
            </div>
            <button
              onClick={() => removeNotification(toast.id)}
              className="text-current opacity-60 hover:opacity-100 transition-opacity focus:outline-none text-base font-bold select-none cursor-pointer"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
