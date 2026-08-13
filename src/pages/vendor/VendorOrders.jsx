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
  PackageCheck, Truck, Eye, CheckCircle, XCircle, Package
} from 'lucide-react';

export const VendorOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [selectedPO, setSelectedPO] = useState(null);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);

  // Decline dialog
  const [declineDialog, setDeclineDialog] = useState({ open: false, orderId: null });
  const [declineReason, setDeclineReason] = useState('');

  const { showToast } = useToast();

  const loadOrders = async () => {
    setLoading(true);
    try {
      const allOrders = await orderApi.getOrders();
      const filtered = allOrders.filter(
        o => o.vendorId === user?.vendorId || o.vendorName.includes(user?.name)
      );
      setOrders(filtered);
    } catch (_err) {
      showToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [user]);

  // ── Action Handlers ─────────────────────────────────────────────────

  const handleAcceptInvoice = async (id) => {
    try {
      await orderApi.acceptInvoice(id, user?.name);
      showToast('Invoice accepted! Manager has been notified.', 'success');
      loadOrders();
    } catch (_err) {
      showToast('Failed to accept invoice', 'error');
    }
  };

  const handleDeclineSubmit = async () => {
    if (!declineDialog.orderId) return;
    try {
      await orderApi.declineInvoice(declineDialog.orderId, declineReason, user?.name);
      showToast('Invoice declined. Manager has been notified.', 'warning');
      setDeclineDialog({ open: false, orderId: null });
      setDeclineReason('');
      loadOrders();
    } catch (_err) {
      showToast('Failed to decline invoice', 'error');
    }
  };

  const handleMarkShipped = async (id) => {
    try {
      await orderApi.markShipped(id, user?.name);
      showToast('Order marked as Shipped!', 'success');
      loadOrders();
    } catch (_err) {
      showToast('Failed to mark as shipped', 'error');
    }
  };

  const handleMarkOutForDelivery = async (id) => {
    try {
      await orderApi.markOutForDelivery(id, user?.name);
      showToast('Order updated to Out for Delivery!', 'success');
      loadOrders();
    } catch (_err) {
      showToast('Failed to update delivery status', 'error');
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const STATUS_OPTIONS = [
    'Invoice Requested',
    'Invoice Accepted',
    'Invoice Declined',
    'Shipped',
    'Out for Delivery',
    'Delivered',
    'Paid'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <PackageCheck className="w-7 h-7 text-emerald-600" />
          Incoming Purchase Orders
        </h1>
        <p className="text-xs text-slate-500 mt-1">Accept or decline invoice requests, update shipment status, and track delivery lifecycle</p>
      </div>

      {/* Search & Filter */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search by PO number or category..."
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={STATUS_OPTIONS}
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
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">No purchase orders found.</td>
                  </tr>
                ) : filteredOrders.map((po) => (
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
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* View / Track */}
                        <button
                          onClick={() => { setSelectedPO(po); setIsTrackModalOpen(true); }}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                          title="View order lifecycle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Stage 1: Vendor accepts or declines invoice request */}
                        {po.status === 'Invoice Requested' && (
                          <>
                            <button
                              onClick={() => handleAcceptInvoice(po.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm transition-colors"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Accept</span>
                            </button>
                            <button
                              onClick={() => { setDeclineDialog({ open: true, orderId: po.id }); setDeclineReason(''); }}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-lg text-xs flex items-center gap-1 border border-rose-200 transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Decline</span>
                            </button>
                          </>
                        )}

                        {/* Stage 2: Mark as Shipped after acceptance */}
                        {po.status === 'Invoice Accepted' && (
                          <button
                            onClick={() => handleMarkShipped(po.id)}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm transition-colors"
                          >
                            <Package className="w-3.5 h-3.5" />
                            <span>Mark Shipped</span>
                          </button>
                        )}

                        {/* Stage 3: Mark Out for Delivery */}
                        {po.status === 'Shipped' && (
                          <button
                            onClick={() => handleMarkOutForDelivery(po.id)}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm transition-colors"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Out for Delivery</span>
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

      {/* Decline Invoice Dialog */}
      <Modal
        isOpen={declineDialog.open}
        onClose={() => setDeclineDialog({ open: false, orderId: null })}
        title="Decline Invoice Request"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-sm">
          <p className="text-slate-600 text-xs">Please provide a reason for declining this invoice request. The manager will be notified.</p>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reason <span className="text-rose-500">*</span></label>
            <textarea
              value={declineReason}
              onChange={e => setDeclineReason(e.target.value)}
              rows={3}
              placeholder="e.g. Items unavailable, pricing mismatch..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs resize-none focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeclineDialog({ open: false, orderId: null })}
              className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeclineSubmit}
              disabled={!declineReason.trim()}
              className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white rounded-xl transition-colors"
            >
              Decline Invoice
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
