import { delay, getStorageData, setStorageData } from './apiUtils';
import { INITIAL_PAYMENTS } from '../mock/payments';

const PAYMENTS_KEY = 'procure_payments_db';

export const paymentApi = {
  getPayments: async () => {
    await delay(400);
    return getStorageData(PAYMENTS_KEY, INITIAL_PAYMENTS);
  },

  processPayment: async (paymentData, managerName = 'Marcus Brody') => {
    await delay(500);
    const payments = getStorageData(PAYMENTS_KEY, INITIAL_PAYMENTS);
    const invoices = getStorageData('procure_invoices_db', []);
    const orders = getStorageData('procure_orders_db', []);

    const invoice = invoices.find(i => i.id === paymentData.invoiceId);
    if (!invoice) throw new Error('Associated invoice not found');

    const amountToPay = Number(paymentData.amountPaid);
    const currentPaid = Number(invoice.paidAmount || 0);
    const newPaidAmount = currentPaid + amountToPay;
    const invoiceTotal = Number(invoice.totalAmount);
    const newRemainingBalance = Math.max(0, invoiceTotal - newPaidAmount);

    const isFullyPaid = newRemainingBalance <= 0.01;
    const paymentStatus = isFullyPaid ? 'Paid' : 'Partially Paid';
    const today = new Date().toISOString().split('T')[0];

    // Create payment record
    const newPaymentRecord = {
      id: `pmt_${Date.now()}`,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      poId: invoice.poId,
      poNumber: invoice.poNumber,
      vendorId: invoice.vendorId,
      vendorName: invoice.vendorName,
      amountPaid: amountToPay,
      invoiceTotal: invoiceTotal,
      runningBalance: newRemainingBalance,
      paymentMethod: paymentData.paymentMethod,
      referenceNumber: paymentData.referenceNumber,
      paymentDate: today,
      status: paymentStatus,
      installmentType: isFullyPaid ? 'Full Clearance' : `Installment Payment ($${amountToPay.toLocaleString()})`,
      notes: paymentData.notes || 'Payment processed by manager',
      vendorApproved: false,
      vendorApprovedAt: null
    };

    const updatedPayments = [newPaymentRecord, ...payments];
    setStorageData(PAYMENTS_KEY, updatedPayments);

    // Update Invoice status and balance
    const updatedInvoices = invoices.map(inv => {
      if (inv.id === invoice.id) {
        return {
          ...inv,
          paidAmount: newPaidAmount,
          remainingBalance: newRemainingBalance,
          status: isFullyPaid ? 'Paid' : 'Partially Paid'
        };
      }
      return inv;
    });
    setStorageData('procure_invoices_db', updatedInvoices);

    // If fully paid, update PO status to "Paid"
    if (isFullyPaid && invoice.poId) {
      const timestamp = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const updatedOrders = orders.map(po => {
        if (po.id === invoice.poId) {
          const history = po.history || [];
          return {
            ...po,
            status: 'Paid',
            paidDate: today,
            history: [...history, { status: 'Paid', timestamp, actor: `${managerName} (Manager)` }]
          };
        }
        return po;
      });
      setStorageData('procure_orders_db', updatedOrders);
    }

    return newPaymentRecord;
  },

  approvePaymentVendor: async (paymentId, vendorName = 'Vendor') => {
    await delay(400);
    const payments = getStorageData(PAYMENTS_KEY, INITIAL_PAYMENTS);
    const today = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updated = payments.map(pmt => {
      if (pmt.id === paymentId) {
        return {
          ...pmt,
          vendorApproved: true,
          vendorApprovedAt: today
        };
      }
      return pmt;
    });

    setStorageData(PAYMENTS_KEY, updated);
    return updated.find(p => p.id === paymentId);
  }
};
