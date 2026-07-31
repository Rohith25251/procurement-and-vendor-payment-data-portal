import { supabase } from '../supabaseClient';
import { notificationApi } from './notificationApi';

const mapDBToVendor = (v) => {
  if (!v) return null;
  return {
    id: v.id,
    userId: v.user_id,
    name: v.name,
    code: v.code,
    contactPerson: v.contact_person,
    email: v.email,
    phone: v.phone,
    category: v.category,
    status: v.status,
    score: Number(v.score) || 100,
    address: v.address,
    gstin: v.gstin || '',
    pan: v.pan || '',
    joinedDate: v.joined_date,
    onTimeDeliveryRate: 100,
    qualityRating: 5.0,
    documents: []
  };
};

export const vendorApi = {
  getVendors: async () => {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .order('name');
    if (error) throw error;
    return data.map(mapDBToVendor);
  },

  getVendorById: async (id) => {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .or(`id.eq.${id},user_id.eq.${id}`);
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Vendor not found');
    return mapDBToVendor(data[0]);
  },

  /**
   * Public self-registration: inserts ONLY into the vendors table with status 'Pending'.
   * No users row is created here — that happens on manager approval.
   */
  signupVendor: async (formData) => {
    const vendorId = `vnd_${Date.now()}`;
    const codePrefix = formData.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 3);

    const dbData = {
      id: vendorId,
      user_id: null, // will be filled when manager approves
      name: formData.name,
      code: `VND-${codePrefix}-${Math.floor(100 + Math.random() * 900)}`,
      contact_person: formData.contactPerson,
      email: formData.email.toLowerCase().trim(),
      phone: formData.phone,
      category: formData.category,
      status: 'Pending',
      score: 100.0,
      address: formData.address || null,
      gstin: formData.gstin ? formData.gstin.toUpperCase() : null,
      pan: formData.pan ? formData.pan.toUpperCase() : null,
      password: formData.password,
      joined_date: new Date().toISOString().split('T')[0],
    };

    const { data, error } = await supabase
      .from('vendors')
      .insert(dbData)
      .select('*');

    if (error) throw error;

    // Trigger Live Notification for Manager
    try {
      await notificationApi.createNotification({
        recipientRole: 'manager',
        title: 'New Vendor Registration',
        message: `${formData.name} has submitted a registration request.`,
        type: 'vendor_onboarding',
        link: '/manager/vendors'
      });
    } catch (notifErr) {
      console.warn('Failed to send manager signup notification', notifErr);
    }

    return mapDBToVendor(data[0]);
  },

  /**
   * Approve vendor: updates status to 'Approved'.
   * Vendors log in directly via the vendors table — no users row is created.
   */
  approveVendor: async (id) => {
    // 1. Fetch the full vendor record
    const { data: vendorRows, error: fetchErr } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', id);
    if (fetchErr) throw fetchErr;
    if (!vendorRows || vendorRows.length === 0) throw new Error('Vendor not found');
    const vendorRecord = vendorRows[0];

    // 2. Update status to Approved
    const { data, error } = await supabase
      .from('vendors')
      .update({ status: 'Approved' })
      .eq('id', id)
      .select('*');
    if (error) throw error;

    // Trigger Live Notification for Vendor
    try {
      await notificationApi.createNotification({
        recipientRole: 'vendor',
        vendorId: id,
        title: 'Vendor Portal Approved',
        message: 'Your vendor registration has been approved! You can now log in and manage products/invoices.',
        type: 'vendor_onboarding',
        link: '/vendor/dashboard'
      });
    } catch (notifErr) {
      console.warn('Failed to send vendor approval notification', notifErr);
    }

    return {
      vendor: mapDBToVendor(data[0]),
      loginEmail: vendorRecord.email,
      loginPassword: vendorRecord.password,
    };
  },

  rejectVendor: async (id, reason) => {
    const { data, error } = await supabase
      .from('vendors')
      .update({ status: 'Rejected' })
      .eq('id', id)
      .select('*');
    if (error) throw error;

    // Trigger Live Notification for Vendor
    try {
      await notificationApi.createNotification({
        recipientRole: 'vendor',
        vendorId: id,
        title: 'Vendor Registration Rejected',
        message: `Your registration request has been rejected. Reason: ${reason || 'Does not meet criteria'}`,
        type: 'vendor_onboarding'
      });
    } catch (notifErr) {
      console.warn('Failed to send vendor rejection notification', notifErr);
    }

    return mapDBToVendor(data[0]);
  },

  createVendor: async (vendorData) => {
    const dbData = {
      id: vendorData.id || `vnd_custom_${Date.now()}`,
      user_id: vendorData.userId || null,
      name: vendorData.name,
      code: vendorData.code || `VND-CST-${Math.floor(100 + Math.random() * 900)}`,
      contact_person: vendorData.contactPerson,
      email: vendorData.email,
      phone: vendorData.phone,
      category: vendorData.category,
      status: vendorData.status || 'Approved',
      score: vendorData.score || 100.0,
      address: vendorData.address,
      gstin: vendorData.gstin || null,
      pan: vendorData.pan || null,
      password: null,
      joined_date: vendorData.joinedDate || new Date().toISOString().split('T')[0]
    };

    const { data, error } = await supabase
      .from('vendors')
      .insert(dbData)
      .select('*');
    if (error) throw error;
    return mapDBToVendor(data[0]);
  },

  updateVendor: async (id, vendorData) => {
    const updateData = {};
    if (vendorData.name !== undefined) updateData.name = vendorData.name;
    if (vendorData.contactPerson !== undefined) updateData.contact_person = vendorData.contactPerson;
    if (vendorData.email !== undefined) updateData.email = vendorData.email;
    if (vendorData.phone !== undefined) updateData.phone = vendorData.phone;
    if (vendorData.category !== undefined) updateData.category = vendorData.category;
    if (vendorData.status !== undefined) updateData.status = vendorData.status;
    if (vendorData.score !== undefined) updateData.score = vendorData.score;
    if (vendorData.address !== undefined) updateData.address = vendorData.address;
    if (vendorData.gstin !== undefined) updateData.gstin = vendorData.gstin ? vendorData.gstin.toUpperCase() : null;
    if (vendorData.pan !== undefined) updateData.pan = vendorData.pan ? vendorData.pan.toUpperCase() : null;

    const { data, error } = await supabase
      .from('vendors')
      .update(updateData)
      .eq('id', id)
      .select('*');
    if (error) throw error;
    return mapDBToVendor(data[0]);
  },

  deactivateVendor: async (id) => {
    const { data, error } = await supabase
      .from('vendors')
      .update({ status: 'Deactivated' })
      .eq('id', id)
      .select('*');
    if (error) throw error;
    return mapDBToVendor(data[0]);
  }
};
