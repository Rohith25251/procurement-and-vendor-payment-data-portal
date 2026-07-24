import { delay, getStorageData, setStorageData } from './apiUtils';
import { INITIAL_VENDORS } from '../mock/vendors';

const VENDORS_KEY = 'procure_vendors_db';

export const vendorApi = {
  getVendors: async () => {
    await delay(400);
    return getStorageData(VENDORS_KEY, INITIAL_VENDORS);
  },

  getVendorById: async (id) => {
    await delay(300);
    const vendors = getStorageData(VENDORS_KEY, INITIAL_VENDORS);
    const vendor = vendors.find(v => v.id === id || v.vendorId === id);
    if (!vendor) throw new Error('Vendor not found');
    return vendor;
  },

  approveVendor: async (id) => {
    await delay(400);
    const vendors = getStorageData(VENDORS_KEY, INITIAL_VENDORS);
    const updated = vendors.map(v => 
      v.id === id ? { ...v, status: 'Approved' } : v
    );
    setStorageData(VENDORS_KEY, updated);
    return updated.find(v => v.id === id);
  },

  rejectVendor: async (id, reason) => {
    await delay(400);
    const vendors = getStorageData(VENDORS_KEY, INITIAL_VENDORS);
    const updated = vendors.map(v => 
      v.id === id ? { ...v, status: 'Rejected', rejectionReason: reason } : v
    );
    setStorageData(VENDORS_KEY, updated);
    return updated.find(v => v.id === id);
  },

  createVendor: async (vendorData) => {
    await delay(450);
    const vendors = getStorageData(VENDORS_KEY, INITIAL_VENDORS);
    const newVendor = {
      id: `vnd_custom_${Date.now()}`,
      userId: `usr_vnd_${Date.now()}`,
      code: `VND-CST-${Math.floor(100 + Math.random() * 900)}`,
      status: 'Approved',
      score: 100.0,
      onTimeDeliveryRate: 100.0,
      qualityRating: 5.0,
      joinedDate: new Date().toISOString().split('T')[0],
      documents: [],
      ...vendorData
    };
    const updated = [newVendor, ...vendors];
    setStorageData(VENDORS_KEY, updated);
    return newVendor;
  },

  updateVendor: async (id, vendorData) => {
    await delay(400);
    const vendors = getStorageData(VENDORS_KEY, INITIAL_VENDORS);
    const updated = vendors.map(v => 
      v.id === id ? { ...v, ...vendorData } : v
    );
    setStorageData(VENDORS_KEY, updated);
    return updated.find(v => v.id === id);
  },

  deactivateVendor: async (id) => {
    await delay(400);
    const vendors = getStorageData(VENDORS_KEY, INITIAL_VENDORS);
    const updated = vendors.map(v => 
      v.id === id ? { ...v, status: 'Deactivated' } : v
    );
    setStorageData(VENDORS_KEY, updated);
    return updated.find(v => v.id === id);
  }
};
