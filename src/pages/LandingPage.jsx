import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, ShieldCheck, Zap, BarChart3, PackageCheck,
  CreditCard, FileText, Users, ArrowRight, CheckCircle2,
  Globe2, Lock, TrendingUp, ChevronRight, ShoppingCart
} from 'lucide-react';

const STATS = [
  { value: '99.9%', label: 'System Uptime' },
  { value: '₹20,000 Cr+', label: 'Payments Processed' },
  { value: '12,000+', label: 'Active Vendors' },
  { value: '48hrs', label: 'Avg. PO Cycle Time' },
];

const FEATURES = [
  {
    icon: PackageCheck,
    title: 'Smart Procurement',
    desc: 'Issue purchase orders from vendor catalogs instantly. Track every PO through a 9-stage lifecycle with real-time status updates.',
    color: 'emerald',
  },
  {
    icon: FileText,
    title: 'Invoice Management',
    desc: 'Automated duplicate detection, line-item verification, and multi-currency support. Vendors submit; managers verify in one click.',
    color: 'cyan',
  },
  {
    icon: CreditCard,
    title: 'Flexible Payments',
    desc: 'Disburse partial or full payments with complete audit trails. Vendors acknowledge receipts directly in the portal.',
    color: 'violet',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    desc: 'Visualize spend trends, category distributions, and vendor performance with interactive Recharts dashboards.',
    color: 'amber',
  },
  {
    icon: Users,
    title: 'Vendor Directory',
    desc: 'Browse vendor product catalogs, compare offerings, and place orders directly from a vendor\'s product page.',
    color: 'rose',
  },
  {
    icon: Lock,
    title: 'Role-Based Access',
    desc: 'Strict Manager & Vendor role separation. Managers control PO approvals; vendors manage their catalog and invoices.',
    color: 'slate',
  },
];

const colorMap = {
  emerald: 'from-emerald-50 to-emerald-100/50 border-emerald-200 text-emerald-700',
  cyan:    'from-cyan-50 to-cyan-100/50 border-cyan-200 text-cyan-700',
  violet:  'from-violet-50 to-violet-100/50 border-violet-200 text-violet-700',
  amber:   'from-amber-50 to-amber-100/50 border-amber-200 text-amber-700',
  rose:    'from-rose-50 to-rose-100/50 border-rose-200 text-rose-700',
  slate:   'from-slate-50 to-slate-100/50 border-slate-200 text-slate-700',
};

const iconBgMap = {
  emerald: 'bg-emerald-100 text-emerald-600',
  cyan:    'bg-cyan-100 text-cyan-600',
  violet:  'bg-violet-100 text-violet-600',
  amber:   'bg-amber-100 text-amber-600',
  rose:    'bg-rose-100 text-rose-600',
  slate:   'bg-slate-200 text-slate-600',
};

/* Animated counter hook */
function useCounter(target, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    const num = parseFloat(target.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) { setCount(target); return; }
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const prefix = target.match(/^\D*/)?.[0] || '';
      const suffix = target.match(/\D+$/)?.[0] || '';
      const decimals = (target.match(/\.(\d+)/) || [])[1]?.length || 0;
      setCount(`${prefix}${(eased * num).toFixed(decimals)}${suffix}`);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

function StatItem({ value, label, started }) {
  const animated = useCounter(value, 1600, started);
  return (
    <div className="text-center">
      <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">{animated || value}</div>
      <div className="text-xs sm:text-sm text-slate-500 font-medium mt-1">{label}</div>
    </div>
  );
}

export const LandingPage = () => {
  const navigate = useNavigate();
  const statsRef = useRef(null);
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md shadow-emerald-200">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight">
              Procure<span className="text-emerald-600">Hub</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              id="nav-login-btn"
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-emerald-600 font-semibold text-sm transition-all duration-200"
            >
              Sign In
            </button>
            <button
              id="nav-get-started-btn"
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-sm shadow-md shadow-emerald-200 transition-all duration-200 flex items-center gap-1.5"
            >
              Get Started
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-24 pb-20">
        {/* Background patterns */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-emerald-100/50 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-cyan-100/50 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-200/40 rounded-full blur-3xl" />
          {/* Grid lines */}
          <div
            className="absolute inset-0 opacity-[0.4]"
            style={{
              backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="relative z-10 text-center max-w-5xl mx-auto">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-8">
            <Zap className="w-3 h-3" />
            Enterprise B2B Procurement Platform
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] mb-6 text-slate-900">
            Streamline Your
            <br />
            <span className="bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
              Vendor Payments
            </span>
            <br />
            End-to-End
          </h1>

          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            ProcureHub connects procurement managers and vendors in a single platform — 
            from purchase order issuance to invoice verification and final payment disbursement.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="hero-login-btn"
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-2xl shadow-xl shadow-emerald-200 transition-all duration-200 flex items-center justify-center gap-2 text-base"
            >
              Access the Portal
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            {['AES-256 Encrypted', 'Role-Based Access Control', 'Real-Time Audit Trail', 'Multi-Vendor Support'].map(t => (
              <div key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section ref={statsRef} className="py-16 border-y border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10">
          {STATS.map(s => (
            <StatItem key={s.label} value={s.value} label={s.label} started={statsVisible} />
          ))}
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-widest mb-5">
              <Globe2 className="w-3 h-3" />
              Platform Features
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900">
              Everything You Need, <br />
              <span className="text-emerald-600">Built In One Place</span>
            </h2>
            <p className="text-slate-600 text-base mt-4 max-w-xl mx-auto">
              A full-featured procurement portal for both managers and vendors — no emails, no spreadsheets.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className={`relative p-6 rounded-2xl bg-gradient-to-br ${colorMap[f.color]} border hover:scale-[1.02] hover:shadow-lg transition-all duration-200 group bg-white`}
                >
                  <div className={`inline-flex p-3 rounded-xl mb-4 ${iconBgMap[f.color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-6 bg-slate-100/50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-widest mb-5">
            <TrendingUp className="w-3 h-3" />
            Procurement Lifecycle
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">
            From Request to Payment in <span className="text-emerald-600">4 Simple Steps</span>
          </h2>
          <p className="text-slate-600 text-sm mb-14">The entire procurement cycle, tracked and audited automatically.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Create PO', desc: 'Manager selects vendor catalog items and issues a Purchase Order.', icon: ShoppingCart },
              { step: '02', title: 'Vendor Accepts', desc: 'Vendor reviews, accepts or raises queries. Manager approves changes.', icon: PackageCheck },
              { step: '03', title: 'Invoice Submitted', desc: 'Vendor submits tax invoice. Manager verifies line items and amounts.', icon: FileText },
              { step: '04', title: 'Payment Released', desc: 'Manager disburses payment. Vendor acknowledges receipt in portal.', icon: CreditCard },
            ].map((s, i, arr) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="relative flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-emerald-100 flex items-center justify-center mb-4 relative z-10">
                    <Icon className="w-6 h-6 text-emerald-500" />
                  </div>
                  {i < arr.length - 1 && (
                    <div className="hidden lg:block absolute top-7 left-full w-full h-px bg-gradient-to-r from-emerald-200 to-transparent -translate-y-px z-0" />
                  )}
                  <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">{s.step}</div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">{s.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bg-white border border-emerald-100 p-10 sm:p-14 text-center shadow-2xl shadow-emerald-100/50">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-50 rounded-full blur-3xl" />
            </div>
            <div className="relative z-10">
              <div className="inline-flex p-4 rounded-2xl bg-emerald-50 border border-emerald-100 mb-6">
                <ShieldCheck className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">
                Ready to Digitise Your<br />Procurement Workflow?
              </h2>
              <p className="text-slate-600 text-sm mb-8 max-w-lg mx-auto">
                Sign in to the ProcureHub portal and experience end-to-end procurement management with role-based access for both managers and vendors.
              </p>
              <button
                id="cta-login-btn"
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 transition-all duration-200 text-base"
              >
                Go to Login
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-200 py-8 px-6 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <Building2 className="w-4 h-4 text-emerald-500" />
            Procure<span className="text-emerald-600">Hub</span>
            <span className="font-normal text-slate-500 ml-1">Enterprise Procurement Portal</span>
          </div>
          <p className="text-xs text-slate-500">© 2025 ProcureHub. All rights reserved. AES-256 Encrypted.</p>
        </div>
      </footer>
    </div>
  );
};
