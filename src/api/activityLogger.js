import { supabase } from '../supabaseClient';

/**
 * Utility to log user actions for Governance Activity Trail
 */
export const activityLogger = {
  logActivity: async ({ userId, userName, userRole, action, details }) => {
    if (!userId) return;

    const logEntry = {
      id: `act_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      user_id: userId,
      user_name: userName || 'User',
      user_role: userRole || 'user',
      action: action || 'Action',
      details: details || '',
      created_at: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    try {
      await supabase.from('activity_logs').insert(logEntry);
    } catch (err) {
      console.warn('Failed to log activity to DB, storing locally:', err);
    }

    // Backup to local storage history
    try {
      const existing = JSON.parse(localStorage.getItem('procure_activity_logs') || '[]');
      existing.unshift(logEntry);
      localStorage.setItem('procure_activity_logs', JSON.stringify(existing.slice(0, 200)));
    } catch (e) {
      // ignore
    }
  },

  getUserActivities: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map(d => ({
          id: d.id,
          userId: d.user_id,
          userName: d.user_name,
          userRole: d.user_role,
          action: d.action,
          details: d.details,
          timestamp: d.created_at
        }));
      }
    } catch (e) {
      console.warn('Failed to fetch DB logs, reading local backup:', e);
    }

    // Fallback local storage
    try {
      const existing = JSON.parse(localStorage.getItem('procure_activity_logs') || '[]');
      return existing
        .filter(l => l.user_id === userId || l.userId === userId)
        .map(d => ({
          id: d.id,
          userId: d.user_id || d.userId,
          userName: d.user_name || d.userName,
          userRole: d.user_role || d.userRole,
          action: d.action,
          details: d.details,
          timestamp: d.created_at || d.timestamp
        }));
    } catch {
      return [];
    }
  }
};
