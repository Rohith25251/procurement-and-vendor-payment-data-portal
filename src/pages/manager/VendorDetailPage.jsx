import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { vendorApi } from '../../api/vendorApi';
import { orderApi } from '../../api/orderApi';
import { productApi } from '../../api/productApi';
import { StatusBadge } from '../../components/common/StatusBadge';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { 
  Building2, Mail, Phone, MapPin, FileCheck, Star, ArrowLeft, ShieldCheck, Download, Award, Package, ShoppingCart, Plus 
} from 'lucide-react';

export const VendorDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Quick Order Modal State
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({
    selectedProductId: '',
    quantity: 10,
    expectedDeliveryDate: '',
    notes: ''
  });

  useEffect(() => {
    const loadVendorDetails = async () => {
      setLoading(true);
      try {
        const v = await vendorApi.getVendorById(id);
        setVendor(v);

        const [allOrders, vendorProducts] = await Promise.all([
          orderApi.getOrders(),
          productApi.getProductsByVendor(v.id || v.vendorId)
        ]);

        const vOrders = allOrders.filter(o => o.vendorId === v.id || o.vendorId === v.vendorId);
        setOrders(vOrders);
        setProducts(vendorProducts);
      } catch (err) {
        console.error("Vendor details fetch error", err);
      } finally {
        setLoading(false);
      }
    };

    loadVendorDetails();
  }, [id]);

  const handleOpenOrderModal = (product) => {
    setOrderForm({
      selectedProductId: product ? product.id : (products[0]?.id || ''),
      quantity: 10,
      expectedDeliveryDate: new Date(Date.now() + 14*24*60*60*1000).toISOString().split('T')[0],
      notes: product ? `Order placed directly from catalog for ${product.name}` : ''
    });
    setIsOrderModalOpen(true);
  };

  const handlePlaceOrderSubmit = async (e) => {
    e.preventDefault();
    const prod = products.find(p => p.id === orderForm.selectedProductId) || products[0];
    if (!prod || !vendor) {
      showToast('Select a valid product', 'warning');
      return;
    }

    const itemTotal = Number(prod.unitPrice) * Number(orderForm.quantity);

    try {
      await orderApi.createOrder({
        vendorId: vendor.id,
        vendorName: vendor.name,
        category: vendor.category,
        expectedDeliveryDate: orderForm.expectedDeliveryDate,
        paymentTerms: 'Net 30',
        deliveryAddress: 'Main Warehouse, Gate 4, Chicago IL',
        notes: orderForm.notes,
        totalAmount: itemTotal,
        currency: 'INR',
        items: [
          {
            id: `item_${Date.now()}`,
            name: prod.name,
            quantity: Number(orderForm.quantity),
            unitPrice: Number(prod.unitPrice),
            total: itemTotal
          }
        ]
      });

      showToast(`Invoice requested for ${prod.name} successfully!`, 'success');
      setIsOrderModalOpen(false);
      navigate('/manager/procurement');
    } catch (err) {
      showToast('Failed to issue purchase order', 'error');
    }
  };

  if (loading) return <TableSkeleton rows={5} cols={4} />;
  if (!vendor) return <div className="p-8 text-center text-slate-500">Vendor record not found</div>;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/manager/vendors')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs transition-smooth"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Vendors Directory</span>
      </button>

      {/* Vendor Profile Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-4 bg-primary-50 border border-primary-100 rounded-2xl text-primary-600 shrink-0">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-900">{vendor.name}</h1>
              <StatusBadge status={vendor.status} />
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">{vendor.code} • Joined {vendor.joinedDate}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-600">
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" />{vendor.email}</span>
              <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" />{vendor.phone}</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" />{vendor.address || 'Chicago, IL'}</span>
            </div>
          </div>
        </div>

        {/* Action Button & Scorecard */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleOpenOrderModal(null)}
            className="px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-primary-600/30 transition-smooth flex items-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Place Order With Vendor</span>
          </button>

          <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl flex items-center gap-3 shrink-0 shadow-md">
            <Award className="w-7 h-7 text-amber-400" />
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Scorecard</p>
              <p className="text-xl font-extrabold text-amber-400">{vendor.score}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Offered Product & Service Catalog Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-soft space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary-600" />
            Vendor Offered Product & Service Catalog ({products.length})
          </h3>
          <span className="text-xs text-slate-400">Select any product to issue a PO instantly</span>
        </div>

        {products.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-2xl">
            No products published by vendor yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((prod) => (
              <div key={prod.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400">{prod.sku}</span>
                  <h4 className="text-sm font-bold text-slate-900">{prod.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{prod.description}</p>
                </div>

                <div className="pt-2 border-t flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Unit Price</span>
                    <span className="text-base font-extrabold text-primary-600">₹{prod.unitPrice.toLocaleString('en-IN')} INR</span>
                  </div>

                  <button
                    onClick={() => handleOpenOrderModal(prod)}
                    className="px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs rounded-xl shadow-xs transition-smooth flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Request Invoice</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid: Bank & Tax Details + Document Vault */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance & Bank Details */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-soft space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Tax & Bank Settlement Details
          </h3>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block font-semibold">GSTIN</span>
              <span className="font-mono font-bold text-slate-800">{vendor.gstin || 'N/A'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block font-semibold">PAN</span>
              <span className="font-mono font-bold text-slate-800">{vendor.pan || 'N/A'}</span>
            </div>
          </div>

          {vendor.bankDetails && (
            <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl text-xs space-y-2">
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Verified Settlement Account
              </p>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div><span className="text-slate-400">Bank:</span> {vendor.bankDetails.bankName}</div>
                <div><span className="text-slate-400">A/C:</span> {vendor.bankDetails.accountNumber}</div>
                <div><span className="text-slate-400">IFSC/SWIFT:</span> {vendor.bankDetails.ifscCode}</div>
                <div><span className="text-slate-400">Branch:</span> {vendor.bankDetails.branch}</div>
              </div>
            </div>
          )}
        </div>

        {/* Document Vault */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-soft">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
            Compliance & Document Vault
          </h3>

          <div className="space-y-3">
            {vendor.documents?.map((doc) => (
              <div key={doc.id} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileCheck className="w-5 h-5 text-primary-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">{doc.name}</p>
                    <p className="text-[10px] text-slate-500">{doc.type} • Uploaded {doc.uploadDate}</p>
                  </div>
                </div>
                <button
                  onClick={() => alert(`Simulated file download for ${doc.name}`)}
                  className="p-1.5 text-slate-500 hover:text-primary-600 rounded-lg"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Direct Order Modal */}
      <Modal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} title={`Request Invoice from ${vendor.name}`}>
        <form onSubmit={handlePlaceOrderSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Catalog Product *</label>
            <select
              value={orderForm.selectedProductId}
              onChange={(e) => setOrderForm({ ...orderForm, selectedProductId: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} — ₹{p.unitPrice.toLocaleString('en-IN')} INR ({p.sku})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Order Quantity *</label>
              <input
                type="number"
                required
                min="1"
                value={orderForm.quantity}
                onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Expected Delivery Date *</label>
              <input
                type="date"
                required
                value={orderForm.expectedDeliveryDate}
                onChange={(e) => setOrderForm({ ...orderForm, expectedDeliveryDate: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Order Note / Special Instructions</label>
            <textarea
              rows={2}
              value={orderForm.notes}
              onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button type="button" onClick={() => setIsOrderModalOpen(false)} className="px-4 py-2 font-semibold">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white font-bold rounded-xl shadow-md">
              Request Invoice
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
