import { supabase } from '../supabaseClient';

const mapDBToNotification = (n) => {
  if (!n) return null;
  return {
    id: n.id,
    recipientRole: n.recipient_role,
    vendorId: n.vendor_id || null,
    title: n.title,
    message: n.message,
    timestamp: n.timestamp,
    read: n.read,
    type: n.type || 'general',
    link: n.link || null
  };
};

export const notificationApi = {
  getNotifications: async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('timestamp', { ascending: false });
    if (error) {
      console.warn("Notifications query failed:", error.message);
      return [];
    }
    const procureSession = JSON.parse(localStorage.getItem('procure_session') || '{}');
    const userRole = procureSession?.user?.role || 'manager';
    const userVendorId = procureSession?.user?.vendorId;

    const filtered = data.filter(n => {
      if (userRole === 'manager') {
        return n.recipient_role === 'manager' || n.recipient_role === 'organization' || n.recipient_role === 'all';
      } else if (userRole === 'vendor') {
        return (n.recipient_role === 'vendor' && (!n.vendor_id || n.vendor_id === userVendorId)) || n.recipient_role === 'all';
      }
      return true;
    });

    return filtered.map(mapDBToNotification);
  },

  markAsRead: async (id) => {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .select('*');
    if (error) throw error;
    return data.map(mapDBToNotification);
  },

  markAllAsRead: async () => {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .neq('read', true)
      .select('*');
    if (error) throw error;
    return data.map(mapDBToNotification);
  },

  createNotification: async (notif) => {
    const dbNotif = {
      id: notif.id || `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      recipient_role: notif.recipientRole,
      vendor_id: notif.vendorId || null,
      title: notif.title,
      message: notif.message,
      timestamp: notif.timestamp || new Date().toISOString().split('T')[0] + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      type: notif.type || 'general',
      link: notif.link || null
    };

    const { data, error } = await supabase
      .from('notifications')
      .insert(dbNotif)
      .select('*');
    if (error) {
      console.warn("Failed to create notification in DB:", error.message);
      return null;
    }
    return mapDBToNotification(data[0]);
  }
};
