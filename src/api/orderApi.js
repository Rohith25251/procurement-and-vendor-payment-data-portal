import { supabase } from '../supabaseClient';
import { notificationApi } from './notificationApi';

const mapDBToPO = (po) => {
  if (!po) return null;
  return {
    id: po.id,
    poNumber: po.po_number,
    vendorId: po.vendor_id,
    vendorName: po.vendor_name,
    category: po.category,
    status: po.status,
    createdDate: po.created_date,
    expectedDeliveryDate: po.expected_delivery_date,
    paymentTerms: po.payment_terms,
    deliveryAddress: po.delivery_address,
    totalAmount: Number(po.total_amount) || 0,
    currency: po.currency || 'INR',
    notes: po.notes || '',
    queryComment: po.query_comment || null,
    rejectionReason: po.rejection_reason || null,
    quotation: po.quotation || null,
    shipmentUpdates: po.shipment_updates || [],
    items: po.items || [],
    history: po.history || []
  };
};

const addHistoryEntry = (po, newStatus, actor) => {
  const history = po.history || [];
  const now = new Date();
  const formatted = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return [...history, { status: newStatus, timestamp: formatted, actor }];
};

export const orderApi = {
  getOrders: async () => {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*')
      .order('po_number', { ascending: false });
    if (error) throw error;
    return data.map(mapDBToPO);
  },

  getOrderById: async (id) => {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*')
      .or(`id.eq.${id},po_number.eq.${id}`);
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Purchase order not found');
    return mapDBToPO(data[0]);
  },

  createOrder: async (orderData, managerName = 'Eleanor Vance') => {
    // Generate PO Number based on the highest suffix of existing POs to avoid duplicates
    const { data: pos, error: fetchError } = await supabase
      .from('purchase_orders')
      .select('po_number');
    
    if (fetchError) throw fetchError;
    
    let maxSuffix = 0;
    if (pos && pos.length > 0) {
      for (const p of pos) {
        if (p.po_number && p.po_number.startsWith('PO-2026-')) {
          const suffixStr = p.po_number.substring(8);
          const suffixNum = parseInt(suffixStr, 10);
          if (!isNaN(suffixNum) && suffixNum > maxSuffix) {
            maxSuffix = suffixNum;
          }
        }
      }
    }
    const nextNum = maxSuffix + 1;
    const poNumber = `PO-2026-${String(nextNum).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    const tempPO = {
      history: []
    };
    const initialHistory = addHistoryEntry(tempPO, 'Invoice Requested', `${managerName} (Manager)`);

    const dbData = {
      id: orderData.id || `po_${Date.now()}`,
      po_number: poNumber,
      vendor_id: orderData.vendorId,
      vendor_name: orderData.vendorName,
      category: orderData.category,
      status: 'Invoice Requested',
      created_date: today,
      expected_delivery_date: orderData.expectedDeliveryDate,
      payment_terms: orderData.paymentTerms,
      delivery_address: orderData.deliveryAddress,
      total_amount: Number(orderData.totalAmount),
      currency: orderData.currency || 'INR',
      notes: orderData.notes,
      items: orderData.items || [],
      history: initialHistory
    };

    const { data, error } = await supabase
      .from('purchase_orders')
      .insert(dbData)
      .select('*');

    if (error) throw error;

    // Trigger Live Notification for Vendor
    try {
      await notificationApi.createNotification({
        recipientRole: 'vendor',
        vendorId: orderData.vendorId,
        title: 'New PO Received',
        message: `You have received a new Purchase Order request ${poNumber} for ₹${Number(orderData.totalAmount).toLocaleString('en-IN')}.`,
        type: 'po_status',
        link: '/vendor/invoices'
      });
    } catch (notifErr) {
      console.warn('Failed to send vendor PO notification', notifErr);
    }

    return mapDBToPO(data[0]);
  },

  declineInvoice: async (id, reason, vendorName = 'Vendor') => {
    const po = await orderApi.getOrderById(id);
    const updatedHistory = addHistoryEntry(po, 'Invoice Declined', `${vendorName} (Vendor)`);

    const { data, error } = await supabase
      .from('purchase_orders')
      .update({
        status: 'Invoice Declined',
        rejection_reason: reason || 'No reason provided',
        history: updatedHistory
      })
      .eq('id', id)
      .select('*');

    if (error) throw error;

    try {
      await notificationApi.createNotification({
        recipientRole: 'manager',
        title: 'Invoice Request Declined by Vendor',
        message: `${vendorName} declined the invoice request for PO ${po.poNumber}. Reason: "${reason || 'No reason provided'}"`,
        type: 'po_status',
        link: '/manager/procurement'
      });
    } catch (notifErr) {
      console.warn('Failed to send invoice decline notification', notifErr);
    }

    return mapDBToPO(data[0]);
  },

  acceptInvoice: async (id, vendorName = 'Vendor') => {
    const po = await orderApi.getOrderById(id);
    const nowFormatted = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updatedHistory = addHistoryEntry(po, 'Invoice Accepted', `${vendorName} (Vendor)`);

    const { data, error } = await supabase
      .from('purchase_orders')
      .update({
        status: 'Invoice Accepted',
        query_comment: null,
        history: updatedHistory
      })
      .eq('id', id)
      .select('*');

    if (error) throw error;

    // Auto-create invoice so manager can process payment at any time
    try {
      const invNumber = `INV-${po.poNumber.replace('PO-', '')}-${Math.floor(100 + Math.random() * 900)}`;
      await supabase.from('invoices').insert({
        id: `inv_${Date.now()}`,
        invoice_number: invNumber,
        po_id: po.id,
        po_number: po.poNumber,
        vendor_id: po.vendorId,
        vendor_name: po.vendorName,
        total_amount: po.totalAmount,
        paid_amount: 0,
        remaining_balance: po.totalAmount,
        status: 'Submitted',
        submitted_at: nowFormatted,
        pdf_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
      });
    } catch (invErr) {
      console.warn('Failed to auto-create invoice on acceptance', invErr);
    }

    // Notify manager
    try {
      await notificationApi.createNotification({
        recipientRole: 'manager',
        title: 'Invoice Accepted by Vendor',
        message: `${vendorName} accepted the invoice for PO ${po.poNumber}. You can now process payment.`,
        type: 'po_status',
        link: '/manager/invoices'
      });
    } catch (notifErr) {
      console.warn('Failed to send invoice accept notification', notifErr);
    }

    return mapDBToPO(data[0]);
  },

  markDelivered: async (id, vendorName = 'Vendor') => {
    const po = await orderApi.getOrderById(id);
    const updatedHistory = addHistoryEntry(po, 'Delivered', `${vendorName} (Vendor)`);

    const { data, error } = await supabase
      .from('purchase_orders')
      .update({
        status: 'Delivered',
        history: updatedHistory
      })
      .eq('id', id)
      .select('*');

    if (error) throw error;
    return mapDBToPO(data[0]);
  },

  markShipped: async (id, vendorName = 'Vendor') => {
    const po = await orderApi.getOrderById(id);
    const updatedHistory = addHistoryEntry(po, 'Shipped', `${vendorName} (Vendor)`);

    const { data, error } = await supabase
      .from('purchase_orders')
      .update({
        status: 'Shipped',
        history: updatedHistory
      })
      .eq('id', id)
      .select('*');

    if (error) throw error;

    // Notify manager
    try {
      await notificationApi.createNotification({
        recipientRole: 'manager',
        title: 'Order Shipped',
        message: `${vendorName} has shipped PO ${po.poNumber}. Expected delivery soon.`,
        type: 'po_status',
        link: '/manager/procurement'
      });
    } catch (notifErr) {
      console.warn('Failed to send shipment notification', notifErr);
    }

    return mapDBToPO(data[0]);
  },

  markOutForDelivery: async (id, vendorName = 'Vendor') => {
    const po = await orderApi.getOrderById(id);
    const updatedHistory = addHistoryEntry(po, 'Out for Delivery', `${vendorName} (Vendor)`);

    const { data, error } = await supabase
      .from('purchase_orders')
      .update({
        status: 'Out for Delivery',
        history: updatedHistory
      })
      .eq('id', id)
      .select('*');

    if (error) throw error;

    // Trigger Live Notification for Manager
    try {
      await notificationApi.createNotification({
        recipientRole: 'manager',
        title: 'Shipment Out for Delivery',
        message: `Vendor ${vendorName} has shipped PO ${po.poNumber}. It is now out for delivery.`,
        type: 'po_status',
        link: '/manager/procurement'
      });
    } catch (notifErr) {
      console.warn('Failed to send manager PO delivery notification', notifErr);
    }

    return mapDBToPO(data[0]);
  },

  confirmDelivery: async (id, managerName = 'Manager') => {
    const po = await orderApi.getOrderById(id);
    const updatedHistory = addHistoryEntry(po, 'Delivered', `${managerName} (Manager)`);

    const { data, error } = await supabase
      .from('purchase_orders')
      .update({
        status: 'Delivered',
        history: updatedHistory
      })
      .eq('id', id)
      .select('*');

    if (error) throw error;

    // Trigger Live Notification for Vendor
    try {
      await notificationApi.createNotification({
        recipientRole: 'vendor',
        vendorId: po.vendorId,
        title: 'PO Delivery Confirmed',
        message: `Manager has confirmed delivery for PO ${po.poNumber}. You can now submit your invoice.`,
        type: 'po_status',
        link: '/vendor/invoices'
      });
    } catch (notifErr) {
      console.warn('Failed to send vendor PO delivery confirmation notification', notifErr);
    }

    return mapDBToPO(data[0]);
  },

  updateOrder: async (id, orderData, managerName = 'Eleanor Vance') => {
    const po = await orderApi.getOrderById(id);
    const updatedHistory = addHistoryEntry(po, 'Updated PO Details', `${managerName} (Manager)`);

    const dbData = {
      expected_delivery_date: orderData.expectedDeliveryDate,
      payment_terms: orderData.paymentTerms,
      delivery_address: orderData.deliveryAddress,
      notes: orderData.notes,
      total_amount: Number(orderData.totalAmount),
      items: orderData.items || [],
      history: updatedHistory
    };

    const { data, error } = await supabase
      .from('purchase_orders')
      .update(dbData)
      .eq('id', id)
      .select('*');

    if (error) throw error;
    return mapDBToPO(data[0]);
  },

  deleteOrder: async (id) => {
    const { error } = await supabase
      .from('purchase_orders')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
};
