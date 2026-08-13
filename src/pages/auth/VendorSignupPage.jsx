import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { vendorApi } from '../../api/vendorApi';
import { useToast } from '../../context/ToastContext';
import {
  Building2, ArrowLeft, Zap, User, Mail, Phone,
  MapPin, FileText, Lock, CheckCircle, ChevronRight,
  Briefcase, Eye, EyeOff
} from 'lucide-react';

const CATEGORIES = [
  'Hardware & Raw Materials',
  'IT & Software Services',
  'Facilities & Operations',
  'Packaging & Materials',
  'Logistics & Transport',
];

const InputField = ({ label, icon: Icon, required, children, hint }) => (
  <div>
    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      )}
      {children}
    </div>
    {hint && <p className="text-[10px] text-slate-400 mt-1">{hint}</p>}
  </div>
);

export const VendorSignupPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    category: CATEGORIES[0],
    address: '',
    gstin: '',
    pan: '',
    password: '',
    confirmPassword: '',
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const inputCls =
    'w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 hover:border-slate-300 transition-all duration-200';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.contactPerson || !form.email || !form.phone || !form.password) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }
    if (form.password.length < 6) {
      showToast('Password must be at least 6 characters', 'warning');
      return;
    }
    if (form.password !== form.confirmPassword) {
      showToast('Passwords do not match', 'warning');
      return;
    }

    setLoading(true);
    try {
      await vendorApi.signupVendor(form);
      setSuccess(true);
    } catch (err) {
      showToast(err.message || 'Registration failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ── Success Screen ── */
  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.4]"
            style={{ backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)', backgroundSize: '40px 40px' }}
          />
        </div>

        <div className="relative z-10 text-center max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Registration Successful!</h1>
          <p className="text-sm text-slate-500 leading-relaxed mb-8">
            Your vendor registration has been completed successfully. You can now log in to the website
            and start listing your products and managing orders immediately.
          </p>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-left mb-8">
            <p className="text-xs font-bold text-emerald-800 mb-1">Getting Started:</p>
            <ul className="text-xs text-emerald-700 space-y-1 list-disc list-inside">
              <li>Log in with your registered email &amp; password</li>
              <li>Set up your product catalog</li>
              <li>Configure your payment settings</li>
            </ul>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-200/50 transition-all duration-200 hover:from-emerald-500 hover:to-emerald-400 flex items-center gap-2 mx-auto"
          >
            Go to Login
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  /* ── Signup Form ── */
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{ backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
      </div>

      {/* Back */}
      <div className="relative z-10 p-5">
        <button
          id="signup-back-btn"
          onClick={() => navigate('/login')}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-600 text-sm font-semibold transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </button>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 pb-10 relative z-10">
        <div className="w-full max-w-2xl">

          {/* Branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-xl shadow-emerald-200 mb-4">
              <Building2 className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Procure<span className="text-emerald-600">Hub</span>
            </h1>
            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] font-bold uppercase tracking-widest">
              <Zap className="w-3 h-3" />
              Vendor Registration Portal
            </div>
          </div>

          {/* Card */}
          <div className="bg-white/90 backdrop-blur-xl p-7 sm:p-8 rounded-3xl border border-slate-200 shadow-2xl shadow-slate-200/60">

            <div className="flex items-center gap-2.5 mb-7">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Register as a Vendor</h2>
                <p className="text-xs text-slate-500 mt-0.5">Fill in your business details to apply for vendor access</p>
              </div>
            </div>

            <form id="vendor-signup-form" onSubmit={handleSubmit} className="space-y-5">

              {/* Section: Business Info */}
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-3">Business Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <div className="sm:col-span-2">
                    <InputField label="Company Full Name" icon={Building2} required>
                      <input
                        id="signup-company-name"
                        type="text"
                        required
                        value={form.name}
                        onChange={set('name')}
                        placeholder="e.g. Apex Metal Components Pvt Ltd"
                        className={inputCls}
                      />
                    </InputField>
                  </div>

                  <InputField label="Category" icon={Briefcase} required>
                    <select
                      id="signup-category"
                      value={form.category}
                      onChange={set('category')}
                      className={inputCls + ' appearance-none'}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </InputField>

                  <InputField label="Contact Person" icon={User} required>
                    <input
                      id="signup-contact-person"
                      type="text"
                      required
                      value={form.contactPerson}
                      onChange={set('contactPerson')}
                      placeholder="Full name"
                      className={inputCls}
                    />
                  </InputField>

                  <InputField label="Business Email" icon={Mail} required>
                    <input
                      id="signup-email"
                      type="email"
                      required
                      value={form.email}
                      onChange={set('email')}
                      placeholder="vendor@company.com"
                      className={inputCls}
                    />
                  </InputField>

                  <InputField label="Phone Number" icon={Phone} required>
                    <input
                      id="signup-phone"
                      type="tel"
                      required
                      value={form.phone}
                      onChange={set('phone')}
                      placeholder="+91 98765 43210"
                      className={inputCls}
                    />
                  </InputField>

                  <div className="sm:col-span-2">
                    <InputField label="Business Address" icon={MapPin}>
                      <textarea
                        id="signup-address"
                        rows={2}
                        value={form.address}
                        onChange={set('address')}
                        placeholder="Street address, city, state, country..."
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 hover:border-slate-300 transition-all duration-200 resize-none"
                      />
                    </InputField>
                  </div>
                </div>
              </div>

              {/* Section: Tax & Compliance */}
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-3">Tax & Compliance <span className="normal-case font-normal text-slate-300">(optional)</span></p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="GSTIN" icon={FileText} hint="15-digit GST Identification Number">
                    <input
                      id="signup-gstin"
                      type="text"
                      value={form.gstin}
                      onChange={set('gstin')}
                      placeholder="27AAACA12341Z5"
                      maxLength={15}
                      className={inputCls + ' uppercase'}
                    />
                  </InputField>

                  <InputField label="PAN" icon={FileText} hint="10-character Permanent Account Number">
                    <input
                      id="signup-pan"
                      type="text"
                      value={form.pan}
                      onChange={set('pan')}
                      placeholder="AAACA1234A"
                      maxLength={10}
                      className={inputCls + ' uppercase'}
                    />
                  </InputField>
                </div>
              </div>

              {/* Section: Login Credentials */}
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-3">Login Credentials</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Password" icon={Lock} required hint="Min. 6 characters">
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={form.password}
                      onChange={set('password')}
                      placeholder="••••••••"
                      className={inputCls + ' pr-10'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </InputField>

                  <InputField label="Confirm Password" icon={Lock} required>
                    <input
                      id="signup-confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      required
                      value={form.confirmPassword}
                      onChange={set('confirmPassword')}
                      placeholder="••••••••"
                      className={inputCls + ' pr-10'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </InputField>
                </div>
              </div>

              {/* Notice */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex gap-2.5">
                <Zap className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Registration is instant. Once submitted, you can log in to the Vendor Portal immediately using your email and password.
                </p>
              </div>

              {/* Submit */}
              <button
                id="signup-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400
                           text-white font-bold rounded-xl shadow-lg shadow-emerald-200/50
                           transition-all duration-200 flex items-center justify-center gap-2 text-sm
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting Registration...
                  </span>
                ) : (
                  <>
                    <span>Submit Registration</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-slate-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-emerald-600 font-bold hover:underline"
                >
                  Sign In
                </button>
              </p>
            </form>
          </div>

          <p className="text-center text-xs text-slate-500 mt-6">
            ProcureHub B2B Enterprise System • Protected by AES-256 Encryption
          </p>
        </div>
      </div>
    </div>
  );
};
