// Notification Context with Live Realtime Alerts & Toast Support
// KRISHIFLOW-AI - Smart India Hackathon 2026

import React, { createContext, useContext, useState, useEffect } from 'react';
import { NotificationItem, db } from '../lib/db';
import { useAuth } from './AuthContext';

interface ToastAlert {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'urgent' | 'payment' | 'transport';
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  toasts: ToastAlert[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeToast: (id: string) => void;
  pushNotification: (notif: Omit<NotificationItem, 'id' | 'read' | 'created_at'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toasts, setToasts] = useState<ToastAlert[]>([]);

  // Load and subscribe to notifications
  useEffect(() => {
    const refreshNotifications = () => {
      const all = db.getCollection<NotificationItem>('notifications');
      if (user) {
        setNotifications(all.filter((n) => n.user_id === user.id || n.user_id === 'all'));
      } else {
        setNotifications(all);
      }
    };

    refreshNotifications();

    // Subscribe to reactive database changes
    const unsubscribe = db.subscribe('table:notifications', () => {
      refreshNotifications();
    });

    // Listen for SMS dispatch events to show live toast
    const handleSmsDispatched = (event: Event) => {
      const customEvent = event as CustomEvent;
      const detail = customEvent.detail;
      const toastId = `toast-${Date.now()}`;
      setToasts((prev) => [
        ...prev,
        {
          id: toastId,
          title: '📱 SMS Delivered (MSG91)',
          message: `${detail.message}`,
          type: 'info',
        },
      ]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toastId));
      }, 7000);
    };

    window.addEventListener('krishiflow:sms_dispatched', handleSmsDispatched);

    return () => {
      unsubscribe();
      window.removeEventListener('krishiflow:sms_dispatched', handleSmsDispatched);
    };
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    db.markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    if (user) {
      db.markAllNotificationsAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const pushNotification = (notif: Omit<NotificationItem, 'id' | 'read' | 'created_at'>) => {
    const created = db.createNotification(notif);
    const toastId = `toast-${Date.now()}`;
    setToasts((prev) => [
      ...prev,
      {
        id: toastId,
        title: created.title,
        message: created.message,
        type: created.type,
      },
    ]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 6000);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toasts,
        markAsRead,
        markAllAsRead,
        removeToast,
        pushNotification,
      }}
    >
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-slate-900/95 backdrop-blur text-white p-3.5 rounded-xl shadow-2xl border border-slate-700/80 flex items-start justify-between gap-3 animate-slide-in transition-all"
          >
            <div className="flex-1">
              <p className="font-semibold text-xs uppercase tracking-wider text-emerald-400">
                {toast.title}
              </p>
              <p className="text-sm text-slate-200 mt-1 leading-snug line-clamp-3">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white text-xs p-1"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
