import React, { useState, useEffect } from 'react';
import { StatCard } from '../../components/common/StatCard';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { orderApi } from '../../api/orderApi';
import { invoiceApi } from '../../api/invoiceApi';
import { paymentApi } from '../../api/paymentApi';
import { 
  PackageCheck, FileText, IndianRupee, Clock, ArrowRight, ShoppingCart 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const VendorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeOrders: 0,
    pendingInvoices: 0,
    totalEarned: 0,
    pendingPayment: 0
  });
  const [vendorOrders, setVendorOrders] = useState([]);

  useEffect(() => {
    const fetchVendorDashboard = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const [orders, invoices, payments] = await Promise.all([
          orderApi.getOrders(),
          invoiceApi.getInvoices(),
          paymentApi.getPayments()
        ]);

        const myOrders = orders.filter(o => o.vendorId === user.vendorId || o.vendorName.includes(user.name));
        const myInvoices = invoices.filter(i => i.vendorId === user.vendorId || i.vendorName.includes(user.name));
        const myPayments = payments.filter(p => p.vendorId === user.vendorId || p.vendorName.includes(user.name));

        const activeCount = myOrders.filter(o => o.status === 'Sent to Vendor' || o.status === 'Accepted' || o.status === 'Delivered').length;
        const pendingInvCount = myInvoices.filter(i => i.status === 'Submitted').length;

        const earned = myPayments
          .filter(p => p.status === 'Paid' || p.status === 'Partially Paid')
          .reduce((acc, p) => acc + (p.amountPaid || 0), 0);

        const pendingPay = myInvoices
          .filter(i => i.status === 'Verified' || i.status === 'Partially Paid')
          .reduce((acc, i) => acc + (i.remainingBalance || 0), 0);

        setStats({
          activeOrders: activeCount,
          pendingInvoices: pendingInvCount,
          totalEarned: earned,
          pendingPayment: pendingPay
        });

        setVendorOrders(myOrders.slice(0, 5));
      } catch (err) {
        console.error("Vendor dashboard error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorDashboard();
  }, [user]);

  if (loading) return <TableSkeleton rows={4} cols={4} />;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-400">Vendor Partner Portal</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">Welcome, {user?.name}</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Manage incoming purchase orders, submit invoices, and track your cash flows in real time.
          </p>
        </div>
        <button
          onClick={() => navigate('/vendor/orders')}
          className="self-start sm:self-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition-smooth flex items-center gap-2 shrink-0"
        >
          <PackageCheck className="w-4 h-4" />
          <span>View Incoming Orders</span>
        </button>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Active Orders"
          value={stats.activeOrders}
          subtext="Orders awaiting delivery / action"
          icon={PackageCheck}
          color="blue"
        />
        <StatCard
          title="Pending Invoices"
          value={stats.pendingInvoices}
          subtext="Under manager verification"
          icon={FileText}
          color="amber"
        />
        <StatCard
          title="Total Received"
          value={`₹${stats.totalEarned.toLocaleString('en-IN')}`}
          subtext="Cleared payments to date"
          icon={IndianRupee}
          color="green"
        />
        <StatCard
          title="Pending Payment Amount"
          value={`₹${stats.pendingPayment.toLocaleString('en-IN')}`}
          subtext="Verified claims in payout queue"
          icon={Clock}
          color="purple"
        />
      </div>

      {/* Recent Orders List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">Your Incoming Orders Feed</h3>
          </div>
          <button
            onClick={() => navigate('/vendor/orders')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200/60">
                <th className="py-3.5 px-6">PO Number</th>
                <th className="py-3.5 px-6">Created Date</th>
                <th className="py-3.5 px-6">Exp. Delivery</th>
                <th className="py-3.5 px-6">Order Total</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {vendorOrders.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-900">{po.poNumber}</td>
                  <td className="py-4 px-6 text-slate-500">{po.createdDate}</td>
                  <td className="py-4 px-6 font-semibold">{po.expectedDeliveryDate}</td>
                  <td className="py-4 px-6 font-bold text-slate-900">₹{po.totalAmount.toLocaleString('en-IN')}</td>
                  <td className="py-4 px-6">
                    <StatusBadge status={po.status} />
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => navigate('/vendor/orders')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                    >
                      View Actions
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
