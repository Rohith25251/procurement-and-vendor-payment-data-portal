import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../api/authApi';
import { ShieldAlert, Send, Clock, XCircle, Mail, LogOut, CheckCircle } from 'lucide-react';

export const DeactivatedPage = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [explanation, setExplanation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reactivationStatus = user?.reactivationStatus || 'None';
  const deactivationReason = user?.deactivationReason || 'Your account was deactivated by Admin due to suspicious activity.';

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!explanation.trim()) {
      showToast('Please enter an explanation for your reactivation request.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await authApi.submitReactivationRequest(user.id, user.role, explanation);
      showToast('Reactivation request submitted to Super Admin!', 'success');
      // Refresh session / state locally
      window.location.reload();
    } catch (err) {
      showToast('Failed to submit reactivation request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between p-4 sm:p-6 text-slate-100">
      {/* Top Bar */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center font-black text-white text-lg">
            P
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white">ProcureHub</h1>
            <p className="text-[10px] text-slate-400 font-medium">Enterprise Governance Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <span className="block text-xs font-bold text-slate-200">{user?.name}</span>
            <span className="block text-[10px] text-slate-400 font-mono">{user?.email}</span>
          </div>
          <button
            onClick={logout}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl w-full mx-auto my-auto py-8">
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
          {/* Status Badge & Header */}
          <div className="flex items-center gap-4 border-b border-slate-700/60 pb-6">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-8 h-8 text-rose-500" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                Account Status: Deactivated
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">Access Suspended</h2>
            </div>
          </div>

          {/* Reason Box */}
          <div className="p-4 bg-rose-950/40 border border-rose-800/50 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Reason for Deactivation:</span>
            <p className="text-sm font-medium text-rose-200">{deactivationReason}</p>
          </div>

          {/* Conditional Reactivation Panel */}

          {/* CASE A: No Request Submitted Yet */}
          {(reactivationStatus === 'None' || !reactivationStatus) && (
            <form onSubmit={handleSubmitRequest} className="space-y-4 pt-2">
              <div>
                <h3 className="text-sm font-bold text-slate-200">Request Account Reactivation</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  If you believe this deactivation was done in error or you have resolved the issue, explain your request to the Super Admin below.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Explanation / Justification <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Provide detailed explanation and context for the admin review..."
                  className="w-full p-3 bg-slate-900/80 border border-slate-700 rounded-2xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !explanation.trim()}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 disabled:opacity-50 text-slate-950 font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Submitting Request...' : 'Submit Reactivation Request'}</span>
              </button>
            </form>
          )}

          {/* CASE B: Reactivation Request Pending */}
          {reactivationStatus === 'Pending' && (
            <div className="p-5 bg-amber-950/40 border border-amber-700/50 rounded-2xl space-y-3">
              <div className="flex items-center gap-2.5 text-amber-400">
                <Clock className="w-5 h-5 shrink-0 animate-pulse" />
                <h3 className="text-sm font-bold">Reactivation Request Under Review</h3>
              </div>
              <p className="text-xs text-amber-200/90 leading-relaxed">
                ⏳ Your reactivation request has been submitted and is currently under review by Super Admin. Please check back later.
              </p>
              {user?.reactivationReason && (
                <div className="p-3 bg-slate-900/60 rounded-xl text-xs text-slate-300 border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Your Submitted Explanation:</span>
                  <p className="mt-1 font-medium">{user.reactivationReason}</p>
                </div>
              )}
            </div>
          )}

          {/* CASE C: Reactivation Request Declined */}
          {reactivationStatus === 'Declined' && (
            <div className="p-5 bg-rose-950/50 border border-rose-700/60 rounded-2xl space-y-4">
              <div className="flex items-center gap-2.5 text-rose-400">
                <XCircle className="w-6 h-6 shrink-0" />
                <h3 className="text-sm font-extrabold">Reactivation Request Rejected</h3>
              </div>

              <div className="p-4 bg-slate-900/80 border border-rose-900/50 rounded-xl space-y-2 text-xs">
                <p className="text-rose-200 font-bold text-sm">
                  Admin rejected your request for further contact <a href="mailto:admin@procurehub.com" className="text-amber-400 underline font-extrabold">admin@procurehub.com</a>.
                </p>
                <p className="text-slate-400 text-xs">
                  Your appeal was reviewed and declined by Super Admin governance.
                </p>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-4 h-4 text-amber-400" />
                  <span>Support Email:</span>
                </div>
                <a href="mailto:admin@procurehub.com" className="font-mono font-bold text-amber-400 hover:underline">
                  admin@procurehub.com
                </a>
              </div>
            </div>
          )}

          {/* CASE D: Reactivation Request Accepted (Just Restored) */}
          {reactivationStatus === 'Accepted' && (
            <div className="p-5 bg-emerald-950/40 border border-emerald-700/50 rounded-2xl space-y-3 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="text-base font-extrabold text-emerald-300">Account Reactivated!</h3>
              <p className="text-xs text-slate-300">
                Your account has been reactivated by Super Admin. Please re-login to access your portal.
              </p>
              <button
                onClick={logout}
                className="mt-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs"
              >
                Log In Again
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl w-full mx-auto text-center py-4 text-[11px] text-slate-500 border-t border-slate-800">
        © 2026 ProcureHub B2B Enterprise System • Governance & Security Compliance
      </footer>
    </div>
  );
};
