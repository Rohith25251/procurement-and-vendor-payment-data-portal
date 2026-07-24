import { delay, getStorageData, setStorageData } from './apiUtils';
import { INITIAL_NOTIFICATIONS } from '../mock/notifications';

const NOTIF_KEY = 'procure_notifications_db';

export const notificationApi = {
  getNotifications: async () => {
    await delay(300);
    return getStorageData(NOTIF_KEY, INITIAL_NOTIFICATIONS);
  },

  markAsRead: async (id) => {
    await delay(200);
    const notifications = getStorageData(NOTIF_KEY, INITIAL_NOTIFICATIONS);
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    setStorageData(NOTIF_KEY, updated);
    return updated;
  },

  markAllAsRead: async () => {
    await delay(200);
    const notifications = getStorageData(NOTIF_KEY, INITIAL_NOTIFICATIONS);
    const updated = notifications.map(n => ({ ...n, read: true }));
    setStorageData(NOTIF_KEY, updated);
    return updated;
  }
};
