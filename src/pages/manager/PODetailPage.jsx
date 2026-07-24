import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderApi } from '../../api/orderApi';
import { OrderStatusTracker } from '../../components/stepper/OrderStatusTracker';
import { StatusBadge } from '../../components/common/StatusBadge';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { useToast } from '../../context/ToastContext';
import { 
  ArrowLeft, FileText, Calendar, Building2, MapPin, CheckCircle, XCircle, Clock, ShieldCheck 
} from 'lucide-react';

export const PODetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchPO = async () => {
      setLoading(true);
      try {
        const data = await orderApi.getOrderById(id);
        setPo(data);
      } catch (err) {
        showToast('Purchase order not found', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchPO();
  }, [id]);

  if (loading) return <TableSkeleton rows={5} cols={4} />;
  if (!po) return <div className="p-8 text-center text-slate-500">Purchase order record not found</div>;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs transition-smooth"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Order Queue</span>
      </button>

      {/* Main Order Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900">{po.poNumber}</h1>
            <StatusBadge status={po.status} size="lg" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Vendor: <span className="font-bold text-slate-800">{po.vendorName}</span> • Category: {po.category}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-slate-400 font-semibold uppercase">Total PO Value</p>
          <p className="text-3xl font-extrabold text-primary-600">${po.totalAmount.toLocaleString()} USD</p>
        </div>
      </div>

      {/* Order Status Stepper */}
      <OrderStatusTracker
        currentStatus={po.status}
        history={po.history}
        queryComment={po.queryComment}
        rejectionReason={po.rejectionReason}
      />

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Items Table */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-soft">
          <h3 className="text-base font-bold text-slate-900 mb-4">Itemized Order Specifications</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b">
                  <th className="py-2.5 px-4">Item Description</th>
                  <th className="py-2.5 px-4 text-center">Qty</th>
                  <th className="py-2.5 px-4 text-right">Unit Price</th>
                  <th className="py-2.5 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {po.items?.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 px-4 font-semibold text-slate-900">{item.name}</td>
                    <td className="py-3 px-4 text-center">{item.quantity}</td>
                    <td className="py-3 px-4 text-right">${item.unitPrice.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">${item.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Log / History */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-soft">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary-600" />
            Audit Trail & History
          </h3>

          <div className="space-y-4">
            {po.history?.map((h, i) => (
              <div key={i} className="flex items-start gap-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-primary-600 mt-1.5 shrink-0" />
                <div>
                  <p className="font-bold text-slate-800">{h.status}</p>
                  <p className="text-[11px] text-slate-500">{h.actor} • {h.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
