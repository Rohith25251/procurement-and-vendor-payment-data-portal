import React, { useState, useEffect } from 'react';
import { paymentApi } from '../../api/paymentApi';
import { invoiceApi } from '../../api/invoiceApi';
import { useAuth } from '../../context/AuthContext';
import { SearchFilterBar } from '../../components/common/SearchFilterBar';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/common/Modal';
import { 
  Wallet, DollarSign, Clock, CheckCircle2, ShieldCheck, ArrowUpRight, CheckCircle 
} from 'lucide-react';

export const VendorPayments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { showToast } = useToast();
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const loadVendorPayments = async () => {
    setLoading(true);
    try {
      const [allPayments, allInvoices] = await Promise.all([
        paymentApi.getPayments(),
        invoiceApi.getInvoices()
      ]);

      const myPayments = allPayments.filter(
        p => p.vendorId === user?.vendorId || p.vendorName.includes(user?.name)
      );

      const myInvoices = allInvoices.filter(
        i => i.vendorId === user?.vendorId || i.vendorName.includes(user?.name)
      );

      setPayments(myPayments);
      setInvoices(myInvoices);
    } catch (err) {
      showToast('Failed to load payment ledger', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendorPayments();
  }, [user]);

  const handleVendorAcknowledge = async (paymentId) => {
    try {
      await paymentApi.approvePaymentVendor(paymentId, user?.name);
      showToast('Payment receipt successfully acknowledged & finalized!', 'success');
      loadVendorPayments();
    } catch (err) {
      showToast('Failed to acknowledge payment', 'error');
    }
  };

  const totalInvoiced = invoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0);
  const totalReceived = payments.reduce((acc, p) => acc + (p.amountPaid || 0), 0);
  const pendingBalance = Math.max(0, totalInvoiced - totalReceived);

  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.referenceNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Wallet className="w-7 h-7 text-emerald-600" />
          Earnings & Payment Receipts
        </h1>
        <p className="text-xs text-slate-500 mt-1">Review disbursed payouts, acknowledge receipts, and monitor outstanding balance ledger</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft">
          <span className="text-xs font-semibold uppercase text-slate-400">Total Invoiced Amount</span>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">₹{totalInvoiced.toLocaleString('en-IN')}</h3>
          <p className="text-[11px] text-slate-500 mt-1">{invoices.length} Submitted claims</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft">
          <span className="text-xs font-semibold uppercase text-slate-400">Total Funds Received</span>
          <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">₹{totalReceived.toLocaleString('en-IN')}</h3>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">✓ Cleared into bank account</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft">
          <span className="text-xs font-semibold uppercase text-slate-400">Pending Outstandings</span>
          <h3 className="text-2xl font-extrabold text-amber-600 mt-1">₹{pendingBalance.toLocaleString('en-IN')}</h3>
          <p className="text-[11px] text-slate-500 mt-1">Awaiting manager clearance</p>
        </div>
      </div>

      {/* Search & Filter */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search reference #, invoice #..."
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={['Paid', 'Partially Paid', 'Pending']}
      />

      {/* Payments Table */}
      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200/60">
                  <th className="py-3.5 px-6">Reference / UTR #</th>
                  <th className="py-3.5 px-6">Invoice #</th>
                  <th className="py-3.5 px-6">Payment Method</th>
                  <th className="py-3.5 px-6">Amount Received</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Receipt</th>
                  <th className="py-3.5 px-6 text-right">Vendor Sign-Off</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredPayments.map((pmt) => (
                  <tr key={pmt.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">{pmt.referenceNumber || 'Pending'}</td>
                    <td className="py-4 px-6 font-semibold">{pmt.invoiceNumber}</td>
                    <td className="py-4 px-6">{pmt.paymentMethod || 'ACH'}</td>
                    <td className="py-4 px-6 font-bold text-emerald-600">₹{pmt.amountPaid.toLocaleString('en-IN')}</td>
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
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <ShieldCheck className="w-3.5 h-3.5" /> Acknowledged
                        </span>
                      ) : (
                        <button
                          onClick={() => handleVendorAcknowledge(pmt.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs ml-auto"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve Payment</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
