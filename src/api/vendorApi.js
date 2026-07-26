import { supabase } from '../supabaseClient';

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

  approveVendor: async (id) => {
    const { data, error } = await supabase
      .from('vendors')
      .update({ status: 'Approved' })
      .eq('id', id)
      .select('*');
    if (error) throw error;
    return mapDBToVendor(data[0]);
  },

  rejectVendor: async (id, reason) => {
    const { data, error } = await supabase
      .from('vendors')
      .update({ status: 'Rejected' })
      .eq('id', id)
      .select('*');
    if (error) throw error;
    return mapDBToVendor(data[0]);
  },

  createVendor: async (vendorData) => {
    const dbData = {
      id: vendorData.id || `vnd_custom_${Date.now()}`,
      user_id: vendorData.userId || `usr_vnd_${Date.now()}`,
      name: vendorData.name,
      code: vendorData.code || `VND-CST-${Math.floor(100 + Math.random() * 900)}`,
      contact_person: vendorData.contactPerson,
      email: vendorData.email,
      phone: vendorData.phone,
      category: vendorData.category,
      status: vendorData.status || 'Approved',
      score: vendorData.score || 100.0,
      address: vendorData.address,
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
