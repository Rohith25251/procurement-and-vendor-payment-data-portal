import React, { useState, useEffect } from 'react';
import { vendorApi } from '../../api/vendorApi';
import { SearchFilterBar } from '../../components/common/SearchFilterBar';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { 
  Users, UserPlus, Star, CheckCircle, XCircle, Eye, Edit, Power, Building2, Phone, Mail, Copy, KeyRound
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ManagerVendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [rejectDialog, setRejectDialog] = useState({ open: false, vendorId: null });
  const [credentialsModal, setCredentialsModal] = useState({ open: false, email: '', password: '' });

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    category: 'Hardware & Raw Materials',
    gstin: '',
    pan: '',
    address: ''
  });

  const { showToast } = useToast();
  const navigate = useNavigate();

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const data = await vendorApi.getVendors();
      setVendors(data);
    } catch (err) {
      showToast('Failed to load vendors', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleApprove = async (id) => {
    try {
      const result = await vendorApi.approveVendor(id);
      showToast('Vendor registration approved successfully', 'success');
      // Show the login credentials to the manager
      setCredentialsModal({
        open: true,
        email: result.loginEmail,
        password: result.loginPassword,
      });
      fetchVendors();
    } catch (err) {
      showToast('Action failed', 'error');
    }
  };

  const handleRejectConfirm = async (reason) => {
    try {
      await vendorApi.rejectVendor(rejectDialog.vendorId, reason);
      showToast('Vendor request rejected', 'warning');
      setRejectDialog({ open: false, vendorId: null });
      fetchVendors();
    } catch (err) {
      showToast('Action failed', 'error');
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await vendorApi.deactivateVendor(id);
      showToast('Vendor status set to Deactivated', 'info');
      fetchVendors();
    } catch (err) {
      showToast('Action failed', 'error');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await vendorApi.createVendor(formData);
      showToast('New vendor onboarded successfully', 'success');
      setIsAddModalOpen(false);
      resetForm();
      fetchVendors();
    } catch (err) {
      showToast('Failed to onboard vendor', 'error');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVendor) return;
    try {
      await vendorApi.updateVendor(selectedVendor.id, formData);
      showToast('Vendor profile updated', 'success');
      setIsEditModalOpen(false);
      setSelectedVendor(null);
      resetForm();
      fetchVendors();
    } catch (err) {
      showToast('Failed to update vendor', 'error');
    }
  };

  const openEditModal = (vendor) => {
    setSelectedVendor(vendor);
    setFormData({
      name: vendor.name,
      contactPerson: vendor.contactPerson,
      email: vendor.email,
      phone: vendor.phone,
      category: vendor.category,
      gstin: vendor.gstin || '',
      pan: vendor.pan || '',
      address: vendor.address || ''
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      category: 'Hardware & Raw Materials',
      gstin: '',
      pan: '',
      address: ''
    });
  };

  const filteredVendors = vendors.filter(v => {
    if (!v || !v.name || !v.name.trim() || v.name.trim() === 'NULL') return false;
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || v.status === statusFilter;
    const matchesCategory = !categoryFilter || v.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = Array.from(new Set(vendors.filter(v => v && v.category).map(v => v.category)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-primary-600" />
            Vendor Directory & Catalogs
          </h1>
          <p className="text-xs text-slate-500 mt-1">Browse approved vendors, inspect product catalogs, and initiate procurement</p>
        </div>
      </div>

      {/* Search & Filter */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search by vendor name, code, email..."
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={['Approved', 'Pending', 'Rejected', 'Deactivated']}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        categoryOptions={categories}
      />

      {/* Vendor Table */}
      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200/60">
                  <th className="py-3.5 px-6">Vendor Name & Code</th>
                  <th className="py-3.5 px-6">Category</th>
                  <th className="py-3.5 px-6">Contact Person</th>
                  <th className="py-3.5 px-6">Score</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredVendors.map((v) => (
                  <tr 
                    key={v.id} 
                    onClick={() => navigate(`/manager/vendors/${v.id}`)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{v.name}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{v.code}</span>
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-semibold">{v.category}</td>
                    <td className="py-4 px-6">
                      <div>{v.contactPerson}</div>
                      <div className="text-[10px] text-slate-400">{v.email}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1 font-bold text-amber-600">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{v.score}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/manager/vendors/${v.id}`)}
                          className="px-3.5 py-1.5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                          title="View Vendor Catalog & Start Procurement"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Catalog & Order</span>
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

      {/* Add Vendor Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Onboard New Vendor">
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Company Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Acme Industrial Corp"
                className="w-full p-2.5 bg-slate-50 border rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl font-medium"
              >
                <option value="Hardware & Raw Materials">Hardware & Raw Materials</option>
                <option value="IT & Software Services">IT & Software Services</option>
                <option value="Facilities & Operations">Facilities & Operations</option>
                <option value="Packaging & Materials">Packaging & Materials</option>
                <option value="Logistics & Transport">Logistics & Transport</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Person *</label>
              <input
                type="text"
                required
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="Full Name"
                className="w-full p-2.5 bg-slate-50 border rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="vendor@company.com"
                className="w-full p-2.5 bg-slate-50 border rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full p-2.5 bg-slate-50 border rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">GSTIN</label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                placeholder="27AAACA12341Z5"
                className="w-full p-2.5 bg-slate-50 border rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">PAN</label>
              <input
                type="text"
                value={formData.pan}
                onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                placeholder="AAACA1234A"
                className="w-full p-2.5 bg-slate-50 border rounded-xl"
              />
            </div>
            <div className="col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Address</label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street address, city, state..."
                className="w-full p-2.5 bg-slate-50 border rounded-xl"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white font-bold rounded-xl"
            >
              Onboard Vendor
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Vendor Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Vendor Details">
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Company Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl font-medium"
              >
                <option value="Hardware & Raw Materials">Hardware & Raw Materials</option>
                <option value="IT & Software Services">IT & Software Services</option>
                <option value="Facilities & Operations">Facilities & Operations</option>
                <option value="Packaging & Materials">Packaging & Materials</option>
                <option value="Logistics & Transport">Logistics & Transport</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Person *</label>
              <input
                type="text"
                required
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">GSTIN</label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">PAN</label>
              <input
                type="text"
                value={formData.pan}
                onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl"
              />
            </div>
            <div className="col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Address</label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 font-semibold">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white font-bold rounded-xl">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Rejection Dialog */}
      <ConfirmDialog
        isOpen={rejectDialog.open}
        onClose={() => setRejectDialog({ open: false, vendorId: null })}
        onConfirm={handleRejectConfirm}
        title="Reject Vendor Registration"
        message="Are you sure you want to reject this vendor request? Specify the reason below."
        confirmText="Reject Request"
        requireReason={true}
        reasonPlaceholder="e.g. Incomplete tax compliance documentation"
      />

      {/* Credentials Modal — shown after vendor approval */}
      {credentialsModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Vendor Login Credentials</h3>
                <p className="text-xs text-slate-500">Share these with the vendor so they can log in</p>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Email</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-mono font-semibold text-slate-800 break-all">{credentialsModal.email}</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(credentialsModal.email); showToast('Email copied!', 'success'); }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 flex-shrink-0"
                    title="Copy email"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Password</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-mono font-semibold text-slate-800">{credentialsModal.password}</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(credentialsModal.password); showToast('Password copied!', 'success'); }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 flex-shrink-0"
                    title="Copy password"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5">
              <p className="text-xs text-amber-700">⚠️ Save these credentials now — the password won't be shown again.</p>
            </div>

            <button
              onClick={() => setCredentialsModal({ open: false, email: '', password: '' })}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
