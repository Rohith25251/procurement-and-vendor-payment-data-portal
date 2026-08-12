import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { useToast } from '../../context/ToastContext';
import {
  Building2, ArrowLeft, Zap, User, Mail, Phone,
  MapPin, FileText, Lock, CheckCircle, ChevronRight,
  Briefcase, Eye, EyeOff, ShieldCheck
} from 'lucide-react';

const INDUSTRIES = [
  'Engineering & Construction',
  'IT & Software Services',
  'Manufacturing & Industrial',
  'Healthcare & Pharmaceuticals',
  'Retail & E-commerce',
  'Logistics & Supply Chain',
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

export const OrganizationSignupPage = () => {
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
    industry: INDUSTRIES[0],
    address: '',
    gstin: '',
    password: '',
    confirmPassword: '',
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const inputCls =
    'w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 hover:border-slate-300 transition-all duration-200';

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
      await authApi.signupOrganization(form);
      setSuccess(true);
    } catch (err) {
      showToast(err.message || 'Organization registration failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ── Success Screen ── */
  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-primary-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 text-center max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Organization Registration Submitted!</h1>
          <p className="text-sm text-slate-500 leading-relaxed mb-8">
            Your organization registration request has been submitted to ProcureHub. Super Admin will verify your company details and approve your account.
          </p>
          <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4 text-left mb-8">
            <p className="text-xs font-bold text-primary-800 mb-1">What happens next?</p>
            <ul className="text-xs text-primary-700 space-y-1 list-disc list-inside">
              <li>Super Admin reviews your company submission</li>
              <li>You will receive an email upon verification approval</li>
              <li>Log in with your registered email &amp; password</li>
            </ul>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold rounded-xl shadow-lg shadow-primary-200/50 transition-all duration-200 hover:from-primary-500 hover:to-primary-400 flex items-center gap-2 mx-auto"
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
      <div className="relative z-10 p-5">
        <button
          onClick={() => navigate('/login')}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-primary-600 text-sm font-semibold transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center px-4 pb-10 relative z-10">
        <div className="w-full max-w-2xl">
          {/* Branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-xl shadow-primary-200 mb-4">
              <Building2 className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Procure<span className="text-primary-600">Hub</span>
            </h1>
            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-[11px] font-bold uppercase tracking-widest">
              <ShieldCheck className="w-3 h-3" />
              Organization Registration Portal
            </div>
          </div>

          {/* Card */}
          <div className="bg-white/90 backdrop-blur-xl p-7 sm:p-8 rounded-3xl border border-slate-200 shadow-2xl shadow-slate-200/60">
            <div className="flex items-center gap-2.5 mb-7">
              <div className="p-2 rounded-lg bg-primary-50 text-primary-600">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Register Your Organization</h2>
                <p className="text-xs text-slate-500 mt-0.5">Fill in your company details to set up your procurement workspace</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-3">Company Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <InputField label="Organization / Company Full Name" icon={Building2} required>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={set('name')}
                        placeholder="e.g. KEC International Ltd"
                        className={inputCls}
                      />
                    </InputField>
                  </div>

                  <InputField label="Industry" icon={Briefcase} required>
                    <select
                      value={form.industry}
                      onChange={set('industry')}
                      className={inputCls + ' appearance-none'}
                    >
                      {INDUSTRIES.map((i) => (
                        <option key={i} value={i}>{i}</option>
                      ))}
                    </select>
                  </InputField>

                  <InputField label="Procurement Manager Name" icon={User} required>
                    <input
                      type="text"
                      required
                      value={form.contactPerson}
                      onChange={set('contactPerson')}
                      placeholder="Full Name"
                      className={inputCls}
                    />
                  </InputField>

                  <InputField label="Official Work Email" icon={Mail} required>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={set('email')}
                      placeholder="procuremanager@company.com"
                      className={inputCls}
                    />
                  </InputField>

                  <InputField label="Phone Number" icon={Phone} required>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={set('phone')}
                      placeholder="+91 98765 43210"
                      className={inputCls}
                    />
                  </InputField>

                  <div className="sm:col-span-2">
                    <InputField label="Company Address" icon={MapPin}>
                      <textarea
                        rows={2}
                        value={form.address}
                        onChange={set('address')}
                        placeholder="Headquarters address, city, state..."
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 hover:border-slate-300 transition-all duration-200 resize-none"
                      />
                    </InputField>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-3">Compliance &amp; Password</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <InputField label="Company GSTIN" icon={FileText} hint="15-digit GST Number">
                      <input
                        type="text"
                        value={form.gstin}
                        onChange={set('gstin')}
                        placeholder="33AAACK1234H1Z5"
                        maxLength={15}
                        className={inputCls + ' uppercase'}
                      />
                    </InputField>
                  </div>

                  <InputField label="Password" icon={Lock} required hint="Min 6 chars">
                    <input
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400
                           text-white font-bold rounded-xl shadow-lg shadow-primary-200/50
                           transition-all duration-200 flex items-center justify-center gap-2 text-sm
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting Registration...' : 'Register Organization'}
                <ChevronRight className="w-4 h-4" />
              </button>

              <p className="text-center text-xs text-slate-400">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-primary-600 font-bold hover:underline"
                >
                  Sign In
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
