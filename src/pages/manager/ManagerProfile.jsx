import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  User, Mail, Lock, KeyRound, Save, ShieldCheck, Building2, CheckCircle2 
} from 'lucide-react';

export const ManagerProfile = () => {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || 'Strategic Sourcing & Operations',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      await updateProfile({
        name: formData.name,
        email: formData.email,
        department: formData.department,
        password: formData.newPassword ? formData.newPassword : undefined
      });

      showToast('Profile credentials and login settings updated successfully!', 'success');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (err) {
      showToast('Failed to update credentials', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <User className="w-7 h-7 text-primary-600" />
          Manager Profile & Security Credentials
        </h1>
        <p className="text-xs text-slate-500 mt-1">Manage your account information, work department, login email ID, and password</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal & Department Info Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-soft space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
            <Building2 className="w-5 h-5 text-primary-600" />
            Executive Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department / Division *</label>
              <input
                type="text"
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Security & Login Credentials Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-soft space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
            <KeyRound className="w-5 h-5 text-primary-600" />
            Login Credentials & Password
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Login Email ID <span className="text-slate-400 font-normal">(Used for authentication)</span> *
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

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl shadow-lg shadow-primary-600/30 transition-smooth flex items-center gap-2 text-xs"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Updating Credentials...' : 'Save Profile & Login Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
