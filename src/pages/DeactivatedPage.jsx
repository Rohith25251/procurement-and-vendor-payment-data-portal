import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../api/authApi';
import { ShieldAlert, Send, Clock, XCircle, Mail, LogOut, CheckCircle, AlertTriangle } from 'lucide-react';

export const DeactivatedPage = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [explanation, setExplanation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentUserData, setCurrentUserData] = useState(user);

  useEffect(() => {
    const refreshStatus = async () => {
      try {
        const session = await authApi.getCurrentSession();
        if (session?.user) {
          setCurrentUserData(session.user);
        }
      } catch (e) {}
    };
    refreshStatus();
  }, []);

  const reactivationStatus = currentUserData?.reactivationStatus || user?.reactivationStatus || 'None';
  const deactivationReason = currentUserData?.deactivationReason || user?.deactivationReason || 'Your account was deactivated by Admin due to suspicious activity.';

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
      const updatedSession = await authApi.getCurrentSession();
      if (updatedSession?.user) {
        setCurrentUserData(updatedSession.user);
      } else {
        window.location.reload();
      }
    } catch (err) {
      showToast('Failed to submit reactivation request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 text-slate-800 font-sans">
      {/* Top Header Navigation */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary-600 flex items-center justify-center font-black text-white text-xl shadow-md shadow-primary-600/30">
            P
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-slate-900">ProcureHub</h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Enterprise Governance Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <span className="block text-xs font-bold text-slate-900">{user?.name}</span>
            <span className="block text-[10px] text-slate-500 font-mono">{user?.email}</span>
          </div>
          <button
            onClick={logout}
            className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-slate-200 shadow-xs transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-2xl w-full mx-auto my-auto py-8">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">
          {/* Status Badge & Header */}
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0 shadow-xs">
              <ShieldAlert className="w-8 h-8 text-rose-600" />
            </div>
            <div>
              <span className="px-3 py-1 bg-rose-100 text-rose-700 border border-rose-200 rounded-full text-[11px] font-extrabold uppercase tracking-wider">
                Account Status: Deactivated
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1.5">Access Suspended</h2>
            </div>
          </div>

          {/* Prominent Deactivation Reason Box */}
          <div className="p-5 bg-rose-50/90 border border-rose-200 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-1.5 text-rose-800 font-extrabold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Reason for Deactivation:</span>
            </div>
            <p className="text-sm font-bold text-rose-950 leading-relaxed pl-5">
              "{deactivationReason}"
            </p>
          </div>

          {/* Conditional Reactivation Appeal Panels */}

          {/* CASE A: No Request Submitted Yet */}
          {(reactivationStatus === 'None' || !reactivationStatus) && (
            <form onSubmit={handleSubmitRequest} className="space-y-4 pt-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Request Account Reactivation</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  If you believe this deactivation was done in error or you have resolved the issue, submit an explanation to the Super Admin below.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Explanation / Appeal Justification <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Provide detailed explanation and context for the Super Admin review..."
                  className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white resize-none font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !explanation.trim()}
                className="w-full py-3.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Submitting Request...' : 'Submit Reactivation Request'}</span>
              </button>
            </form>
          )}

          {/* CASE B: Reactivation Request Pending */}
          {reactivationStatus === 'Pending' && (
            <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-amber-800 font-extrabold text-sm">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 animate-pulse" />
                <h3>Reactivation Appeal Under Review</h3>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed font-semibold">
                ⏳ Your reactivation appeal request has been submitted to Super Admin and is currently under review.
              </p>
              {(currentUserData?.reactivationReason || user?.reactivationReason) && (
                <div className="p-3 bg-white rounded-xl text-xs text-slate-700 border border-amber-200/80">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Your Submitted Explanation:</span>
                  <p className="mt-1 font-medium italic">"{currentUserData?.reactivationReason || user?.reactivationReason}"</p>
                </div>
              )}
            </div>
          )}

          {/* CASE C: Reactivation Request Declined */}
          {reactivationStatus === 'Declined' && (
            <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-rose-800 font-extrabold text-sm">
                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <h3>Reactivation Request Rejected</h3>
              </div>

              <div className="p-4 bg-white border border-rose-200 rounded-xl space-y-2 text-xs">
                <p className="text-rose-950 font-extrabold text-sm">
                  Admin rejected your request for further contact <a href="mailto:admin@procurehub.com" className="text-primary-600 underline font-black">admin@procurehub.com</a>.
                </p>
                <p className="text-slate-600 text-xs">
                  Your appeal was reviewed and declined by Super Admin governance.
                </p>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-2 text-slate-700 font-semibold">
                  <Mail className="w-4 h-4 text-primary-600" />
                  <span>Support Email:</span>
                </div>
                <a href="mailto:admin@procurehub.com" className="font-mono font-extrabold text-primary-600 hover:underline">
                  admin@procurehub.com
                </a>
              </div>
            </div>
          )}

          {/* CASE D: Reactivation Request Accepted */}
          {reactivationStatus === 'Accepted' && (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="text-base font-extrabold text-emerald-900">Account Reactivated!</h3>
              <p className="text-xs text-slate-700">
                Your account has been reactivated by Super Admin. Please re-login to access your portal.
              </p>
              <button
                onClick={logout}
                className="mt-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md"
              >
                Log In Again
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl w-full mx-auto text-center py-4 text-[11px] text-slate-500 border-t border-slate-200">
        © 2026 ProcureHub B2B Enterprise System • Governance & Security Compliance
      </footer>
    </div>
  );
};
