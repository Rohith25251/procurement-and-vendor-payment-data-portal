import React, { useState, useEffect } from 'react';
import { StatCard } from '../../components/common/StatCard';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { StatusBadge } from '../../components/common/StatusBadge';
import { orderApi } from '../../api/orderApi';
import { vendorApi } from '../../api/vendorApi';
import { invoiceApi } from '../../api/invoiceApi';
import { paymentApi } from '../../api/paymentApi';
import { reportApi } from '../../api/reportApi';
import { 
  DollarSign, Clock, Users, AlertCircle, TrendingUp, ArrowRight, Activity, ShoppingCart 
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { useNavigate } from 'react-router-dom';

export const ManagerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingApprovals: 0,
    overduePayments: 0,
    activeVendors: 0,
    monthlySpend: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [chartData, setChartData] = useState({ trend: [], category: [] });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [orders, vendors, invoices, payments, report] = await Promise.all([
          orderApi.getOrders(),
          vendorApi.getVendors(),
          invoiceApi.getInvoices(),
          paymentApi.getPayments(),
          reportApi.getReportData()
        ]);

        const pendingApprovalsCount = orders.filter(o => o.status === 'Requested').length + 
                                      invoices.filter(i => i.status === 'Submitted').length +
                                      vendors.filter(v => v.status === 'Pending').length;

        const overdueCount = payments.filter(p => p.status === 'Overdue').length;
        const activeVendorsCount = vendors.filter(v => v.status === 'Approved').length;

        const currentMonthSpend = invoices
          .filter(i => i.status === 'Verified' || i.status === 'Paid' || i.status === 'Partially Paid')
          .reduce((acc, i) => acc + (i.paidAmount || 0), 20350);

        setStats({
          pendingApprovals: pendingApprovalsCount,
          overduePayments: overdueCount,
          activeVendors: activeVendorsCount,
          monthlySpend: currentMonthSpend
        });

        setRecentOrders(orders.slice(0, 5));
        setChartData({
          trend: report.monthlySpendTrend,
          category: report.categorySpend
        });
      } catch (err) {
        console.error("Dashboard error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const CATEGORY_COLORS = ['#0369A3', '#18A303', '#8B5CF6', '#F59E0B'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/4 animate-pulse"></div>
        <TableSkeleton rows={4} cols={4} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 p-6 sm:p-8 rounded-3xl text-white shadow-xl">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-primary-400">Manager Control Center</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">Procurement Executive Dashboard</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Real-time oversight across vendor onboarding, purchase orders, invoice queues & cash outflow.
          </p>
        </div>
        <button
          onClick={() => navigate('/manager/procurement')}
          className="self-start sm:self-auto px-5 py-3 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-primary-600/30 transition-smooth flex items-center gap-2 shrink-0"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>New Purchase Order</span>
        </button>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          subtext="POs, Invoices & Onboarding"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="This Month's Spend"
          value={`$${stats.monthlySpend.toLocaleString()}`}
          subtext="+12.4% vs last month"
          icon={DollarSign}
          trend="up"
          trendValue="12.4%"
          color="blue"
        />
        <StatCard
          title="Active Approved Vendors"
          value={stats.activeVendors}
          subtext="Compliant active partners"
          icon={Users}
          color="green"
        />
        <StatCard
          title="Overdue Payments"
          value={stats.overduePayments}
          subtext="Requires immediate clearance"
          icon={AlertCircle}
          color="rose"
        />
      </div>

      {/* Recharts Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spend Trend Line Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Monthly Procurement Spend Trend</h3>
              <p className="text-xs text-slate-500">Historical spend vs budget target</p>
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold text-primary-600 bg-primary-50 px-3 py-1 rounded-full border border-primary-100">
              <TrendingUp className="w-3.5 h-3.5" /> 2026 YTD
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(val) => `$${val / 1000}k`} />
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Total Spend']}
                  contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '12px', border: 'none' }}
                />
                <Line type="monotone" dataKey="spend" stroke="#0369A3" strokeWidth={3} dot={{ r: 5, fill: '#0369A3' }} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="target" stroke="#94A3B8" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spend by Category Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-soft">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">Spend by Category</h3>
            <p className="text-xs text-slate-500">Budget allocation percentage</p>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.category}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="amount"
                >
                  {chartData.category.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => `$${value.toLocaleString()}`}
                  contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '12px' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Table Feed */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-600" />
            <h3 className="text-base font-bold text-slate-900">Recent Purchase Orders Activity</h3>
          </div>
          <button
            onClick={() => navigate('/manager/procurement')}
            className="text-xs font-semibold text-primary-600 hover:text-primary-800 flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200/60">
                <th className="py-3.5 px-6">PO Number</th>
                <th className="py-3.5 px-6">Vendor</th>
                <th className="py-3.5 px-6">Category</th>
                <th className="py-3.5 px-6">Amount</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {recentOrders.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-900">{po.poNumber}</td>
                  <td className="py-4 px-6 font-semibold">{po.vendorName}</td>
                  <td className="py-4 px-6 text-slate-500">{po.category}</td>
                  <td className="py-4 px-6 font-bold text-slate-900">${po.totalAmount.toLocaleString()}</td>
                  <td className="py-4 px-6">
                    <StatusBadge status={po.status} />
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => navigate(`/manager/procurement/${po.id}`)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Track Order
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
