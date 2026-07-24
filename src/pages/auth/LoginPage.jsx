import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  ShieldCheck, UserCheck, Lock, Mail, ArrowRight,
  Building2, KeyRound, ArrowLeft, Zap
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

  const handleQuickLogin = async (userEmail, userPass) => {
    setEmail(userEmail);
    setPassword(userPass);
    setLoading(true);
    try {
      const loggedUser = await login(userEmail, userPass);
      showToast(`Logged in as ${loggedUser.role.toUpperCase()}: ${loggedUser.name}`, 'success');
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
    <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden">

      {/* Background grid + glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-emerald-600/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-cyan-700/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-0 w-64 h-64 bg-emerald-900/20 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #10b981 1px, transparent 1px), linear-gradient(to bottom, #10b981 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Back to Home */}
      <div className="relative z-10 p-5">
        <button
          id="back-to-home-btn"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-400 text-sm font-semibold transition-colors duration-200"
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
            <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-2xl shadow-emerald-900/50 mb-4">
              <Building2 className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Procure<span className="text-emerald-400">Hub</span>
            </h1>
            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-bold uppercase tracking-widest">
              <Zap className="w-3 h-3" />
              Enterprise Procurement &amp; Vendor Portal
            </div>
          </div>

          {/* Card */}
          <div className="bg-slate-900/80 backdrop-blur-xl p-7 sm:p-8 rounded-3xl border border-slate-700/60 shadow-2xl shadow-slate-950">

            {/* Card header */}
            <div className="flex items-center gap-2.5 mb-7">
              <div className="p-2 rounded-lg bg-emerald-500/15">
                <KeyRound className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Sign In to Your Workspace</h2>
                <p className="text-xs text-slate-500 mt-0.5">Enter your credentials to continue</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="login-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder:text-slate-600
                               focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/60
                               hover:border-slate-600 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="login-password-input"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder:text-slate-600
                               focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/60
                               hover:border-slate-600 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400
                           text-white font-bold rounded-xl shadow-lg shadow-emerald-900/40
                           transition-all duration-200 flex items-center justify-center gap-2 text-sm
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
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

            {/* Quick Demo Login */}
            <div className="mt-7 pt-6 border-t border-slate-800">
              <p className="text-[11px] font-bold text-slate-500 text-center uppercase tracking-widest mb-3">
                Demo Quick-Login
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  id="quick-login-manager-btn"
                  onClick={() => handleQuickLogin('manager@procurehub.com', 'password123')}
                  disabled={loading}
                  className="p-3.5 bg-slate-950/60 hover:bg-slate-800/60 border border-slate-700/60 hover:border-emerald-500/40 rounded-2xl text-left transition-all duration-200 group disabled:opacity-50"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 group-hover:text-emerald-300">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Manager Role</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 truncate font-medium">Eleanor Vance</p>
                  <span className="text-[10px] text-slate-600">Full Access</span>
                </button>

                <button
                  id="quick-login-vendor-btn"
                  onClick={() => handleQuickLogin('vendor@techparts.com', 'password123')}
                  disabled={loading}
                  className="p-3.5 bg-slate-950/60 hover:bg-slate-800/60 border border-slate-700/60 hover:border-cyan-500/40 rounded-2xl text-left transition-all duration-200 group disabled:opacity-50"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 group-hover:text-cyan-300">
                    <UserCheck className="w-4 h-4 shrink-0" />
                    <span>Vendor Role</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 truncate font-medium">Apex Metal</p>
                  <span className="text-[10px] text-slate-600">Vendor Portal</span>
                </button>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-600 mt-6">
            ProcureHub B2B Enterprise System • Protected by AES-256 Encryption
          </p>
        </div>
      </div>
    </div>
  );
};
