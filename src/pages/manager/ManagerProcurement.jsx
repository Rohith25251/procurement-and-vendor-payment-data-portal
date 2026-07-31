import React, { useState, useEffect } from 'react';
import { orderApi } from '../../api/orderApi';
import { vendorApi } from '../../api/vendorApi';
import { productApi } from '../../api/productApi';
import { SearchFilterBar } from '../../components/common/SearchFilterBar';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { 
  ShoppingCart, Plus, CheckCircle, XCircle, Eye, Trash2, Calendar, FileText, Package, Edit 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ManagerProcurement = () => {
  const [orders, setOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [vendorProducts, setVendorProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Create & Edit PO Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPo, setSelectedPo] = useState(null);
  const [rejectDialog, setRejectDialog] = useState({ open: false, orderId: null });
  const [deletePoDialog, setDeletePoDialog] = useState({ open: false, orderId: null });

  // Dynamic PO Form State
  const [poForm, setPoForm] = useState({
    vendorId: '',
    expectedDeliveryDate: '',
    paymentTerms: 'Net 30',
    deliveryAddress: 'Warehouse B, Gate 4, Chicago IL',
    notes: '',
    items: [
      { name: '', quantity: 1, unitPrice: 0 }
    ]
  });

  const { showToast } = useToast();
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    try {
      const [orderData, vendorData] = await Promise.all([
        orderApi.getOrders(),
        vendorApi.getVendors()
      ]);
      setOrders(orderData);
      const approved = vendorData.filter(v => v.status === 'Approved');
      setVendors(approved);

      if (approved.length > 0) {
        const initialVendorId = poForm.vendorId || approved[0].id;
        setPoForm(prev => ({ ...prev, vendorId: initialVendorId }));
        const prods = await productApi.getProductsByVendor(initialVendorId);
        setVendorProducts(prods);
      }
    } catch (err) {
      showToast('Failed to load procurement records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVendorSelectChange = async (vendorId) => {
    setPoForm({ ...poForm, vendorId });
    try {
      const prods = await productApi.getProductsByVendor(vendorId);
      setVendorProducts(prods);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectCatalogProduct = (index, productId) => {
    const prod = vendorProducts.find(p => p.id === productId);
    if (!prod) return;
    const nextItems = [...poForm.items];
    nextItems[index].name = prod.name;
    nextItems[index].unitPrice = prod.unitPrice;
    setPoForm({ ...poForm, items: nextItems });
  };

  const handleConfirmDelivery = async (id) => {
    try {
      await orderApi.confirmDelivery(id, 'Eleanor Vance');
      showToast('Delivery confirmed. Order marked as Delivered!', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to confirm delivery', 'error');
    }
  };

  const handleRejectConfirm = async (reason) => {
    try {
      await orderApi.rejectOrder(rejectDialog.orderId, reason);
      showToast('Purchase Order rejected', 'warning');
      setRejectDialog({ open: false, orderId: null });
      loadData();
    } catch (err) {
      showToast('Failed to reject PO', 'error');
    }
  };

  // Item row operations
  const handleAddItem = () => {
    setPoForm({
      ...poForm,
      items: [...poForm.items, { name: '', quantity: 1, unitPrice: 0 }]
    });
  };

  const handleRemoveItem = (index) => {
    const nextItems = poForm.items.filter((_, i) => i !== index);
    setPoForm({ ...poForm, items: nextItems });
  };

  const handleItemChange = (index, field, value) => {
    const nextItems = [...poForm.items];
    nextItems[index][field] = value;
    setPoForm({ ...poForm, items: nextItems });
  };

  const calculateTotal = () => {
    return poForm.items.reduce((acc, item) => acc + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
    }
  };

  const validatePOForm = () => {
    if (!poForm.items || poForm.items.length === 0) {
      showToast('Please add at least one line item', 'warning');
      return false;
    }
    for (const item of poForm.items) {
      if (!item.name || !item.name.trim()) {
        showToast('All items must have a description / name', 'warning');
        return false;
      }
      if (Number(item.quantity) <= 0) {
        showToast(`Quantity for "${item.name}" must be greater than 0`, 'warning');
        return false;
      }
      if (Number(item.unitPrice) <= 0) {
        showToast(`Price for "${item.name}" must be greater than 0`, 'warning');
        return false;
      }
    }
    const totalAmount = calculateTotal();
    if (totalAmount <= 0) {
      showToast('Total PO amount must be greater than ₹0', 'warning');
      return false;
    }
    return true;
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!validatePOForm()) return;

    const selectedVnd = vendors.find(v => v.id === poForm.vendorId);
    if (!selectedVnd) {
      showToast('Please select a valid vendor', 'warning');
      return;
    }

    const totalAmount = calculateTotal();
    const formattedItems = poForm.items.map((item, idx) => ({
      id: `item_${idx}_${Date.now()}`,
      name: item.name.trim(),
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      total: Number(item.quantity) * Number(item.unitPrice)
    }));

    try {
      await orderApi.createOrder({
        vendorId: selectedVnd.id,
        vendorName: selectedVnd.name,
        category: selectedVnd.category,
        expectedDeliveryDate: poForm.expectedDeliveryDate || new Date(Date.now() + 14*24*60*60*1000).toISOString().split('T')[0],
        paymentTerms: poForm.paymentTerms,
        deliveryAddress: poForm.deliveryAddress,
        notes: poForm.notes,
        totalAmount,
        currency: 'INR',
        items: formattedItems
      });

      showToast('Purchase Order requested successfully', 'success');
      setIsCreateModalOpen(false);
      loadData();
    } catch (err) {
      showToast('Failed to create PO', 'error');
    }
  };

  const handleEditOpen = (po) => {
    setSelectedPo(po);
    setPoForm({
      vendorId: po.vendorId,
      expectedDeliveryDate: po.expectedDeliveryDate,
      paymentTerms: po.paymentTerms || 'Net 30',
      deliveryAddress: po.deliveryAddress || '',
      notes: po.notes || '',
      items: po.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }))
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPo) return;
    if (!validatePOForm()) return;

    const totalAmount = calculateTotal();
    const formattedItems = poForm.items.map((item, idx) => ({
      id: selectedPo.items[idx]?.id || `item_${idx}_${Date.now()}`,
      name: item.name.trim(),
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      total: Number(item.quantity) * Number(item.unitPrice)
    }));

    try {
      await orderApi.updateOrder(selectedPo.id, {
        expectedDeliveryDate: poForm.expectedDeliveryDate,
        paymentTerms: poForm.paymentTerms,
        deliveryAddress: poForm.deliveryAddress,
        notes: poForm.notes,
        totalAmount,
        items: formattedItems
      });

      showToast('Purchase Order updated successfully', 'success');
      setIsEditModalOpen(false);
      setSelectedPo(null);
      loadData();
    } catch (err) {
      showToast('Failed to update PO', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletePoDialog.orderId) return;
    try {
      await orderApi.deleteOrder(deletePoDialog.orderId);
      showToast('Purchase Order deleted successfully', 'info');
      setDeletePoDialog({ open: false, orderId: null });
      loadData();
    } catch (err) {
      showToast('Failed to delete PO', 'error');
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const allStatuses = [
    'Invoice Requested', 'Invoice Generated', 'Paid', 'Out for Delivery', 'Delivered'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-primary-600" />
            Purchase Order Procurement Queue
          </h1>
          <p className="text-xs text-slate-500 mt-1">Issue POs, review requests, and monitor full delivery lifecycles</p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-primary-600/20 transition-smooth flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Request Invoice</span>
        </button>
      </div>

      {/* Search & Filter */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search by PO number, vendor..."
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={allStatuses}
      />

      {/* PO Table */}
      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200/60">
                  <th className="py-3.5 px-6">PO Number</th>
                  <th className="py-3.5 px-6">Vendor Name</th>
                  <th className="py-3.5 px-6">Created / Exp. Delivery</th>
                  <th className="py-3.5 px-6">Total Amount</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{po.poNumber}</div>
                      <span className="text-[10px] text-slate-400">{po.category}</span>
                    </td>
                    <td className="py-4 px-6 font-semibold">{po.vendorName}</td>
                    <td className="py-4 px-6">
                      <div>{po.createdDate}</div>
                      <div className="text-[10px] text-slate-400">Due: {po.expectedDeliveryDate}</div>
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">₹{po.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="py-4 px-6">
                      <StatusBadge status={po.status} />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {po.status === 'Invoice Requested' && (
                          <>
                            <button
                              onClick={() => handleEditOpen(po)}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors"
                              title="Edit Purchase Order"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => setDeletePoDialog({ open: true, orderId: po.id })}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors"
                              title="Delete Purchase Order"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </>
                        )}
                        {po.status === 'Out for Delivery' && (
                          <button
                            onClick={() => handleConfirmDelivery(po.id)}
                            className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Confirm Delivery</span>
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/manager/procurement/${po.id}`)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Track</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create PO Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Purchase Order">
        <form onSubmit={handleCreateSubmit} onKeyDown={handleKeyDown} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block font-semibold text-slate-700 mb-1">Select Vendor *</label>
              <select
                required
                value={poForm.vendorId}
                onChange={(e) => handleVendorSelectChange(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border rounded-xl font-semibold"
              >
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name} ({v.category})</option>
                ))}
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block font-semibold text-slate-700 mb-1">Expected Delivery Date *</label>
              <input
                type="date"
                required
                value={poForm.expectedDeliveryDate}
                onChange={(e) => setPoForm({ ...poForm, expectedDeliveryDate: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl"
              />
            </div>
          </div>

          {/* Dynamic Line Items */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Line Items</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-primary-600 font-semibold flex items-center gap-1 text-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>

            {poForm.items.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border rounded-xl space-y-2">
                {vendorProducts.length > 0 && (
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="w-3.5 h-3.5 text-primary-600" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Quick Pick Catalog Item:</span>
                    <select
                      onChange={(e) => handleSelectCatalogProduct(idx, e.target.value)}
                      className="text-xs p-1 bg-white border rounded-lg font-medium"
                    >
                      <option value="">Select from Catalog...</option>
                      {vendorProducts.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (${p.unitPrice})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    required
                    placeholder="Item description / Part #"
                    value={item.name}
                    onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                    className="flex-1 p-2 bg-white border rounded-xl"
                  />
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    className="w-20 p-2 bg-white border rounded-xl text-center font-bold"
                  />
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder="Price (₹)"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                    className="w-28 p-2 bg-white border rounded-xl text-right font-bold"
                  />
                  {poForm.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            <div className="text-right pt-2 border-t font-bold text-sm text-slate-900">
              Total Amount: ₹{calculateTotal().toLocaleString('en-IN')} INR
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 font-semibold">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white font-bold rounded-xl shadow-md">
              Request Invoice
            </button>
          </div>
        </form>
      </Modal>

      {/* Reject Dialog */}
      <ConfirmDialog
        isOpen={rejectDialog.open}
        onClose={() => setRejectDialog({ open: false, orderId: null })}
        onConfirm={handleRejectConfirm}
        title="Reject Purchase Order"
        message="Are you sure you want to reject this purchase order? Please state the mandatory reason."
        requireReason={true}
        reasonPlaceholder="e.g. Budget ceiling exceeded for Q3 procurement"
      />

      {/* Edit PO Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setSelectedPo(null); }} title="Edit Purchase Order">
        <form onSubmit={handleEditSubmit} onKeyDown={handleKeyDown} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block font-semibold text-slate-700 mb-1">Vendor (Fixed)</label>
              <input
                type="text"
                disabled
                value={selectedPo?.vendorName || ''}
                className="w-full p-2.5 bg-slate-100 border rounded-xl font-bold text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block font-semibold text-slate-700 mb-1">Expected Delivery Date *</label>
              <input
                type="date"
                required
                value={poForm.expectedDeliveryDate}
                onChange={(e) => setPoForm({ ...poForm, expectedDeliveryDate: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl"
              />
            </div>
          </div>

          {/* Dynamic Line Items */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Line Items</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-primary-600 font-semibold flex items-center gap-1 text-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>

            {poForm.items.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border rounded-xl space-y-2">
                {vendorProducts.length > 0 && (
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="w-3.5 h-3.5 text-primary-600" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Quick Pick Catalog Item:</span>
                    <select
                      onChange={(e) => handleSelectCatalogProduct(idx, e.target.value)}
                      className="text-xs p-1 bg-white border rounded-lg font-medium"
                    >
                      <option value="">Select from Catalog...</option>
                      {vendorProducts.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (₹{p.unitPrice})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    required
                    placeholder="Item description / Part #"
                    value={item.name}
                    onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                    className="flex-1 p-2 bg-white border rounded-xl"
                  />
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    className="w-20 p-2 bg-white border rounded-xl text-center font-bold"
                  />
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder="Price (₹)"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                    className="w-28 p-2 bg-white border rounded-xl text-right font-bold"
                  />
                  {poForm.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            <div className="text-right pt-2 border-t font-bold text-sm text-slate-900">
              Total Amount: ₹{calculateTotal().toLocaleString('en-IN')} INR
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => { setIsEditModalOpen(false); setSelectedPo(null); }} className="px-4 py-2 font-semibold">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white font-bold rounded-xl shadow-md">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete PO Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deletePoDialog.open}
        onClose={() => setDeletePoDialog({ open: false, orderId: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Purchase Order"
        message="Are you sure you want to delete this purchase order? This action will permanently remove it from the portal and cannot be undone."
        confirmText="Delete Order"
      />
    </div>
  );
};
