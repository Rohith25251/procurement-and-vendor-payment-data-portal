import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Lock, Mail, ArrowRight,
  Building2, KeyRound, ArrowLeft, Zap, UserPlus
} from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password', 'warning');
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      showToast(`Welcome back, ${loggedUser.name}!`, 'success');
      if (loggedUser.role === 'manager') {
        navigate('/manager/dashboard');
      } else {
        navigate('/vendor/dashboard');
      }
    } catch (err) {
      showToast(err.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">

      {/* Background patterns */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage:
              'radial-gradient(#10b981 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Back to Home */}
      <div className="relative z-10 p-5">
        <button
          id="back-to-home-btn"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-600 text-sm font-semibold transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </div>

      {/* Main centered content */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 pb-8 relative z-10">
        <div className="w-full max-w-md">

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
              Enterprise Procurement &amp; Vendor Portal
            </div>
          </div>

          {/* Card */}
          <div className="bg-white/90 backdrop-blur-xl p-7 sm:p-8 rounded-3xl border border-slate-200 shadow-2xl shadow-slate-200/60">

            {/* Card header */}
            <div className="flex items-center gap-2.5 mb-7">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Sign In to Your Workspace</h2>
                <p className="text-xs text-slate-500 mt-0.5">Enter your credentials to continue</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email / Org ID */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Work Email Address or Organization ID
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="login-email-input"
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com or Organization ID (e.g. org_123...)"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400
                               focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500
                               hover:border-slate-300 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="login-password-input"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400
                               focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500
                               hover:border-slate-300 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400
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
                    Authenticating...
                  </span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Sign-Up Links */}
            <div className="mt-5 pt-5 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500 mb-2">New here? Apply for workspace access</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  id="goto-org-signup-btn"
                  onClick={() => navigate('/organization/signup')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-50 hover:bg-primary-100
                             border border-primary-200 text-primary-700 text-xs font-bold transition-all duration-200"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Register Organization
                </button>
                <button
                  id="goto-vendor-signup-btn"
                  onClick={() => navigate('/vendor/signup')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100
                             border border-emerald-200 text-emerald-700 text-xs font-bold transition-all duration-200"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Register Vendor
                </button>
              </div>
            </div>

          </div>

          <p className="text-center text-xs text-slate-500 mt-6">
            ProcureHub B2B Enterprise System • Protected by AES-256 Encryption
          </p>
        </div>
      </div>
    </div>
  );
};
