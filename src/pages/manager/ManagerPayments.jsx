import React, { useState, useEffect } from 'react';
import { paymentApi } from '../../api/paymentApi';
import { invoiceApi } from '../../api/invoiceApi';
import { SearchFilterBar } from '../../components/common/SearchFilterBar';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { 
  CreditCard, IndianRupee, Wallet, CheckCircle, Clock, ShieldCheck, ArrowRight 
} from 'lucide-react';

export const ManagerPayments = () => {
  const [invoicesReady, setInvoicesReady] = useState([]);
  const [paymentsList, setPaymentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Payment Processing Modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amountToPay: 0,
    paymentMethod: 'ACH Direct Deposit',
    referenceNumber: '',
    notes: ''
  });

  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [allInvoices, payments] = await Promise.all([
        invoiceApi.getInvoices(),
        paymentApi.getPayments()
      ]);

      // Submitted or partially paid invoices ready for payment
      const ready = allInvoices.filter(i => i.status === 'Submitted' || i.status === 'Partially Paid');
      setInvoicesReady(ready);
      setPaymentsList(payments);
    } catch (err) {
      showToast('Failed to load payment data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openProcessModal = (invoice) => {
    setSelectedInvoice(invoice);
    const defaultAmount = invoice.remainingBalance > 0 ? invoice.remainingBalance : invoice.totalAmount;
    setPaymentForm({
      amountToPay: defaultAmount,
      paymentMethod: 'ACH Direct Deposit',
      referenceNumber: `REF-TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      notes: ''
    });
    setIsProcessModalOpen(true);
  };

  const handleProcessSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    if (Number(paymentForm.amountToPay) <= 0) {
      showToast('Please enter a valid payment amount', 'warning');
      return;
    }

    try {
      await paymentApi.processPayment({
        invoiceId: selectedInvoice.id,
        amountPaid: Number(paymentForm.amountToPay),
        paymentMethod: paymentForm.paymentMethod,
        referenceNumber: paymentForm.referenceNumber,
        notes: paymentForm.notes
      });

      showToast(`Payment of ₹${Number(paymentForm.amountToPay).toLocaleString('en-IN')} processed successfully!`, 'success');
      setIsProcessModalOpen(false);
      setSelectedInvoice(null);
      loadData();
    } catch (err) {
      showToast('Payment processing failed', 'error');
    }
  };

  const filteredPayments = paymentsList.filter(p => {
    const matchesSearch = p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.referenceNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <CreditCard className="w-7 h-7 text-primary-600" />
          Disbursement & Payment Processing
        </h1>
        <p className="text-xs text-slate-500 mt-1">Disburse payments for verified invoices, track partial installments & balance ledgers</p>
      </div>

      {/* Verified Queue Ready for Payment */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-soft">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-emerald-600" />
          Verified Invoices Awaiting Disbursement ({invoicesReady.length})
        </h3>

        {invoicesReady.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 border border-dashed rounded-xl">
            No verified invoices currently pending disbursement.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {invoicesReady.map((inv) => (
              <div key={inv.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{inv.invoiceNumber}</span>
                    <StatusBadge status={inv.status} size="sm" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700 mt-1">{inv.vendorName}</p>
                  <p className="text-[11px] text-slate-500">PO Ref: {inv.poNumber}</p>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Remaining Balance:</span>
                    <span className="font-extrabold text-slate-900">₹{inv.remainingBalance.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">Total Amount:</span>
                    <span className="font-bold text-slate-500">₹{inv.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <button
                  onClick={() => openProcessModal(inv)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-smooth flex items-center justify-center gap-1.5"
                >
                  <IndianRupee className="w-4 h-4" />
                  <span>Process Payment</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Transaction History Table */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900">Disbursement & Transaction History Ledger</h3>

        <SearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Search transaction by ref #, invoice #, vendor..."
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          statusOptions={['Paid', 'Partially Paid', 'Pending', 'Overdue']}
        />

        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200/60">
                    <th className="py-3.5 px-6">Transaction Ref #</th>
                    <th className="py-3.5 px-6">Invoice & Vendor</th>
                    <th className="py-3.5 px-6">Payment Method</th>
                    <th className="py-3.5 px-6">Disbursed Amount</th>
                    <th className="py-3.5 px-6">Running Balance</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Receipt</th>
                    <th className="py-3.5 px-6 text-right">Vendor Ack?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {filteredPayments.map((pmt) => (
                    <tr key={pmt.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-slate-900">
                        {pmt.referenceNumber || 'N/A'}
                        <span className="text-[10px] text-slate-400 block font-sans">{pmt.paymentDate || 'Pending'}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900">{pmt.invoiceNumber}</div>
                        <div className="text-slate-500">{pmt.vendorName}</div>
                      </td>
                      <td className="py-4 px-6 font-semibold">{pmt.paymentMethod || 'Wire / ACH'}</td>
                      <td className="py-4 px-6 font-bold text-emerald-600">₹{pmt.amountPaid.toLocaleString('en-IN')}</td>
                      <td className="py-4 px-6 font-bold text-slate-800">₹{pmt.runningBalance.toLocaleString('en-IN')}</td>
                      <td className="py-4 px-6">
                        <StatusBadge status={pmt.status} />
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => { setSelectedReceipt(pmt); setIsReceiptModalOpen(true); }}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 rounded-lg text-[10px]"
                        >
                          View Receipt
                        </button>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {pmt.vendorApproved ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                            ✓ Approved
                          </span>
                        ) : (
                          <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[10px]">
                            Pending Ack
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Payment Processing Modal */}
      <Modal isOpen={isProcessModalOpen} onClose={() => setIsProcessModalOpen(false)} title={`Disburse Payment for ${selectedInvoice?.invoiceNumber}`}>
        {selectedInvoice && (
          <form onSubmit={handleProcessSubmit} className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Vendor:</span>
                <span className="font-bold text-slate-900">{selectedInvoice.vendorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Total Invoice Claim:</span>
                <span className="font-bold text-slate-900">₹{selectedInvoice.totalAmount.toLocaleString('en-IN')} INR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Remaining Unpaid Balance:</span>
                <span className="font-bold text-rose-600">₹{selectedInvoice.remainingBalance.toLocaleString('en-IN')} INR</span>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex justify-between items-center">
              <div>
                <span className="text-slate-500 font-semibold block text-[10px] uppercase">Amount to Disburse:</span>
                <span className="text-xs text-slate-400">Single full payment disbursement</span>
              </div>
              <span className="font-extrabold text-emerald-700 text-base">₹{selectedInvoice.remainingBalance.toLocaleString('en-IN')} INR</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Method *</label>
              <select
                value={paymentForm.paymentMethod}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl font-medium"
              >
                <option value="ACH Direct Deposit">ACH Direct Deposit</option>
                <option value="Wire Transfer">Wire Transfer</option>
                <option value="Corporate Credit Card">Corporate Credit Card</option>
                <option value="Cheque / Draft">Cheque / Bank Draft</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reference / UTR / Transaction Hash # *</label>
              <input
                type="text"
                required
                value={paymentForm.referenceNumber}
                onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setIsProcessModalOpen(false)} className="px-4 py-2 font-semibold">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-md">
                Disburse Payment Now
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Receipt Modal */}
      <Modal isOpen={isReceiptModalOpen} onClose={() => { setIsReceiptModalOpen(false); setSelectedReceipt(null); }} title="Official Payment Receipt">
        {selectedReceipt && (
          <div className="space-y-4 text-xs p-1">
            <div className="text-center pb-4 border-b border-slate-200">
              <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-600 mb-2">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Payment Cleared Successfully</h3>
              <p className="text-xs text-slate-400 mt-0.5">UTR / Ref: {selectedReceipt.referenceNumber || 'N/A'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Payer / Disbursed By:</span>
                <span className="font-bold text-slate-800">ProcureHub Management</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Payee / Vendor:</span>
                <span className="font-bold text-slate-800">{selectedReceipt.vendorName}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Disbursed Amount:</span>
                <span className="font-extrabold text-emerald-600 text-sm">₹{selectedReceipt.amountPaid?.toLocaleString('en-IN')} INR</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Transaction Date:</span>
                <span className="font-bold text-slate-800">{selectedReceipt.paymentDate}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Ref Invoice #:</span>
                <span className="font-bold text-slate-800">{selectedReceipt.invoiceNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Payment Method:</span>
                <span className="font-bold text-slate-800">{selectedReceipt.paymentMethod}</span>
              </div>
            </div>

            <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice Total Value:</span>
                <span className="font-bold">₹{selectedReceipt.invoiceTotal?.toLocaleString('en-IN')} INR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-bold text-emerald-600">₹{selectedReceipt.amountPaid?.toLocaleString('en-IN')} INR</span>
              </div>
              <div className="flex justify-between pt-1 border-t">
                <span className="text-slate-500 font-semibold">Remaining Ledger Balance:</span>
                <span className="font-bold">₹{selectedReceipt.runningBalance?.toLocaleString('en-IN')} INR</span>
              </div>
            </div>

            <p className="text-center text-[10px] text-slate-400 italic">
              This receipt is automatically generated and digitally authenticated.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};
