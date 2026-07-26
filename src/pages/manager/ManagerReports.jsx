import React, { useState, useEffect } from 'react';
import { reportApi } from '../../api/reportApi';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { useToast } from '../../context/ToastContext';
import { 
  BarChart3, Download, TrendingUp, Award, Building2, PieChart as PieIcon, FileSpreadsheet, CheckCircle2 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend 
} from 'recharts';

export const ManagerReports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const data = await reportApi.getReportData();
        setReportData(data);
      } catch (err) {
        showToast('Failed to load analytical report', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const res = await reportApi.exportReport(format);
      showToast(res.message, 'success');
    } catch (err) {
      showToast('Export failed', 'error');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <TableSkeleton rows={6} cols={4} />;
  if (!reportData) return <div className="p-8 text-center text-slate-500">Report data unavailable</div>;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-soft">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-primary-600" />
            Executive Procurement Reports & Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">Deep analysis on vendor spend, category allocation, and on-time compliance rates</p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            disabled={exporting}
            onClick={() => handleExport('pdf')}
            className="px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-primary-600/20 transition-smooth flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export PDF Report</span>
          </button>

          <button
            disabled={exporting}
            onClick={() => handleExport('xlsx')}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-lg transition-smooth flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft">
          <p className="text-xs font-semibold uppercase text-slate-400">Total Year-To-Date Spend</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">₹{reportData.summary.totalSpend.toLocaleString('en-IN')}</h3>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">✓ Across {reportData.summary.totalPOProcessed} POs</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft">
          <p className="text-xs font-semibold uppercase text-slate-400">Avg On-Time Delivery Rate</p>
          <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{reportData.summary.avgOnTimeDelivery}</h3>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Target benchmark &gt;90%</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft">
          <p className="text-xs font-semibold uppercase text-slate-400">Active Vendor Partners</p>
          <h3 className="text-2xl font-extrabold text-primary-600 mt-1">{reportData.summary.activeVendorsCount}</h3>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Approved & active</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft">
          <p className="text-xs font-semibold uppercase text-slate-400">Categories Monitored</p>
          <h3 className="text-2xl font-extrabold text-purple-600 mt-1">4 Sectors</h3>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Hardware, IT, Logistics, Facilities</p>
        </div>
      </div>

      {/* Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-soft">
          <h3 className="text-base font-bold text-slate-900 mb-4">Category-Wise Spend Distribution</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.categorySpend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip 
                  formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Total Spend']}
                  contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '12px' }}
                />
                <Bar dataKey="amount" fill="#0369A3" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trend Line Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-soft">
          <h3 className="text-base font-bold text-slate-900 mb-4">Monthly Spend vs Target Trajectory</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reportData.monthlySpendTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip 
                  formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Monthly Spend']}
                  contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '12px' }}
                />
                <Line type="monotone" dataKey="spend" stroke="#18A303" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Vendor Performance Score Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Vendor Compliance & Performance Matrix</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200/60">
                <th className="py-3.5 px-6">Vendor Name</th>
                <th className="py-3.5 px-6">Category</th>
                <th className="py-3.5 px-6">Total Spend</th>
                <th className="py-3.5 px-6">On-Time Delivery %</th>
                <th className="py-3.5 px-6">Overall Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {reportData.vendorSpendList.map((v, i) => (
                <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-900">{v.vendorName}</td>
                  <td className="py-4 px-6 text-slate-500">{v.category}</td>
                  <td className="py-4 px-6 font-bold text-slate-900">₹{v.totalSpend.toLocaleString('en-IN')}</td>
                  <td className="py-4 px-6 font-bold text-emerald-600">{v.onTimeRate}</td>
                  <td className="py-4 px-6 font-bold text-amber-600">{v.score}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
