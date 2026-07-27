import { supabase } from '../supabaseClient';
import { orderApi } from './orderApi';

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
    items: []
  };
};

export const invoiceApi = {
  getInvoices: async () => {
    const { data: invoices, error: invError } = await supabase
      .from('invoices')
      .select('*')
      .order('invoice_number', { ascending: false });
    if (invError) throw invError;

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
      try {
        const newVendorId = `vnd_custom_${Date.now()}`;
        const newUserId = `usr_vnd_${Date.now()}`;
        const cleanName = invoiceData.vendorName.trim();
        const shortName = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'vendor';
        
        const dbVendor = {
          id: newVendorId,
          user_id: newUserId,
          name: cleanName,
          code: `VND-CST-${Math.floor(100 + Math.random() * 900)}`,
          contact_person: 'Finance Dept',
          email: `${shortName}@example.com`,
          phone: '+91 98765 43210',
          category: invoiceData.category || 'Software / SaaS (Software as a Service)',
          status: 'Approved',
          score: 100,
          address: 'Main Office Address',
          joined_date: new Date().toISOString().split('T')[0]
        };

        const { data: vData, error: vError } = await supabase
          .from('vendors')
          .insert(dbVendor)
          .select('*');

        if (vError) {
          console.error("Failed to insert auto-created vendor:", vError);
          throw vError;
        }
        
        if (vData && vData[0]) {
          finalVendorId = vData[0].id;
        }
      } catch (e) {
        console.error("Failed to auto-create vendor record", e);
        throw new Error(`Failed to register vendor: ${e.message || e}`);
      }
    }

    // 2. Resolve PO (auto-create linked PO for external invoices)
    let finalPoId = invoiceData.poId;
    let finalPoNumber = invoiceData.poNumber || 'EXTERNAL';

    if (!finalPoId) {
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
      paid_amount: 0.00,
      remaining_balance: invoiceData.totalAmount,
      status: 'Submitted',
      submitted_at: nowFormatted,
      pdf_url: invoiceData.pdfUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
    };

    const { data, error: invError } = await supabase
      .from('invoices')
      .insert(dbInvoice)
      .select('*');

    if (invError) throw invError;

    // Update PO status to "Invoice Submitted"
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


    const mapped = mapDBToInvoice(data[0]);
    if (invoiceData.items) {
      mapped.items = invoiceData.items;
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
    return mapDBToInvoice(data[0]);
  }
};
