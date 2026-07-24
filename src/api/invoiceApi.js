import { delay, getStorageData, setStorageData } from './apiUtils';
import { INITIAL_INVOICES } from '../mock/invoices';
import { orderApi } from './orderApi';

const INVOICES_KEY = 'procure_invoices_db';

export const invoiceApi = {
  getInvoices: async () => {
    await delay(400);
    return getStorageData(INVOICES_KEY, INITIAL_INVOICES);
  },

  getInvoiceById: async (id) => {
    await delay(300);
    const invoices = getStorageData(INVOICES_KEY, INITIAL_INVOICES);
    const invoice = invoices.find(i => i.id === id || i.invoiceNumber === id);
    if (!invoice) throw new Error('Invoice not found');
    return invoice;
  },

  checkDuplicate: (newInvoiceNumber, amount, vendorId, existingInvoices) => {
    // 1. Exact invoice number match
    const exactMatch = existingInvoices.find(
      i => i.invoiceNumber.toLowerCase() === newInvoiceNumber.toLowerCase() && i.status !== 'Rejected'
    );
    if (exactMatch) {
      return {
        isDuplicateRisk: true,
        reason: `Exact match found with active Invoice #${exactMatch.invoiceNumber}`
      };
    }

    // 2. Similar amount & vendor match within 7 days
    const closeAmountMatch = existingInvoices.find(
      i => i.vendorId === vendorId && Math.abs(i.totalAmount - amount) < 1.00 && i.status !== 'Rejected'
    );
    if (closeAmountMatch) {
      return {
        isDuplicateRisk: true,
        reason: `Similar amount ($${amount.toLocaleString()}) & vendor combination match active Invoice #${closeAmountMatch.invoiceNumber}`
      };
    }

    return { isDuplicateRisk: false, reason: null };
  },

  submitInvoice: async (invoiceData, vendorName = 'Vendor') => {
    await delay(500);
    const invoices = getStorageData(INVOICES_KEY, INITIAL_INVOICES);
    
    // Check duplicates
    const dupCheck = invoiceApi.checkDuplicate(
      invoiceData.invoiceNumber,
      invoiceData.totalAmount,
      invoiceData.vendorId,
      invoices
    );

    const today = new Date().toISOString().split('T')[0];
    const newInvoice = {
      id: `inv_${Date.now()}`,
      status: 'Submitted',
      isDuplicateRisk: dupCheck.isDuplicateRisk,
      duplicateWarningReason: dupCheck.reason,
      paidAmount: 0.00,
      remainingBalance: invoiceData.totalAmount,
      submittedAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      verifiedAt: null,
      verifiedBy: null,
      rejectionReason: null,
      ...invoiceData
    };

    const updatedInvoices = [newInvoice, ...invoices];
    setStorageData(INVOICES_KEY, updatedInvoices);

    // Also update PO status to "Invoice Submitted"
    if (newInvoice.poId) {
      const orders = getStorageData('procure_orders_db', []);
      const updatedOrders = orders.map(po => {
        if (po.id === newInvoice.poId) {
          const history = po.history || [];
          const nowFormatted = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return {
            ...po,
            status: 'Invoice Submitted',
            invoiceSubmittedDate: today,
            history: [...history, { status: 'Invoice Submitted', timestamp: nowFormatted, actor: `${vendorName} (Vendor)` }]
          };
        }
        return po;
      });
      setStorageData('procure_orders_db', updatedOrders);
    }

    return newInvoice;
  },

  verifyInvoice: async (id, managerName = 'Marcus Brody') => {
    await delay(450);
    const invoices = getStorageData(INVOICES_KEY, INITIAL_INVOICES);
    const today = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let targetPoId = null;

    const updatedInvoices = invoices.map(inv => {
      if (inv.id === id) {
        targetPoId = inv.poId;
        return {
          ...inv,
          status: 'Verified',
          isDuplicateRisk: false, // cleared on verification
          verifiedAt: today,
          verifiedBy: managerName
        };
      }
      return inv;
    });

    setStorageData(INVOICES_KEY, updatedInvoices);

    // Update PO status to "Invoice Verified"
    if (targetPoId) {
      const orders = getStorageData('procure_orders_db', []);
      const dateOnly = new Date().toISOString().split('T')[0];
      const updatedOrders = orders.map(po => {
        if (po.id === targetPoId) {
          const history = po.history || [];
          return {
            ...po,
            status: 'Invoice Verified',
            invoiceVerifiedDate: dateOnly,
            history: [...history, { status: 'Invoice Verified', timestamp: today, actor: `${managerName} (Manager)` }]
          };
        }
        return po;
      });
      setStorageData('procure_orders_db', updatedOrders);
    }

    return updatedInvoices.find(i => i.id === id);
  },

  rejectInvoice: async (id, reason, managerName = 'Marcus Brody') => {
    await delay(450);
    const invoices = getStorageData(INVOICES_KEY, INITIAL_INVOICES);

    const updatedInvoices = invoices.map(inv => {
      if (inv.id === id) {
        return {
          ...inv,
          status: 'Rejected',
          rejectionReason: reason
        };
      }
      return inv;
    });

    setStorageData(INVOICES_KEY, updatedInvoices);
    return updatedInvoices.find(i => i.id === id);
  }
};
