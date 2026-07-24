import React, { useState, useEffect } from 'react';
import { vendorApi } from '../../api/vendorApi';
import { SearchFilterBar } from '../../components/common/SearchFilterBar';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { 
  Users, UserPlus, Star, CheckCircle, XCircle, Eye, Edit, Power, Building2, Phone, Mail 
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
      await vendorApi.approveVendor(id);
      showToast('Vendor registration approved successfully', 'success');
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
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || v.status === statusFilter;
    const matchesCategory = !categoryFilter || v.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = Array.from(new Set(vendors.map(v => v.category)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-primary-600" />
            Vendor Directory & Onboarding
          </h1>
          <p className="text-xs text-slate-500 mt-1">Manage vendor requests, profiles, and performance ratings</p>
        </div>

        <button
          onClick={() => { resetForm(); setIsAddModalOpen(true); }}
          className="px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-primary-600/20 transition-smooth flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Vendor Manually</span>
        </button>
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
                  <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
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
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {v.status === 'Pending' ? (
                          <>
                            <button
                              onClick={() => handleApprove(v.id)}
                              className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors"
                              title="Approve Registration"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => setRejectDialog({ open: true, vendorId: v.id })}
                              className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors"
                              title="Reject Registration"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => navigate(`/manager/vendors/${v.id}`)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                              title="View Detail Page"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(v)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                              title="Edit Vendor"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {v.status === 'Approved' && (
                              <button
                                onClick={() => handleDeactivate(v.id)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                                title="Deactivate Vendor"
                              >
                                <Power className="w-4 h-4" />
                              </button>
                            )}
                          </>
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
              <label className="block font-semibold text-slate-700 mb-1">Company Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Person</label>
              <input
                type="text"
                required
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
    </div>
  );
};
