import { delay, getStorageData, setStorageData } from './apiUtils';
import { INITIAL_PURCHASE_ORDERS } from '../mock/purchaseOrders';

const ORDERS_KEY = 'procure_orders_db';

const addHistoryEntry = (po, newStatus, actor) => {
  const history = po.history || [];
  const now = new Date();
  const formatted = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return [...history, { status: newStatus, timestamp: formatted, actor }];
};

export const orderApi = {
  getOrders: async () => {
    await delay(400);
    return getStorageData(ORDERS_KEY, INITIAL_PURCHASE_ORDERS);
  },

  getOrderById: async (id) => {
    await delay(300);
    const orders = getStorageData(ORDERS_KEY, INITIAL_PURCHASE_ORDERS);
    const po = orders.find(o => o.id === id || o.poNumber === id);
    if (!po) throw new Error('Purchase order not found');
    return po;
  },

  createOrder: async (orderData, managerName = 'Eleanor Vance') => {
    await delay(500);
    const orders = getStorageData(ORDERS_KEY, INITIAL_PURCHASE_ORDERS);
    const count = orders.length + 1;
    const poNumber = `PO-2026-${String(count).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    const newPO = {
      id: `po_${Date.now()}`,
      poNumber,
      status: 'Requested',
      createdDate: today,
      approvedDate: null,
      sentDate: null,
      acceptedDate: null,
      deliveredDate: null,
      invoiceSubmittedDate: null,
      invoiceVerifiedDate: null,
      paidDate: null,
      queryComment: null,
      rejectionReason: null,
      history: [],
      ...orderData
    };

    newPO.history = addHistoryEntry(newPO, 'Requested', `${managerName} (Manager)`);

    const updated = [newPO, ...orders];
    setStorageData(ORDERS_KEY, updated);
    return newPO;
  },

  approveOrder: async (id, managerName = 'Marcus Brody') => {
    await delay(400);
    const orders = getStorageData(ORDERS_KEY, INITIAL_PURCHASE_ORDERS);
    const today = new Date().toISOString().split('T')[0];
    
    const updated = orders.map(po => {
      if (po.id === id) {
        const nextHistory = addHistoryEntry(
          addHistoryEntry(po, 'Approved', `${managerName} (Manager)`),
          'Sent to Vendor',
          'System'
        );
        return {
          ...po,
          status: 'Sent to Vendor', // Auto progresses to sent to vendor
          approvedDate: today,
          sentDate: today,
          history: nextHistory
        };
      }
      return po;
    });

    setStorageData(ORDERS_KEY, updated);
    return updated.find(o => o.id === id);
  },

  rejectOrder: async (id, reason, managerName = 'Marcus Brody') => {
    await delay(400);
    const orders = getStorageData(ORDERS_KEY, INITIAL_PURCHASE_ORDERS);
    const updated = orders.map(po => {
      if (po.id === id) {
        return {
          ...po,
          status: 'Rejected',
          rejectionReason: reason,
          history: addHistoryEntry(po, 'Rejected', `${managerName} (Manager)`)
        };
      }
      return po;
    });

    setStorageData(ORDERS_KEY, updated);
    return updated.find(o => o.id === id);
  },

  acceptOrder: async (id, vendorName = 'Vendor') => {
    await delay(400);
    const orders = getStorageData(ORDERS_KEY, INITIAL_PURCHASE_ORDERS);
    const today = new Date().toISOString().split('T')[0];

    const updated = orders.map(po => {
      if (po.id === id) {
        return {
          ...po,
          status: 'Accepted',
          acceptedDate: today,
          queryComment: null,
          history: addHistoryEntry(po, 'Accepted', `${vendorName} (Vendor)`)
        };
      }
      return po;
    });

    setStorageData(ORDERS_KEY, updated);
    return updated.find(o => o.id === id);
  },

  raiseQuery: async (id, comment, vendorName = 'Vendor') => {
    await delay(400);
    const orders = getStorageData(ORDERS_KEY, INITIAL_PURCHASE_ORDERS);

    const updated = orders.map(po => {
      if (po.id === id) {
        return {
          ...po,
          status: 'Query Raised',
          queryComment: comment,
          history: addHistoryEntry(po, 'Query Raised', `${vendorName} (Vendor)`)
        };
      }
      return po;
    });

    setStorageData(ORDERS_KEY, updated);
    return updated.find(o => o.id === id);
  },

  markDelivered: async (id, vendorName = 'Vendor') => {
    await delay(400);
    const orders = getStorageData(ORDERS_KEY, INITIAL_PURCHASE_ORDERS);
    const today = new Date().toISOString().split('T')[0];

    const updated = orders.map(po => {
      if (po.id === id) {
        return {
          ...po,
          status: 'Delivered',
          deliveredDate: today,
          history: addHistoryEntry(po, 'Delivered', `${vendorName} (Vendor)`)
        };
      }
      return po;
    });

    setStorageData(ORDERS_KEY, updated);
    return updated.find(o => o.id === id);
  }
};
