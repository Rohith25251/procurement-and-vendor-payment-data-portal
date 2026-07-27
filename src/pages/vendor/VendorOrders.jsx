import React, { useState, useEffect } from 'react';
import { orderApi } from '../../api/orderApi';
import { useAuth } from '../../context/AuthContext';
import { SearchFilterBar } from '../../components/common/SearchFilterBar';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { OrderStatusTracker } from '../../components/stepper/OrderStatusTracker';
import { useToast } from '../../context/ToastContext';
import { 
  PackageCheck, Truck, Eye, FileText 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const VendorOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [selectedPO, setSelectedPO] = useState(null);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);

  const { showToast } = useToast();

  const loadOrders = async () => {
    setLoading(true);
    try {
      const allOrders = await orderApi.getOrders();
      // Filter for vendor
      const filtered = allOrders.filter(
        o => o.vendorId === user?.vendorId || o.vendorName.includes(user?.name)
      );
      setOrders(filtered);
    } catch (err) {
      showToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [user]);

  const handleGenerateInvoice = async (id) => {
    try {
      await orderApi.generateInvoiceForOrder(id, user?.name);
      showToast('Invoice generated automatically and sent to manager.', 'success');
      loadOrders();
    } catch (err) {
      showToast('Failed to generate invoice', 'error');
    }
  };

  const handleMarkOutForDelivery = async (id) => {
    try {
      await orderApi.markOutForDelivery(id, user?.name);
      showToast('Order status updated to Out for Delivery!', 'success');
      loadOrders();
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <PackageCheck className="w-7 h-7 text-emerald-600" />
          Incoming Purchase Orders
        </h1>
        <p className="text-xs text-slate-500 mt-1">Accept POs, raise queries, mark shipments as delivered, and submit invoices</p>
      </div>

      {/* Search & Filter */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search by PO number..."
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={['Invoice Requested', 'Invoice Generated', 'Paid', 'Out for Delivery', 'Delivered']}
      />

      {/* Orders Table */}
      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200/60">
                  <th className="py-3.5 px-6">PO Number</th>
                  <th className="py-3.5 px-6">Issue Date</th>
                  <th className="py-3.5 px-6">Expected Delivery</th>
                  <th className="py-3.5 px-6">Order Total</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6">
                      <button
                        onClick={() => { setSelectedPO(po); setIsTrackModalOpen(true); }}
                        className="font-bold text-emerald-600 hover:text-emerald-800 hover:underline text-left focus:outline-none"
                      >
                        {po.poNumber}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-slate-500">{po.createdDate}</td>
                    <td className="py-4 px-6 font-semibold">{po.expectedDeliveryDate}</td>
                    <td className="py-4 px-6 font-bold text-slate-900">₹{po.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="py-4 px-6">
                      <StatusBadge status={po.status} />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => { setSelectedPO(po); setIsTrackModalOpen(true); }}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                          title="Inspect requested items and status"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {po.status === 'Invoice Requested' && (
                          <button
                            onClick={() => handleGenerateInvoice(po.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Generate Invoice</span>
                          </button>
                        )}

                        {po.status === 'Paid' && (
                          <button
                            onClick={() => handleMarkOutForDelivery(po.id)}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs transition-colors"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Mark Out for Delivery</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stepper Detail Modal */}
      <Modal isOpen={isTrackModalOpen} onClose={() => setIsTrackModalOpen(false)} title={`Order Lifecycle: ${selectedPO?.poNumber}`} maxWidth="max-w-4xl">
        {selectedPO && (
          <div className="space-y-4">
            {!(selectedPO.notes && selectedPO.notes.includes('Auto-generated for External Invoice')) && (
              <OrderStatusTracker
                currentStatus={selectedPO.status}
                history={selectedPO.history}
                queryComment={selectedPO.queryComment}
                rejectionReason={selectedPO.rejectionReason}
              />
            )}

            <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-xs">
              <h4 className="font-bold text-slate-900">Line Items</h4>
              {selectedPO.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between py-1 border-b border-slate-200/60">
                  <span>{item.name} (x{item.quantity})</span>
                  <span className="font-bold">₹{item.total.toLocaleString('en-IN')} INR</span>
                </div>
              ))}
              <div className="text-right font-extrabold text-slate-900 pt-1">
                Total: ₹{selectedPO.totalAmount.toLocaleString('en-IN')} INR
              </div>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};
