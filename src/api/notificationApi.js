import { supabase } from '../supabaseClient';
import { isPOForOrganization } from '../utils/orgFilter';

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

    // Fetch vendors and purchase orders for tenant-level notification matching
    const [{ data: vendors }, { data: pos }] = await Promise.all([
      supabase.from('vendors').select('id, name, status'),
      supabase.from('purchase_orders').select('*')
    ]);

    const vendorMap = new Map();
    if (vendors) {
      vendors.forEach(v => {
        vendorMap.set(v.id, v);
        vendorMap.set(v.name.toLowerCase().trim(), v);
      });
    }

    const poMap = new Map();
    if (pos) {
      pos.forEach(p => {
        if (p.po_number) poMap.set(p.po_number, p);
        if (p.poNumber) poMap.set(p.poNumber, p);
        if (p.id) poMap.set(p.id, p);
      });
    }

    const procureSession = JSON.parse(localStorage.getItem('procure_session') || '{}');
    const currentUser = procureSession?.user;
    const userRole = currentUser?.role || 'manager';
    const userVendorId = currentUser?.vendorId || currentUser?.id;
    const userEmail = currentUser?.email;

    const filtered = data.filter(n => {
      // 1. Recipient Email or Org ID check if present in notification record
      if (n.recipient_email && userEmail && n.recipient_email.toLowerCase() !== userEmail.toLowerCase()) {
        return false;
      }
      if (n.organization_id && currentUser?.id && n.organization_id.toLowerCase() !== currentUser.id.toLowerCase()) {
        return false;
      }

      // 2. Role match check
      let roleMatch = false;
      if (userRole === 'manager') {
        roleMatch = n.recipient_role === 'manager' || n.recipient_role === 'organization' || n.recipient_role === 'all' || n.recipient_role === 'governance';
      } else if (userRole === 'vendor') {
        roleMatch = (n.recipient_role === 'vendor' || n.recipient_role === 'governance' || n.recipient_role === 'user') && 
                    (!n.vendor_id || n.vendor_id === userVendorId || n.vendor_id === userEmail || n.vendor_id === currentUser?.id);
        if (!roleMatch && n.recipient_role === 'all') roleMatch = true;
      } else {
        roleMatch = true;
      }

      if (!roleMatch) return false;

      // 3. For Manager/Organization notifications: filter out notifications belonging to POs of OTHER organizations
      if (userRole === 'manager' && currentUser && n.message) {
        // Extract PO number if mentioned in title or message (e.g. PO-2026-007)
        const poMatch = (n.message + ' ' + (n.title || '')).match(/(PO-\d{4}-\d{3})/i);
        if (poMatch) {
          const poNum = poMatch[1].toUpperCase();
          const targetPO = poMap.get(poNum);
          if (targetPO) {
            // Check if this PO belongs to the logged-in organization manager
            const isMine = isPOForOrganization(targetPO, currentUser);
            if (!isMine) {
              return false; // Filter out notifications for other organizations' POs!
            }
          }
        }
      }

      // 4. Filter out onboarding notifications if already processed
      if (n.type === 'vendor_onboarding') {
        if (n.recipient_role === 'manager' || n.recipient_role === 'organization') {
          let vendorStatus = 'Pending';
          if (n.vendor_id && vendorMap.has(n.vendor_id)) {
            vendorStatus = vendorMap.get(n.vendor_id).status;
          } else if (n.message) {
            const match = n.message.match(/(.*?) has submitted a registration request/);
            if (match) {
              const name = match[1].toLowerCase().trim();
              if (vendorMap.has(name)) {
                vendorStatus = vendorMap.get(name).status;
              }
            }
          }
          if (vendorStatus !== 'Pending') {
            return false;
          }
        } else if (n.recipient_role === 'vendor') {
          const vId = n.vendor_id || userVendorId;
          if (vId && vendorMap.has(vId)) {
            const vendor = vendorMap.get(vId);
            if (vendor.status === 'Approved' || vendor.status === 'Rejected') {
              return false;
            }
          }
        }
      }

      return true;
    });

    // Dynamic warning notice injection if user has warning in DB
    if (userVendorId || userEmail) {
      try {
        let userDb = null;
        if (userRole === 'vendor') {
          const { data: vData } = await supabase.from('vendors').select('*').or(`id.eq.${userVendorId},email.eq.${userEmail}`).maybeSingle();
          userDb = vData;
        } else {
          const { data: oData } = await supabase.from('organizations').select('*').or(`id.eq.${userVendorId},email.eq.${userEmail}`).maybeSingle();
          userDb = oData;
        }

        if (userDb && (userDb.status === 'Warned' || userDb.warning_reason || userDb.warning_comment)) {
          const warnReason = userDb.warning_reason || userDb.warning_comment || 'Suspicious activity detected on your account.';
          const exists = filtered.some(n => n.type === 'governance' || (n.title && n.title.includes('Warning')));
          if (!exists) {
            filtered.unshift({
              id: `dyn_warn_${userDb.id}`,
              recipient_role: userRole,
              vendor_id: userDb.id,
              title: '⚠️ Warning Notice from Admin',
              message: `Suspicious activity detected: "${warnReason}". Continued suspicious activity may lead to account deactivation.`,
              timestamp: 'Just now',
              read: false,
              type: 'governance',
              link: '/'
            });
          }
        }
      } catch (err) {
        // ignore
      }
    }

    return filtered.map(mapDBToNotification);
  },

  markAsRead: async (id) => {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .select('*');
    if (error) {
      console.warn("Mark as read failed:", error.message);
    }
    return data;
  },

  markAllAsRead: async () => {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('read', false)
      .select('*');
    if (error) {
      console.warn("Mark all as read failed:", error.message);
    }
    return data;
  },

  createNotification: async (notifData) => {
    const notif = {
      id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      recipient_role: notifData.recipientRole || 'manager',
      vendor_id: notifData.vendorId || null,
      title: notifData.title,
      message: notifData.message,
      timestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      type: notifData.type || 'general',
      link: notifData.link || null
    };

    const { data, error } = await supabase
      .from('notifications')
      .insert(notif)
      .select('*');

    if (error) console.warn("Create notification error:", error.message);

    // Broadcast live custom event
    try {
      window.dispatchEvent(new CustomEvent('procurehub_notification', { detail: mapDBToNotification(notif) }));
    } catch (e) {}

    return data ? mapDBToNotification(data[0]) : mapDBToNotification(notif);
  }
};
