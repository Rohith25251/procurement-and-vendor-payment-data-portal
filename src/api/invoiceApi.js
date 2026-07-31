import { supabase } from '../supabaseClient';
import { orderApi } from './orderApi';
import { notificationApi } from './notificationApi';

const mapDBToInvoice = (inv) => {
  if (!inv) return null;
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
    attachment: {
      fileName: `Invoice-${inv.invoice_number}.pdf`,
      fileSize: '1.2 MB',
      url: inv.pdf_url || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
    },
    items: [],
    vendorGstin: inv.vendor_gstin || null
  };
};

export const invoiceApi = {
  getInvoices: async () => {
    const { data: invoices, error: invError } = await supabase
      .from('invoices')
      .select('*')
      .order('invoice_number', { ascending: false });
    if (invError) throw invError;

    // Fetch vendors to get GSTIN
    const { data: vendors, error: vendorError } = await supabase
      .from('vendors')
      .select('id, gstin');
    
    const vendorGstinMap = {};
    if (!vendorError && vendors) {
      vendors.forEach(v => {
        vendorGstinMap[v.id] = v.gstin;
      });
    }

    const { data: pos, error: poError } = await supabase
      .from('purchase_orders')
      .select('id, items');
    if (poError) throw poError;

    const poItemsMap = {};
    if (pos) {
      pos.forEach(po => {
        poItemsMap[po.id] = po.items;
      });
    }

    return invoices.map(inv => {
      const mapped = mapDBToInvoice(inv);
      mapped.vendorGstin = vendorGstinMap[inv.vendor_id] || null;
      mapped.items = (poItemsMap[inv.po_id] || []).map(i => ({
        description: i.name || i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        total: i.total
      }));
      return mapped;
    });
  },

  getInvoiceById: async (id) => {
    const { data: invoices, error: invError } = await supabase
      .from('invoices')
      .select('*')
      .or(`id.eq.${id},invoice_number.eq.${id}`);
    if (invError) throw invError;
    if (!invoices || invoices.length === 0) throw new Error('Invoice not found');

    const inv = invoices[0];
    const mapped = mapDBToInvoice(inv);

    try {
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('gstin')
        .eq('id', inv.vendor_id);
      if (vendorData && vendorData.length > 0) {
        mapped.vendorGstin = vendorData[0].gstin;
      }
    } catch (e) {
      console.warn('Failed to fetch vendor GSTIN for invoice', e);
    }

    try {
      const po = await orderApi.getOrderById(inv.po_id);
      if (po && po.items) {
        mapped.items = po.items.map(i => ({
          description: i.name || i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: i.total
        }));
      }
    } catch (e) {
      console.warn('Failed to fetch PO items for invoice', e);
    }

    return mapped;
  },

  checkDuplicate: async (newInvoiceNumber, amount, vendorId) => {
    const { data: existingInvoices, error } = await supabase
      .from('invoices')
      .select('invoice_number, total_amount, vendor_id, status')
      .neq('status', 'Rejected');

    if (error) return { isDuplicateRisk: false, reason: null };

    // 1. Exact invoice number match
    const exactMatch = existingInvoices.find(
      i => i.invoice_number.toLowerCase() === newInvoiceNumber.toLowerCase()
    );
    if (exactMatch) {
      return {
        isDuplicateRisk: true,
        reason: `Exact match found with active Invoice #${exactMatch.invoice_number}`
      };
    }

    // 2. Similar amount & vendor match
    const closeAmountMatch = existingInvoices.find(
      i => i.vendor_id === vendorId && Math.abs(Number(i.total_amount) - amount) < 1.00
    );
    if (closeAmountMatch) {
      return {
        isDuplicateRisk: true,
        reason: `Similar amount (₹${amount.toLocaleString('en-IN')}) & vendor combination match active Invoice #${closeAmountMatch.invoice_number}`
      };
    }

    return { isDuplicateRisk: false, reason: null };
  },

  submitInvoice: async (invoiceData, vendorName = 'Vendor') => {
    // Check duplicates
    const dupCheck = await invoiceApi.checkDuplicate(
      invoiceData.invoiceNumber,
      invoiceData.totalAmount,
      invoiceData.vendorId
    );

    const nowFormatted = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Resolve vendorId (fuzzy match/find or auto-create vendor)
    let finalVendorId = invoiceData.vendorId;

    if (!finalVendorId && invoiceData.vendorName) {
      try {
        const { data: existingVendors, error: findError } = await supabase
          .from('vendors')
          .select('id, name');
        
        if (!findError && existingVendors) {
          const matched = existingVendors.find(
            v => v.name.toLowerCase() === invoiceData.vendorName.trim().toLowerCase()
          );
          if (matched) {
            finalVendorId = matched.id;
          }
        }
      } catch (e) {
        console.warn("Failed to find existing vendor by name", e);
      }
    }

    if (!finalVendorId && invoiceData.vendorName) {
      console.warn(`No matching vendor found for "${invoiceData.vendorName}". Creating invoice without vendor link — vendor name stored as text only.`);
    }

    // 2. Resolve PO (auto-create linked PO for external invoices)
    let finalPoId = invoiceData.poId;
    let finalPoNumber = invoiceData.poNumber || 'EXTERNAL';
    let isExternalInvoice = false;

    if (!finalPoId) {
      isExternalInvoice = true;
      // Auto-create a dummy PO to store items for external invoices
      try {
        const po = await orderApi.createOrder({
          vendorId: finalVendorId,
          vendorName: invoiceData.vendorName,
          category: invoiceData.category || 'Software / SaaS (Software as a Service)',
          expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
          paymentTerms: 'Net 30',
          deliveryAddress: 'Main Office',
          totalAmount: invoiceData.totalAmount,
          notes: `Auto-generated for External Invoice #${invoiceData.invoiceNumber}`,
          items: (invoiceData.items || []).map(i => ({
            name: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            total: i.total
          }))
        }, 'System');
        
        finalPoId = po.id;
        finalPoNumber = po.poNumber;

        // Immediately update this PO's status to 'Paid' and update history
        const timestamp = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const updatedHistory = [
          { status: 'Invoice Requested', timestamp, actor: 'System' },
          { status: 'Paid', timestamp, actor: 'System' }
        ];

        await supabase
          .from('purchase_orders')
          .update({
            status: 'Paid',
            history: updatedHistory
          })
          .eq('id', finalPoId);

      } catch (e) {
        console.error("Failed to auto-create PO for external invoice", e);
        throw e;
      }
    }

    const dbInvoice = {
      id: `inv_${Date.now()}`,
      invoice_number: invoiceData.invoiceNumber,
      po_id: finalPoId,
      po_number: finalPoNumber,
      vendor_id: finalVendorId,
      vendor_name: invoiceData.vendorName,
      total_amount: invoiceData.totalAmount,
      paid_amount: isExternalInvoice ? invoiceData.totalAmount : 0.00,
      remaining_balance: isExternalInvoice ? 0.00 : invoiceData.totalAmount,
      status: isExternalInvoice ? 'Paid' : 'Submitted',
      submitted_at: nowFormatted,
      pdf_url: invoiceData.pdfUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
    };

    const { data, error: invError } = await supabase
      .from('invoices')
      .insert(dbInvoice)
      .select('*');

    if (invError) throw invError;

    // For external invoices, also auto-create a Payment record immediately so it appears under paid category and is included in analytics / spend trend
    if (isExternalInvoice) {
      try {
        const todayDate = new Date().toISOString().split('T')[0];
        const dbPayment = {
          id: `pmt_${Date.now()}`,
          invoice_id: dbInvoice.id,
          invoice_number: dbInvoice.invoice_number,
          po_id: finalPoId,
          po_number: finalPoNumber,
          vendor_id: finalVendorId,
          vendor_name: invoiceData.vendorName,
          amount_paid: invoiceData.totalAmount,
          running_balance: 0.00,
          payment_method: 'Direct Transfer',
          reference_number: `REF-AUTO-${Math.floor(100000 + Math.random() * 900000)}`,
          payment_date: todayDate,
          status: 'Paid',
          is_external: true,
          notes: `Auto-recorded payment for uploaded external invoice #${invoiceData.invoiceNumber}`
        };

        await supabase
          .from('payments')
          .insert(dbPayment);
      } catch (payError) {
        console.error("Failed to auto-create payment record for external invoice", payError);
      }
    } else {
      // Update PO status to "Invoice Submitted" for non-external POs
      if (finalPoId) {
        try {
          const po = await orderApi.getOrderById(finalPoId);
          const history = po.history || [];
          const updatedHistory = [...history, { status: 'Invoice Submitted', timestamp: nowFormatted, actor: `${vendorName} (Vendor)` }];

          await supabase
            .from('purchase_orders')
            .update({
              status: 'Invoice Submitted',
              history: updatedHistory
            })
            .eq('id', finalPoId);
        } catch (e) {
          console.error("Failed to update PO status on invoice submit", e);
        }
      }
    }

    const mapped = mapDBToInvoice(data[0]);
    if (invoiceData.items) {
      mapped.items = invoiceData.items;
    }

    // Trigger Live Notification for Manager
    try {
      await notificationApi.createNotification({
        recipientRole: 'manager',
        title: 'New Invoice Submitted',
        message: `${invoiceData.vendorName} submitted Invoice ${invoiceData.invoiceNumber} for PO ${finalPoNumber}.`,
        type: 'invoice_status',
        link: '/manager/invoices'
      });
    } catch (notifErr) {
      console.warn('Failed to send manager invoice submission notification', notifErr);
    }

    return mapped;
  },


  verifyInvoice: async (id, managerName = 'Eleanor Vance') => {
    const today = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const { data: invoices, error: invError } = await supabase
      .from('invoices')
      .update({
        status: 'Verified'
      })
      .eq('id', id)
      .select('*');

    if (invError) throw invError;
    const inv = invoices[0];

    // Update PO status to "Invoice Verified"
    if (inv.po_id) {
      try {
        const po = await orderApi.getOrderById(inv.po_id);
        const history = po.history || [];
        const updatedHistory = [...history, { status: 'Invoice Verified', timestamp: today, actor: `${managerName} (Manager)` }];

        await supabase
          .from('purchase_orders')
          .update({
            status: 'Invoice Verified',
            history: updatedHistory
          })
          .eq('id', inv.po_id);
      } catch (e) {
        console.error("Failed to update PO status on invoice verify", e);
      }
    }

    // Trigger Live Notification for Vendor
    try {
      await notificationApi.createNotification({
        recipientRole: 'vendor',
        vendorId: inv.vendor_id,
        title: 'Invoice Verified',
        message: `Your Invoice ${inv.invoice_number} has been verified by the manager and queued for payment.`,
        type: 'invoice_status',
        link: '/vendor/invoices'
      });
    } catch (notifErr) {
      console.warn('Failed to send vendor invoice verification notification', notifErr);
    }

    return mapDBToInvoice(inv);
  },

  rejectInvoice: async (id, reason, managerName = 'Eleanor Vance') => {
    const { data, error } = await supabase
      .from('invoices')
      .update({
        status: 'Rejected',
        rejection_reason: reason
      })
      .eq('id', id)
      .select('*');

    if (error) throw error;
    const inv = data[0];

    // Trigger Live Notification for Vendor
    try {
      await notificationApi.createNotification({
        recipientRole: 'vendor',
        vendorId: inv.vendor_id,
        title: 'Invoice Rejected',
        message: `Your Invoice ${inv.invoice_number} has been rejected. Reason: ${reason || 'Does not match terms'}`,
        type: 'invoice_status',
        link: '/vendor/invoices'
      });
    } catch (notifErr) {
      console.warn('Failed to send vendor invoice rejection notification', notifErr);
    }

    return mapDBToInvoice(inv);
  }
};
