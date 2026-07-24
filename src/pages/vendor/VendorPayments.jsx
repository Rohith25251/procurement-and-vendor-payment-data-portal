import React, { useState, useEffect } from 'react';
import { paymentApi } from '../../api/paymentApi';
import { invoiceApi } from '../../api/invoiceApi';
import { useAuth } from '../../context/AuthContext';
import { SearchFilterBar } from '../../components/common/SearchFilterBar';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { 
  Wallet, DollarSign, Clock, CheckCircle2, ShieldCheck, ArrowUpRight 
} from 'lucide-react';

export const VendorPayments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { showToast } = useToast();

  const loadVendorPayments = async () => {
    setLoading(true);
    try {
      const [allPayments, allInvoices] = await Promise.all([
        paymentApi.getPayments(),
        invoiceApi.getInvoices()
      ]);

      const myPayments = allPayments.filter(
        p => p.vendorId === user?.vendorId || p.vendorName.includes(user?.name) || p.vendorId === 'vnd_apex_01'
      );

      const myInvoices = allInvoices.filter(
        i => i.vendorId === user?.vendorId || i.vendorName.includes(user?.name) || i.vendorId === 'vnd_apex_01'
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
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">${totalInvoiced.toLocaleString()}</h3>
          <p className="text-[11px] text-slate-500 mt-1">{invoices.length} Submitted claims</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft">
          <span className="text-xs font-semibold uppercase text-slate-400">Total Funds Received</span>
          <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">${totalReceived.toLocaleString()}</h3>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">✓ Cleared into bank account</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft">
          <span className="text-xs font-semibold uppercase text-slate-400">Pending Outstandings</span>
          <h3 className="text-2xl font-extrabold text-amber-600 mt-1">${pendingBalance.toLocaleString()}</h3>
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
                  <th className="py-3.5 px-6 text-right">Vendor Sign-Off</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredPayments.map((pmt) => (
                  <tr key={pmt.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">{pmt.referenceNumber || 'Pending'}</td>
                    <td className="py-4 px-6 font-semibold">{pmt.invoiceNumber}</td>
                    <td className="py-4 px-6">{pmt.paymentMethod || 'ACH'}</td>
                    <td className="py-4 px-6 font-bold text-emerald-600">${pmt.amountPaid.toLocaleString()}</td>
                    <td className="py-4 px-6">
                      <StatusBadge status={pmt.status} />
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
    </div>
  );
};
