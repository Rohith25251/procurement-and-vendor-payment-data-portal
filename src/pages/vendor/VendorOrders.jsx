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
  PackageCheck, Truck, Eye, FileText, XCircle, Package, Send, CheckCircle
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

  // Submit Invoice Modal State
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    poId: '',
    invoiceNumber: '',
    totalAmount: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

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

  const handleOpenSubmitInvoiceModal = (po) => {
    setSelectedPO(po);
    const defaultInvNumber = `INV-${po.poNumber.replace('PO-', '')}-${Math.floor(100 + Math.random() * 900)}`;
    setInvoiceForm({
      poId: po.id,
      invoiceNumber: defaultInvNumber,
      totalAmount: String(po.totalAmount || 0),
      invoiceDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setIsInvoiceModalOpen(true);
  };

  const handleInvoiceFormSubmit = async (e) => {
    e.preventDefault();
    if (!invoiceForm.invoiceNumber.trim()) {
      showToast('Please enter an invoice number', 'warning');
      return;
    }
    if (!invoiceForm.totalAmount || Number(invoiceForm.totalAmount) <= 0) {
      showToast('Please enter a valid total amount', 'warning');
      return;
    }

    try {
      await orderApi.vendorSubmitInvoice(invoiceForm.poId, invoiceForm, user?.name);
      showToast('Invoice submitted successfully! Sent to manager for review.', 'success');
      setIsInvoiceModalOpen(false);
      loadOrders();
    } catch (_err) {
      showToast('Failed to submit invoice', 'error');
    }
  };

  const handleDeclineSubmit = async () => {
    if (!declineDialog.orderId) return;
    try {
      await orderApi.vendorDeclineRequest(declineDialog.orderId, declineReason, user?.name);
      showToast('PO request declined. Manager has been notified.', 'warning');
      setDeclineDialog({ open: false, orderId: null });
      setDeclineReason('');
      loadOrders();
    } catch (_err) {
      showToast('Failed to decline PO request', 'error');
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

  const handleMarkDelivered = async (id) => {
    try {
      await orderApi.confirmDelivery(id, user?.name || 'Vendor');
      showToast('Order marked as Delivered!', 'success');
      loadOrders();
    } catch (_err) {
      showToast('Failed to mark as delivered', 'error');
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
    'Invoice Submitted',
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
        <p className="text-xs text-slate-500 mt-1">Submit invoices with manual amount entry, track approval, and update shipment progression</p>
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
                ) : filteredOrders.map((po) => {
                  const historyStatuses = (po.history || []).map(h => h.status);
                  const isDelivered = historyStatuses.includes('Delivered') || po.status === 'Delivered';
                  const isPaid = historyStatuses.includes('Paid') || po.status === 'Paid';
                  
                  // Compute effective status for delivery progression
                  let effectiveStatus = po.status;
                  if (po.status === 'Paid' && !isDelivered) {
                    if (historyStatuses.includes('Out for Delivery')) effectiveStatus = 'Out for Delivery';
                    else if (historyStatuses.includes('Shipped')) effectiveStatus = 'Shipped';
                    else if (historyStatuses.includes('Invoice Accepted')) effectiveStatus = 'Invoice Accepted';
                    else if (historyStatuses.includes('Invoice Submitted')) effectiveStatus = 'Invoice Submitted';
                    else effectiveStatus = 'Invoice Requested';
                  }

                  return (
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
                        <div className="flex items-center gap-1 flex-wrap">
                          <StatusBadge status={effectiveStatus} />
                          {isPaid && effectiveStatus !== 'Paid' && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-200">
                              ₹ Paid
                            </span>
                          )}
                        </div>
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

                          {/* Stage 1: Vendor submits invoice or declines request */}
                          {effectiveStatus === 'Invoice Requested' && (
                            <>
                              <button
                                onClick={() => handleOpenSubmitInvoiceModal(po)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm transition-colors"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Give Invoice</span>
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

                          {/* Stage 2: Mark as Shipped after manager accepts invoice */}
                          {effectiveStatus === 'Invoice Accepted' && (
                            <button
                              onClick={() => handleMarkShipped(po.id)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm transition-colors"
                            >
                              <Package className="w-3.5 h-3.5" />
                              <span>Mark Shipped</span>
                            </button>
                          )}

                          {/* Stage 3: Mark Out for Delivery */}
                          {effectiveStatus === 'Shipped' && (
                            <button
                              onClick={() => handleMarkOutForDelivery(po.id)}
                              className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm transition-colors"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Out for Delivery</span>
                            </button>
                          )}

                          {/* Stage 4: Mark Delivered when Out for Delivery */}
                          {effectiveStatus === 'Out for Delivery' && (
                            <button
                              onClick={() => handleMarkDelivered(po.id)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm transition-colors"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Mark Delivered</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Vendor Manual Invoice Submission */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title={`Give Invoice for ${selectedPO?.poNumber}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleInvoiceFormSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-slate-500 font-medium">Original PO Requested Amount:</span>
            <div className="text-base font-extrabold text-slate-900">₹{selectedPO?.totalAmount?.toLocaleString('en-IN')} INR</div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Invoice Number *</label>
            <input
              type="text"
              required
              value={invoiceForm.invoiceNumber}
              onChange={e => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
              placeholder="e.g. INV-2026-001"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Invoice Amount (₹ INR) *</label>
            <input
              type="number"
              step="0.01"
              required
              value={invoiceForm.totalAmount}
              onChange={e => setInvoiceForm({ ...invoiceForm, totalAmount: e.target.value })}
              placeholder="Enter final invoice amount"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-extrabold text-emerald-700 text-sm"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">You can manually adjust the invoice amount if required.</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Invoice Date *</label>
            <input
              type="date"
              required
              value={invoiceForm.invoiceDate}
              onChange={e => setInvoiceForm({ ...invoiceForm, invoiceDate: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Notes / Additional Details</label>
            <textarea
              rows={2}
              value={invoiceForm.notes}
              onChange={e => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
              placeholder="Add payment terms, tax notes, or bank info..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setIsInvoiceModalOpen(false)}
              className="px-4 py-2 font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Invoice</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Stepper Detail Modal */}
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

      {/* Modal 3: Decline Invoice Request Dialog */}
      <Modal
        isOpen={declineDialog.open}
        onClose={() => setDeclineDialog({ open: false, orderId: null })}
        title="Decline PO Request"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-sm">
          <p className="text-slate-600 text-xs">Please provide a reason for declining this purchase order request. The manager will be notified.</p>
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
              Decline PO Request
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
