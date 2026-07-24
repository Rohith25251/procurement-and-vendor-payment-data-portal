import React, { useState, useEffect } from 'react';
import { productApi } from '../../api/productApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SearchFilterBar } from '../../components/common/SearchFilterBar';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { 
  Package, Plus, Edit, Trash2, Tag, DollarSign, Clock, Layers 
} from 'lucide-react';

export const VendorProducts = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, productId: null });

  // Form State
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    category: 'Hardware & Raw Materials',
    unitPrice: '',
    stockStatus: 'In Stock',
    leadTimeDays: 3,
    description: ''
  });

  const { showToast } = useToast();

  const loadProducts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await productApi.getProductsByVendor(user.vendorId || 'vnd_apex_01');
      setProducts(data);
    } catch (err) {
      showToast('Failed to load products catalog', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [user]);

  const resetForm = () => {
    setProductForm({
      name: '',
      sku: '',
      category: 'Hardware & Raw Materials',
      unitPrice: '',
      stockStatus: 'In Stock',
      leadTimeDays: 3,
      description: ''
    });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await productApi.createProduct({
        ...productForm,
        vendorId: user.vendorId || 'vnd_apex_01',
        vendorName: user.companyName || user.name
      });
      showToast('Product added to catalog successfully!', 'success');
      setIsAddModalOpen(false);
      resetForm();
      loadProducts();
    } catch (err) {
      showToast('Failed to add product', 'error');
    }
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setProductForm({
      name: product.name,
      sku: product.sku || '',
      category: product.category,
      unitPrice: product.unitPrice,
      stockStatus: product.stockStatus || 'In Stock',
      leadTimeDays: product.leadTimeDays || 3,
      description: product.description || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      await productApi.updateProduct(selectedProduct.id, productForm);
      showToast('Product updated successfully!', 'success');
      setIsEditModalOpen(false);
      setSelectedProduct(null);
      resetForm();
      loadProducts();
    } catch (err) {
      showToast('Failed to update product', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await productApi.deleteProduct(deleteDialog.productId);
      showToast('Product removed from catalog', 'info');
      setDeleteDialog({ open: false, productId: null });
      loadProducts();
    } catch (err) {
      showToast('Failed to remove product', 'error');
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(products.map(p => p.category)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-7 h-7 text-emerald-600" />
            Product Catalog & Pricing Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">Manage offered products/services, unit prices, SKUs, and stock availability for purchase orders</p>
        </div>

        <button
          onClick={() => { resetForm(); setIsAddModalOpen(true); }}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-smooth flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Search & Filter */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search product name, SKU..."
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        categoryOptions={categories}
      />

      {/* Product Catalog Grid */}
      {loading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((prod) => (
            <div key={prod.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft hover:shadow-md transition-smooth flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-slate-400">{prod.sku || 'SKU-001'}</span>
                    <h3 className="text-sm font-extrabold text-slate-900 leading-snug">{prod.name}</h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border">
                    {prod.category}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mt-2 line-clamp-2">{prod.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Unit Price</span>
                  <span className="text-lg font-extrabold text-emerald-600">${prod.unitPrice.toLocaleString()} USD</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(prod)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                    title="Edit Product"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteDialog({ open: true, productId: prod.id })}
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors"
                    title="Remove Product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Product Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Product to Catalog">
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Product Title / Service Name *</label>
              <input
                type="text"
                required
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                placeholder="e.g. Precision Machine Bolts M10"
                className="w-full p-2.5 bg-slate-50 border rounded-xl font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">SKU / Item Code</label>
              <input
                type="text"
                value={productForm.sku}
                onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                placeholder="SKU-APX-880"
                className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono uppercase"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl font-semibold"
              >
                <option value="Hardware & Raw Materials">Hardware & Raw Materials</option>
                <option value="IT & Software Services">IT & Software Services</option>
                <option value="Facilities & Operations">Facilities & Operations</option>
                <option value="Packaging & Materials">Packaging & Materials</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unit Price ($ USD) *</label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={productForm.unitPrice}
                onChange={(e) => setProductForm({ ...productForm, unitPrice: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Lead Time (Days)</label>
              <input
                type="number"
                min="0"
                value={productForm.leadTimeDays}
                onChange={(e) => setProductForm({ ...productForm, leadTimeDays: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl"
              />
            </div>

            <div className="col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Product Description</label>
              <textarea
                rows={3}
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                placeholder="Detailed specifications..."
                className="w-full p-2.5 bg-slate-50 border rounded-xl"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 font-semibold">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-md">
              Add Product
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Catalog Product">
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Product Name</label>
              <input
                type="text"
                required
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl font-semibold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unit Price ($)</label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={productForm.unitPrice}
                onChange={(e) => setProductForm({ ...productForm, unitPrice: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Lead Time (Days)</label>
              <input
                type="number"
                value={productForm.leadTimeDays}
                onChange={(e) => setProductForm({ ...productForm, leadTimeDays: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 font-semibold">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-md">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, productId: null })}
        onConfirm={handleDeleteConfirm}
        title="Remove Product from Catalog"
        message="Are you sure you want to remove this product from your catalog? Managers will no longer be able to select it for new purchase orders."
        confirmText="Remove Product"
      />
    </div>
  );
};
