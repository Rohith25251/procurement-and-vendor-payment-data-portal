import React, { useState, useEffect } from 'react';
import { vendorApi } from '../../api/vendorApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../supabaseClient';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';
import { 
  Building2, Mail, Phone, MapPin, ShieldCheck, Upload, FileText, Save, KeyRound, Lock 
} from 'lucide-react';

export const VendorProfile = () => {
  const { user, updateProfile } = useAuth();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { showToast } = useToast();

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('File size must be under 2MB', 'warning');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatars/${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
      const publicUrl = publicUrlData.publicUrl;

      await updateProfile({ avatar: publicUrl });
      showToast('Profile picture updated successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to upload profile picture', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setUploading(true);
    try {
      await updateProfile({ avatar: null });
      showToast('Profile picture removed', 'success');
    } catch (err) {
      showToast('Failed to remove profile picture', 'error');
    } finally {
      setUploading(false);
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: user?.email || '',
    phone: '',
    gstin: '',
    pan: '',
    address: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branch: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [documents, setDocuments] = useState([]);
  const [newDocName, setNewDocName] = useState('');
  const [newDocType, setNewDocType] = useState('Compliance');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const v = await vendorApi.getVendorById(user.vendorId || 'vnd_apex_01');
        setVendor(v);
        setFormData({
          name: v.name || '',
          contactPerson: v.contactPerson || '',
          email: user.email || v.email || '',
          phone: v.phone || '',
          gstin: v.gstin || '',
          pan: v.pan || '',
          address: v.address || '',
          bankName: v.bankDetails?.bankName || '',
          accountNumber: v.bankDetails?.accountNumber || '',
          ifscCode: v.bankDetails?.ifscCode || '',
          branch: v.bankDetails?.branch || '',
          newPassword: '',
          confirmPassword: ''
        });
        setDocuments(v.documents || []);
      } catch (err) {
        showToast('Failed to load profile', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vendor) return;

    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        showToast('New password and confirmation do not match', 'warning');
        return;
      }
      if (formData.newPassword.length < 6) {
        showToast('Password must be at least 6 characters long', 'warning');
        return;
      }
    }

    setSaving(true);
    try {
      // Update vendor company details
      await vendorApi.updateVendor(vendor.id, {
        name: formData.name,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        gstin: formData.gstin,
        pan: formData.pan,
        address: formData.address,
        bankDetails: {
          accountName: formData.name,
          accountNumber: formData.accountNumber,
          bankName: formData.bankName,
          ifscCode: formData.ifscCode,
          branch: formData.branch
        },
        documents
      });

      // Update user login credentials
      await updateProfile({
        name: formData.name,
        email: formData.email,
        password: formData.newPassword ? formData.newPassword : undefined
      });

      showToast('Vendor profile & login credentials updated successfully!', 'success');
      setFormData(prev => ({
        ...prev,
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (err) {
      showToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadDoc = (e) => {
    e.preventDefault();
    if (!newDocName.trim()) {
      showToast('Please type document name', 'warning');
      return;
    }

    const newDoc = {
      id: `doc_${Date.now()}`,
      name: newDocName.endsWith('.pdf') ? newDocName : `${newDocName}.pdf`,
      type: newDocType,
      uploadDate: new Date().toISOString().split('T')[0],
      status: 'Verified'
    };

    const updated = [...documents, newDoc];
    setDocuments(updated);
    setNewDocName('');
    showToast('Mock document uploaded & appended to vault!', 'success');
  };

  if (loading) return <TableSkeleton rows={5} cols={4} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Building2 className="w-7 h-7 text-emerald-600" />
          Vendor Company Profile & Credentials
        </h1>
        <p className="text-xs text-slate-500 mt-1">Maintain your business information, bank settlement details, login email ID, and password</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Picture Upload Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-soft flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-24 h-24 rounded-3xl object-cover ring-4 ring-emerald-600/10 shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center font-black text-3xl text-white bg-emerald-600 ring-4 ring-emerald-600/10 shadow-md">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'V'}
              </div>
            )}
          </div>
          <div className="text-center sm:text-left space-y-2">
            <h4 className="text-sm font-bold text-slate-800">Profile Display Picture</h4>
            <p className="text-xs text-slate-400">Upload a company logo or display image (JPG, PNG, max 2MB)</p>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <label className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition-colors flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>{uploading ? 'Uploading...' : 'Choose Image'}</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
              {user?.avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl text-xs transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-soft space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
            <Building2 className="w-5 h-5 text-emerald-600" />
            General Business Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company Registered Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Primary Contact Person *</label>
              <input
                type="text"
                required
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">GSTIN Number</label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">PAN Number</label>
              <input
                type="text"
                value={formData.pan}
                onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Operating Registered Address</label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Security & Login Credentials Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-soft space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
            <KeyRound className="w-5 h-5 text-emerald-600" />
            Login Credentials & Security Settings
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Login Email ID <span className="text-slate-400 font-normal">(Used for vendor portal authentication)</span> *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border rounded-xl font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-800 mb-3">Change Account Password</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      placeholder="Leave blank to keep unchanged"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      placeholder="Re-enter new password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bank Settlement Details */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-soft space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Bank Settlement & Remittance Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Bank Name</label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Account Number</label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">IFSC / SWIFT Code</label>
              <input
                type="text"
                value={formData.ifscCode}
                onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono uppercase"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Branch Location</label>
              <input
                type="text"
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Submit Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-smooth flex items-center gap-2 text-xs"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Profile & Login Changes'}</span>
          </button>
        </div>
      </form>

      {/* Document Upload Vault Section */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-soft space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
          <Upload className="w-5 h-5 text-emerald-600" />
          Document Upload Vault
        </h3>

        <form onSubmit={handleUploadDoc} className="flex flex-col sm:flex-row gap-3 items-end text-xs bg-slate-50 p-4 rounded-2xl border">
          <div className="flex-1 w-full">
            <label className="block font-semibold text-slate-700 mb-1">Document Title / Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Tax_Exemption_Form_2026.pdf"
              value={newDocName}
              onChange={(e) => setNewDocName(e.target.value)}
              className="w-full p-2.5 bg-white border rounded-xl"
            />
          </div>

          <div className="w-full sm:w-48">
            <label className="block font-semibold text-slate-700 mb-1">Doc Type</label>
            <select
              value={newDocType}
              onChange={(e) => setNewDocType(e.target.value)}
              className="w-full p-2.5 bg-white border rounded-xl font-medium"
            >
              <option value="Compliance">Compliance</option>
              <option value="Tax Document">Tax Document</option>
              <option value="Financial">Financial</option>
              <option value="License">License / Permit</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center gap-1.5 shrink-0"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </form>

        <div className="space-y-2 pt-2">
          {documents.map((doc) => (
            <div key={doc.id} className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="font-bold text-slate-900">{doc.name}</p>
                  <p className="text-[10px] text-slate-500">{doc.type} • Uploaded {doc.uploadDate}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                ✓ Verified
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
