import React, { useState, useEffect } from 'react';
import { orderApi } from '../../api/orderApi';
import { invoiceApi } from '../../api/invoiceApi';
import { vendorApi } from '../../api/vendorApi';
import { productApi } from '../../api/productApi';
import { SearchFilterBar } from '../../components/common/SearchFilterBar';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import {
  ShoppingCart, Plus, CheckCircle, Eye, Trash2, Calendar, FileText, Package, Edit, CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ManagerProcurement = () => {
  const [orders, setOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [vendorProducts, setVendorProducts] = useState([]);
  const [paidPoIds, setPaidPoIds] = useState(new Set()); // PO IDs that already have a paid invoice
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Create & Edit PO Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPo, setSelectedPo] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoiceView, setSelectedInvoiceView] = useState(null);
  const [isViewInvoiceModalOpen, setIsViewInvoiceModalOpen] = useState(false);
  const [rejectDialog, setRejectDialog] = useState({ open: false, orderId: null });
  const [declineInvoiceDialog, setDeclineInvoiceDialog] = useState({ open: false, orderId: null });
  const [deletePoDialog, setDeletePoDialog] = useState({ open: false, orderId: null });

  // Catalog Product Details Popup state
  const [selectedCatalogProduct, setSelectedCatalogProduct] = useState(null);
  const [popupQty, setPopupQty] = useState(1);

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
      const [orderData, vendorData, invoiceData] = await Promise.all([
        orderApi.getOrders(),
        vendorApi.getVendors(),
        invoiceApi.getInvoices()
      ]);
      setOrders(orderData);
      setInvoices(invoiceData || []);
      const approved = vendorData.filter(v => v.status === 'Approved');
      setVendors(approved);

      // Build set of PO IDs where invoice is already fully Paid
      const paidIds = new Set(
        invoiceData
          .filter(inv => inv.status === 'Paid' && inv.poId)
          .map(inv => inv.poId)
      );
      setPaidPoIds(paidIds);

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
    nextItems[index].imageUrl = prod.imageUrl || '';
    setPoForm({ ...poForm, items: nextItems });
  };

  const getProductQtyInPO = (prod) => {
    if (!prod || !prod.name) return 0;
    const match = poForm.items.find(item => item.name && item.name.trim().toLowerCase() === prod.name.trim().toLowerCase());
    return match ? (Number(match.quantity) || 0) : 0;
  };

  const addCatalogProductToPO = (prod) => {
    if (!prod) return;
    const existingIndex = poForm.items.findIndex(
      item => item.name && item.name.trim().toLowerCase() === prod.name.trim().toLowerCase()
    );

    if (existingIndex !== -1) {
      const nextItems = [...poForm.items];
      const newQty = (Number(nextItems[existingIndex].quantity) || 0) + 1;
      nextItems[existingIndex].quantity = newQty;
      setPoForm({ ...poForm, items: nextItems });
      showToast(`Increased "${prod.name}" quantity to ${newQty}`, 'success');
    } else {
      const isFirstEmpty = poForm.items.length === 1 && !poForm.items[0].name.trim();
      const newItem = {
        name: prod.name,
        quantity: 1,
        unitPrice: prod.unitPrice,
        imageUrl: prod.imageUrl || ''
      };
      if (isFirstEmpty) {
        setPoForm({ ...poForm, items: [newItem] });
      } else {
        setPoForm({ ...poForm, items: [...poForm.items, newItem] });
      }
      showToast(`Added "${prod.name}" to Purchase Order`, 'success');
    }
  };

  const handleOpenProductDetail = (prod) => {
    setSelectedCatalogProduct(prod);
    setPopupQty(1);
  };

  const handleAddFromPopup = () => {
    if (!selectedCatalogProduct) return;
    const prod = selectedCatalogProduct;
    const qtyToAdd = Number(popupQty) || 1;

    const existingIndex = poForm.items.findIndex(
      item => item.name && item.name.trim().toLowerCase() === prod.name.trim().toLowerCase()
    );

    if (existingIndex !== -1) {
      const nextItems = [...poForm.items];
      const newQty = (Number(nextItems[existingIndex].quantity) || 0) + qtyToAdd;
      nextItems[existingIndex].quantity = newQty;
      setPoForm({ ...poForm, items: nextItems });
      showToast(`Updated "${prod.name}" quantity to ${newQty}`, 'success');
    } else {
      const isFirstEmpty = poForm.items.length === 1 && !poForm.items[0].name.trim();
      const newItem = {
        name: prod.name,
        quantity: qtyToAdd,
        unitPrice: prod.unitPrice,
        imageUrl: prod.imageUrl || ''
      };
      if (isFirstEmpty) {
        setPoForm({ ...poForm, items: [newItem] });
      } else {
        setPoForm({ ...poForm, items: [...poForm.items, newItem] });
      }
      showToast(`Added ${qtyToAdd}x "${prod.name}" to Purchase Order`, 'success');
    }
    setSelectedCatalogProduct(null);
  };

  const removeCatalogProductFromPO = (prod) => {
    if (!prod || !prod.name) return;
    const nextItems = poForm.items.filter(item => item.name.trim().toLowerCase() !== prod.name.trim().toLowerCase());
    if (nextItems.length === 0) {
      setPoForm({ ...poForm, items: [{ name: '', quantity: 1, unitPrice: 0, imageUrl: '' }] });
    } else {
      setPoForm({ ...poForm, items: nextItems });
    }
    showToast(`Removed "${prod.name}" from Purchase Order`, 'info');
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

  const handleManagerAcceptInvoice = async (id) => {
    try {
      await orderApi.managerAcceptInvoice(id, 'Eleanor Vance');
      showToast('Invoice accepted! Vendor notified to ship order.', 'success');
      loadData();
    } catch (_err) {
      showToast('Failed to accept invoice', 'error');
    }
  };

  const handleManagerDeclineInvoice = async (reason) => {
    if (!declineInvoiceDialog.orderId) return;
    try {
      await orderApi.managerDeclineInvoice(declineInvoiceDialog.orderId, reason, 'Eleanor Vance');
      showToast('Invoice declined. Vendor notified.', 'warning');
      setDeclineInvoiceDialog({ open: false, orderId: null });
      loadData();
    } catch (_err) {
      showToast('Failed to decline invoice', 'error');
    }
  };

  const handleViewInvoice = (po) => {
    const matchingInv = invoices.find(inv => inv.poId === po.id || inv.poNumber === po.poNumber);
    const invDetails = matchingInv || {
      invoiceNumber: `INV-${po.poNumber.replace('PO-', '')}`,
      poNumber: po.poNumber,
      vendorName: po.vendorName,
      totalAmount: po.totalAmount,
      submittedAt: po.createdDate,
      status: po.status === 'Invoice Submitted' ? 'Submitted' : po.status,
      items: po.items || []
    };
    setSelectedInvoiceView({ po, invoice: invDetails });
    setIsViewInvoiceModalOpen(true);
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
    if (nextItems.length === 0) {
      setPoForm({ ...poForm, items: [{ name: '', quantity: 1, unitPrice: 0, imageUrl: '' }] });
    } else {
      setPoForm({ ...poForm, items: nextItems });
    }
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
                        {/* Edit & delete only on Invoice Requested (before vendor accepts) */}
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

                        {/* Confirm Delivery when goods are out for delivery */}
                        {po.status === 'Out for Delivery' && (
                          <button
                            onClick={() => handleConfirmDelivery(po.id)}
                            className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Confirm Delivery</span>
                          </button>
                        )}


                        {/* Manager reviews Submitted Invoice */}
                        {po.status === 'Invoice Submitted' && (
                          <>
                            <button
                              onClick={() => handleViewInvoice(po)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs flex items-center gap-1 border border-blue-200 transition-colors"
                              title="View submitted invoice details"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>View Invoice</span>
                            </button>
                            <button
                              onClick={() => handleManagerAcceptInvoice(po.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm transition-colors"
                              title="Accept submitted invoice"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Accept Invoice</span>
                            </button>
                            <button
                              onClick={() => setDeclineInvoiceDialog({ open: true, orderId: po.id })}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-lg text-xs flex items-center gap-1 border border-rose-200 transition-colors"
                              title="Decline submitted invoice"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Decline Invoice</span>
                            </button>
                          </>
                        )}

                        {/* Process Payment — only show if PO is not yet paid and no paid invoice exists */}
                        {['Invoice Accepted', 'Shipped', 'Out for Delivery', 'Delivered'].includes(po.status) &&
                          po.status !== 'Paid' &&
                          !paidPoIds.has(po.id) && (
                          <button
                            onClick={() => navigate('/manager/invoices')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm transition-colors"
                            title="Go to Invoices to process payment"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Process Payment</span>
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

          {/* Visual Catalog Product Picker with Images */}
          {vendorProducts.length > 0 && (
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-primary-600" />
                  Vendor Offered Catalog ({vendorProducts.length} Products)
                </span>
                <span className="text-[10px] text-slate-400">Click any product to add to PO</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {vendorProducts.map((p) => {
                  const qty = getProductQtyInPO(p);
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleOpenProductDetail(p)}
                      className={`p-2 border rounded-xl flex items-center gap-2.5 cursor-pointer transition-all hover:shadow-xs group ${
                        qty > 0 ? 'bg-primary-50/60 border-primary-300 ring-1 ring-primary-300' : 'bg-white border-slate-200/90 hover:border-primary-400'
                      }`}
                      title="Click product to view full details"
                    >
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-10 h-10 object-cover rounded-lg shrink-0 border border-slate-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200 flex items-center justify-center text-primary-600 shrink-0 font-bold">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-800 text-xs truncate group-hover:text-primary-600 transition-colors">{p.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-slate-400">{p.sku}</span>
                          <span className="text-xs font-extrabold text-primary-600">₹{p.unitPrice?.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); addCatalogProductToPO(p); }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 transition-colors flex items-center gap-1 shadow-2xs ${
                          qty > 0 ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-primary-600 text-white hover:bg-primary-500'
                        }`}
                        title="Click + Add button to insert directly into PO"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{qty > 0 ? `+1 (x${qty})` : 'Add'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dynamic Line Items */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Selected Line Items</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-primary-600 font-semibold flex items-center gap-1 text-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Blank Item
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
                        <option key={p.id} value={p.id}>{p.name} (₹{p.unitPrice?.toLocaleString('en-IN')})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-2.5 items-center">
                  {/* Product Image Thumbnail */}
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-9 h-9 object-cover rounded-lg border border-slate-200 shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-slate-200/80 text-slate-500 flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4" />
                    </div>
                  )}

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
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-2 text-rose-600 hover:bg-rose-100 bg-rose-50 rounded-xl transition-colors shrink-0"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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

          {/* Visual Catalog Product Picker with Images */}
          {vendorProducts.length > 0 && (
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-primary-600" />
                  Vendor Offered Catalog ({vendorProducts.length} Products)
                </span>
                <span className="text-[10px] text-slate-400">Click any product to add to PO</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {vendorProducts.map((p) => {
                  const qty = getProductQtyInPO(p);
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleOpenProductDetail(p)}
                      className={`p-2 border rounded-xl flex items-center gap-2.5 cursor-pointer transition-all hover:shadow-xs group ${
                        qty > 0 ? 'bg-primary-50/60 border-primary-300 ring-1 ring-primary-300' : 'bg-white border-slate-200/90 hover:border-primary-400'
                      }`}
                      title="Click product to view full details"
                    >
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-10 h-10 object-cover rounded-lg shrink-0 border border-slate-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200 flex items-center justify-center text-primary-600 shrink-0 font-bold">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-800 text-xs truncate group-hover:text-primary-600 transition-colors">{p.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-slate-400">{p.sku}</span>
                          <span className="text-xs font-extrabold text-primary-600">₹{p.unitPrice?.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); addCatalogProductToPO(p); }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 transition-colors flex items-center gap-1 shadow-2xs ${
                          qty > 0 ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-primary-600 text-white hover:bg-primary-500'
                        }`}
                        title="Click + Add button to insert directly into PO"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{qty > 0 ? `+1 (x${qty})` : 'Add'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dynamic Line Items */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Selected Line Items</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-primary-600 font-semibold flex items-center gap-1 text-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Blank Item
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
                        <option key={p.id} value={p.id}>{p.name} (₹{p.unitPrice?.toLocaleString('en-IN')})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-2.5 items-center">
                  {/* Product Image Thumbnail */}
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-9 h-9 object-cover rounded-lg border border-slate-200 shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-slate-200/80 text-slate-500 flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4" />
                    </div>
                  )}

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
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-2 text-rose-600 hover:bg-rose-100 bg-rose-50 rounded-xl transition-colors shrink-0"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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

      {/* Product Detail Quick View Modal */}
      <Modal 
        isOpen={!!selectedCatalogProduct} 
        onClose={() => setSelectedCatalogProduct(null)} 
        title="Catalog Product Details"
      >
        {selectedCatalogProduct && (
          <div className="space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {selectedCatalogProduct.imageUrl ? (
                <img 
                  src={selectedCatalogProduct.imageUrl} 
                  alt={selectedCatalogProduct.name} 
                  className="w-32 h-32 object-cover rounded-2xl border border-slate-200 shadow-xs shrink-0" 
                />
              ) : (
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200 flex items-center justify-center text-primary-600 font-bold shrink-0">
                  <Package className="w-12 h-12" />
                </div>
              )}

              <div className="space-y-2 min-w-0 flex-1">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">{selectedCatalogProduct.sku}</span>
                  <h3 className="text-lg font-extrabold text-slate-900">{selectedCatalogProduct.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedCatalogProduct.category || 'Hardware & Raw Materials'}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Unit Price</span>
                    <span className="text-base font-extrabold text-primary-600">₹{selectedCatalogProduct.unitPrice?.toLocaleString('en-IN')} INR</span>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-lg">In Stock</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Description & Specifications</span>
              <p className="text-xs text-slate-600">{selectedCatalogProduct.description || 'Enterprise grade procurement hardware product.'}</p>
            </div>

            <div className="pt-3 border-t flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <label className="font-bold text-slate-700">Quantity:</label>
                <input
                  type="number"
                  min="1"
                  value={popupQty}
                  onChange={(e) => setPopupQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 p-2 bg-slate-50 border rounded-xl font-bold text-center"
                />
              </div>

              <div className="flex items-center gap-2">
                <button 
                  type="button" 
                  onClick={() => setSelectedCatalogProduct(null)} 
                  className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900"
                >
                  Close
                </button>
                <button 
                  type="button" 
                  onClick={handleAddFromPopup} 
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Purchase Order</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
      {/* View Submitted Invoice Modal */}
      <Modal
        isOpen={isViewInvoiceModalOpen}
        onClose={() => setIsViewInvoiceModalOpen(false)}
        title={`Invoice Details: ${selectedInvoiceView?.invoice?.invoiceNumber || ''}`}
        maxWidth="max-w-2xl"
      >
        {selectedInvoiceView && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Invoice Number</span>
                <h3 className="text-lg font-extrabold text-slate-900">{selectedInvoiceView.invoice.invoiceNumber}</h3>
                <p className="text-slate-500 text-xs font-mono">PO Ref: {selectedInvoiceView.po.poNumber}</p>
              </div>
              <div className="text-right">
                <StatusBadge status={selectedInvoiceView.invoice.status || selectedInvoiceView.po.status} />
                <p className="text-[10px] text-slate-400 mt-1">Submitted: {selectedInvoiceView.invoice.submittedAt || selectedInvoiceView.po.createdDate}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Vendor Name</span>
                <p className="font-extrabold text-slate-900 text-sm mt-0.5">{selectedInvoiceView.po.vendorName}</p>
                <p className="text-slate-500 text-[11px]">{selectedInvoiceView.po.category}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Invoice Amount</span>
                <p className="font-extrabold text-emerald-600 text-lg mt-0.5">₹{selectedInvoiceView.invoice.totalAmount?.toLocaleString('en-IN')} INR</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-900">Line Items</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 text-[10px] font-bold uppercase text-slate-500 border-b">
                      <th className="p-2.5">Item Description</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedInvoiceView.invoice.items?.length ? selectedInvoiceView.invoice.items : selectedInvoiceView.po.items)?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-semibold text-slate-800">{item.description || item.name}</td>
                        <td className="p-2.5 text-center">{item.quantity}</td>
                        <td className="p-2.5 text-right">₹{Number(item.unitPrice).toLocaleString('en-IN')}</td>
                        <td className="p-2.5 text-right font-bold text-slate-900">₹{Number(item.total || (item.quantity * item.unitPrice)).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedInvoiceView.po.status === 'Invoice Submitted' && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 mt-4">
                <span className="text-xs font-semibold text-amber-900">Review vendor invoice and choose action:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsViewInvoiceModalOpen(false);
                      handleManagerAcceptInvoice(selectedInvoiceView.po.id);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Accept Invoice</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsViewInvoiceModalOpen(false);
                      setDeclineInvoiceDialog({ open: true, orderId: selectedInvoiceView.po.id });
                    }}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-lg text-xs flex items-center gap-1 border border-rose-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Decline Invoice</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setIsViewInvoiceModalOpen(false)}
                className="px-4 py-2 font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Decline Invoice Dialog */}
      <ConfirmDialog
        isOpen={declineInvoiceDialog.open}
        onClose={() => setDeclineInvoiceDialog({ open: false, orderId: null })}
        onConfirm={handleManagerDeclineInvoice}
        title="Decline Submitted Invoice"
        message="Are you sure you want to decline this submitted invoice? Please provide a reason for the vendor."
        confirmText="Decline Invoice"
        cancelText="Cancel"
        type="danger"
        requireReason={true}
      />
    </div>
  );
};
