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
      // 1. Fetch from API / DB
      const data = await notificationApi.getNotifications();
      
      // 2. Fetch from Local Storage fallbacks (procurehub_notifications, notifications)
      let localNotifs = [];
      try {
        const pNotifs = JSON.parse(localStorage.getItem('procurehub_notifications') || '[]');
        const rawNotifs = JSON.parse(localStorage.getItem('notifications') || '[]');
        localNotifs = [...pNotifs, ...rawNotifs].map(n => ({
          id: n.id || `local_${Date.now()}_${Math.random()}`,
          recipientRole: n.recipientRole || n.recipient_role || 'vendor',
          vendorId: n.vendorId || n.vendor_id,
          title: n.title || 'Notification',
          message: n.message || '',
          timestamp: n.timestamp || 'Just now',
          read: !!n.read,
          type: n.type || 'general',
          link: n.link || '/'
        }));
      } catch (e) {}

      // Combine DB and unique local notifications
      const combined = [...data];
      localNotifs.forEach(ln => {
        if (!combined.some(c => c.id === ln.id || (c.title === ln.title && c.message === ln.message))) {
          if (ln.recipientRole === 'all' || ln.recipientRole === user.role || ln.vendorId === user.vendorId || ln.vendorId === user.id) {
            combined.unshift(ln);
          }
        }
      });

      setNotifications(combined);
    } catch (err) {
      console.error("Failed loading notifications", err);
      // Fallback to local storage on offline/error
      try {
        const local = JSON.parse(localStorage.getItem('procurehub_notifications') || localStorage.getItem('notifications') || '[]');
        setNotifications(local);
      } catch (e) {}
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();

    // 1. Live broadcast event listener for procurehub_notification
    const handleLiveNotification = (event) => {
      if (event.detail) {
        const newNotif = event.detail;
        setNotifications(prev => {
          if (prev.some(n => n.id === newNotif.id)) return prev;
          return [newNotif, ...prev];
        });
      } else {
        fetchNotifications();
      }
    };

    window.addEventListener('procurehub_notification', handleLiveNotification);
    window.addEventListener('storage', fetchNotifications);

    // 2. 10-second polling backup for real-time alerts
    const interval = setInterval(() => {
      fetchNotifications();
    }, 10000);

    return () => {
      window.removeEventListener('procurehub_notification', handleLiveNotification);
      window.removeEventListener('storage', fetchNotifications);
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    if (id.startsWith('dyn_warn_') || id.startsWith('local_')) {
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
