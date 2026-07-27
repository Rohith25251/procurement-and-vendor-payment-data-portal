import { supabase } from '../supabaseClient';

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
    return mapDBToPO(data[0]);
  },

  approveOrder: async (id, managerName = 'Eleanor Vance') => {
    const po = await orderApi.getOrderById(id);
    const updatedHistory = addHistoryEntry(
      { history: addHistoryEntry(po, 'Approved', `${managerName} (Manager)`) },
      'Sent to Vendor',
      'System'
    );

    const { data, error } = await supabase
      .from('purchase_orders')
      .update({
        status: 'Sent to Vendor',
        history: updatedHistory
      })
      .eq('id', id)
      .select('*');

    if (error) throw error;
    return mapDBToPO(data[0]);
  },

  rejectOrder: async (id, reason, managerName = 'Eleanor Vance') => {
    const po = await orderApi.getOrderById(id);
    const updatedHistory = addHistoryEntry(po, 'Rejected', `${managerName} (Manager)`);

    const { data, error } = await supabase
      .from('purchase_orders')
      .update({
        status: 'Rejected',
        rejection_reason: reason,
        history: updatedHistory
      })
      .eq('id', id)
      .select('*');

    if (error) throw error;
    return mapDBToPO(data[0]);
  },

  acceptOrder: async (id, vendorName = 'Vendor') => {
    const po = await orderApi.getOrderById(id);
    const updatedHistory = addHistoryEntry(po, 'Accepted', `${vendorName} (Vendor)`);

    const { data, error } = await supabase
      .from('purchase_orders')
      .update({
        status: 'Accepted',
        query_comment: null,
        history: updatedHistory
      })
      .eq('id', id)
      .select('*');

    if (error) throw error;
    return mapDBToPO(data[0]);
  },

  raiseQuery: async (id, comment, vendorName = 'Vendor') => {
    const po = await orderApi.getOrderById(id);
    const updatedHistory = addHistoryEntry(po, 'Query Raised', `${vendorName} (Vendor)`);

    const { data, error } = await supabase
      .from('purchase_orders')
      .update({
        status: 'Query Raised',
        query_comment: comment,
        history: updatedHistory
      })
      .eq('id', id)
      .select('*');

    if (error) throw error;
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

  generateInvoiceForOrder: async (id, vendorName = 'Vendor') => {
    const po = await orderApi.getOrderById(id);
    
    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0];

    const totalAmount = po.totalAmount;
    const taxAmount = Number((totalAmount * 0.18 / 1.18).toFixed(2));
    const subtotal = Number((totalAmount - taxAmount).toFixed(2));

    const dbInvoice = {
      id: `inv_${Date.now()}`,
      invoice_number: `INV-${po.poNumber.replace('PO-', '')}-${Math.floor(100 + Math.random() * 900)}`,
      po_id: po.id,
      po_number: po.poNumber,
      vendor_id: po.vendorId,
      vendor_name: po.vendorName,
      total_amount: totalAmount,
      paid_amount: 0.00,
      remaining_balance: totalAmount,
      status: 'Submitted',
      submitted_at: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      pdf_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
    };

    const { data: invData, error: invError } = await supabase
      .from('invoices')
      .insert(dbInvoice)
      .select('*');

    if (invError) throw invError;

    const updatedHistory = addHistoryEntry(po, 'Invoice Generated', `${vendorName} (Vendor)`);

    const { error: poError } = await supabase
      .from('purchase_orders')
      .update({
        status: 'Invoice Generated',
        history: updatedHistory
      })
      .eq('id', id);

    if (poError) throw poError;

    // Return the created invoice
    const inv = invData[0];
    return {
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      poId: inv.po_id,
      poNumber: inv.po_number,
      vendorId: inv.vendor_id,
      vendorName: inv.vendor_name,
      totalAmount: Number(inv.total_amount) || 0,
      paidAmount: Number(inv.paid_amount) || 0,
      remainingBalance: Number(inv.remaining_balance) || 0,
      status: inv.status,
      submittedAt: inv.submitted_at,
      pdfUrl: inv.pdf_url,
      rejectionReason: inv.rejection_reason || null,
      items: po.items ? po.items.map(i => ({
        description: i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        total: i.total
      })) : []
    };
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
    return mapDBToPO(data[0]);
  }
};
