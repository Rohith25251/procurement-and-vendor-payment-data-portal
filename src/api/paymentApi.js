import { supabase } from '../supabaseClient';
import { orderApi } from './orderApi';
import { invoiceApi } from './invoiceApi';
import { notificationApi } from './notificationApi';

const mapDBToPayment = (p) => {
  if (!p) return null;
  return {
    id: p.id,
    invoiceId: p.invoice_id,
    invoiceNumber: p.invoice_number,
    poId: p.po_id,
    poNumber: p.po_number,
    vendorId: p.vendor_id,
    vendorName: p.vendor_name,
    amountPaid: Number(p.amount_paid) || 0,
    runningBalance: Number(p.running_balance) || 0,
    paymentMethod: p.payment_method,
    referenceNumber: p.reference_number,
    paymentDate: p.payment_date,
    status: p.status,
    notes: p.notes,
    vendorApproved: p.is_external || false,
    vendorApprovedAt: p.is_external ? p.payment_date : null
  };
};

export const paymentApi = {
  getPayments: async () => {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('payment_date', { ascending: false });
    if (error) throw error;
    return data.map(mapDBToPayment);
  },

  processPayment: async (paymentData, managerName = 'Eleanor Vance') => {
    const invoice = await invoiceApi.getInvoiceById(paymentData.invoiceId);
    if (!invoice) throw new Error('Associated invoice not found');

    const amountToPay = Number(paymentData.amountPaid);
    const currentPaid = Number(invoice.paidAmount || 0);
    const newPaidAmount = currentPaid + amountToPay;
    const invoiceTotal = Number(invoice.totalAmount);
    const newRemainingBalance = Math.max(0, invoiceTotal - newPaidAmount);

    const isFullyPaid = newRemainingBalance <= 0.01;
    const paymentStatus = isFullyPaid ? 'Paid' : 'Partially Paid';
    const today = new Date().toISOString().split('T')[0];

    const dbPayment = {
      id: `pmt_${Date.now()}`,
      invoice_id: invoice.id,
      invoice_number: invoice.invoiceNumber,
      po_id: invoice.poId,
      po_number: invoice.poNumber,
      vendor_id: invoice.vendorId,
      vendor_name: invoice.vendorName,
      amount_paid: amountToPay,
      running_balance: newRemainingBalance,
      payment_method: paymentData.paymentMethod,
      reference_number: paymentData.referenceNumber,
      payment_date: today,
      status: paymentStatus,
      is_external: false,
      notes: paymentData.notes || 'Payment processed by manager'
    };

    const { data: pmtData, error: pmtError } = await supabase
      .from('payments')
      .insert(dbPayment)
      .select('*');

    if (pmtError) throw pmtError;

    // Update Invoice status and balance
    const { error: invError } = await supabase
      .from('invoices')
      .update({
        paid_amount: newPaidAmount,
        remaining_balance: newRemainingBalance,
        status: isFullyPaid ? 'Paid' : 'Partially Paid'
      })
      .eq('id', invoice.id);

    if (invError) throw invError;

    // If fully paid, update PO history with "Paid" but preserve delivery status if not yet delivered
    if (isFullyPaid && invoice.poId) {
      try {
        const po = await orderApi.getOrderById(invoice.poId);
        const history = po.history || [];
        const timestamp = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Avoid duplicate Paid entries in history
        const hasPaidHistory = history.some(h => h.status === 'Paid');
        const updatedHistory = hasPaidHistory ? history : [...history, { status: 'Paid', timestamp, actor: `${managerName} (Manager)` }];

        // Only transition PO status to 'Paid' if it was already Delivered
        const newPoStatus = po.status === 'Delivered' ? 'Paid' : po.status;

        await supabase
          .from('purchase_orders')
          .update({
            status: newPoStatus,
            history: updatedHistory
          })
          .eq('id', invoice.poId);
      } catch (e) {
        console.error("Failed to update PO status to Paid", e);
      }
    }

    // Trigger Live Notification for Vendor
    try {
      await notificationApi.createNotification({
        recipientRole: 'vendor',
        vendorId: invoice.vendorId,
        title: isFullyPaid ? 'Payment Received (Full)' : 'Payment Received (Partial)',
        message: `Payment of ₹${amountToPay.toLocaleString('en-IN')} has been processed for Invoice ${invoice.invoiceNumber}.`,
        type: 'payment_status',
        link: '/vendor/payments'
      });
    } catch (notifErr) {
      console.warn('Failed to send vendor payment notification', notifErr);
    }

    return mapDBToPayment(pmtData[0]);
  },

  approvePaymentVendor: async (paymentId, vendorName = 'Vendor') => {
    const { data, error } = await supabase
      .from('payments')
      .update({
        is_external: true
      })
      .eq('id', paymentId)
      .select('*');

    if (error) throw error;
    return mapDBToPayment(data[0]);
  }
};
