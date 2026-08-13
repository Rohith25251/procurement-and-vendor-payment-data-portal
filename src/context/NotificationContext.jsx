import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationApi } from '../api/notificationApi';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await notificationApi.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("Failed loading notifications", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();

    // Auto refresh notifications every 10 seconds for real-time governance alerts
    const interval = setInterval(() => {
      fetchNotifications();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    if (id.startsWith('dyn_warn_')) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      return;
    }
    await notificationApi.markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = async () => {
    await notificationApi.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        refreshNotifications: fetchNotifications,
        markAsRead,
        markAllAsRead
      }}
    >
      {children}
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
