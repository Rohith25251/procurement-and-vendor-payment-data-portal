import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, ShieldCheck, Zap, BarChart3, PackageCheck,
  CreditCard, FileText, Users, ArrowRight, CheckCircle2,
  Globe2, Lock, TrendingUp, ChevronRight, ShoppingCart
} from 'lucide-react';

const STATS = [
  { value: '99.9%', label: 'System Uptime' },
  { value: '$2.4B+', label: 'Payments Processed' },
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
  emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30 text-emerald-400',
  cyan:    'from-cyan-500/20 to-cyan-600/5 border-cyan-500/30 text-cyan-400',
  violet:  'from-violet-500/20 to-violet-600/5 border-violet-500/30 text-violet-400',
  amber:   'from-amber-500/20 to-amber-600/5 border-amber-500/30 text-amber-400',
  rose:    'from-rose-500/20 to-rose-600/5 border-rose-500/30 text-rose-400',
  slate:   'from-slate-500/20 to-slate-600/5 border-slate-500/30 text-slate-400',
};

const iconBgMap = {
  emerald: 'bg-emerald-500/15 text-emerald-400',
  cyan:    'bg-cyan-500/15 text-cyan-400',
  violet:  'bg-violet-500/15 text-violet-400',
  amber:   'bg-amber-500/15 text-amber-400',
  rose:    'bg-rose-500/15 text-rose-400',
  slate:   'bg-slate-500/15 text-slate-400',
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
      <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">{animated || value}</div>
      <div className="text-xs sm:text-sm text-slate-400 font-medium mt-1">{label}</div>
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
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/60 backdrop-blur-md bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-900/40">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight">
              Procure<span className="text-emerald-400">Hub</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              id="nav-login-btn"
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 rounded-xl border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 font-semibold text-sm transition-all duration-200"
            >
              Sign In
            </button>
            <button
              id="nav-get-started-btn"
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-sm shadow-lg shadow-emerald-900/40 transition-all duration-200 flex items-center gap-1.5"
            >
              Get Started
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-24 pb-20">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-emerald-600/8 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-cyan-600/12 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-900/30 rounded-full blur-3xl" />
          {/* Grid lines */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'linear-gradient(to right, #10b981 1px, transparent 1px), linear-gradient(to bottom, #10b981 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="relative z-10 text-center max-w-5xl mx-auto">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-8">
            <Zap className="w-3 h-3" />
            Enterprise B2B Procurement Platform
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] mb-6">
            Streamline Your
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-cyan-400 bg-clip-text text-transparent">
              Vendor Payments
            </span>
            <br />
            End-to-End
          </h1>

          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            ProcureHub connects procurement managers and vendors in a single platform — 
            from purchase order issuance to invoice verification and final payment disbursement.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="hero-login-btn"
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-2xl shadow-xl shadow-emerald-900/50 transition-all duration-200 flex items-center justify-center gap-2 text-base"
            >
              Access the Portal
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              id="hero-demo-btn"
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-4 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white font-semibold rounded-2xl transition-all duration-200 text-base"
            >
              View Demo Credentials
            </button>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            {['AES-256 Encrypted', 'Role-Based Access Control', 'Real-Time Audit Trail', 'Multi-Vendor Support'].map(t => (
              <div key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section ref={statsRef} className="py-16 border-y border-slate-800/60 bg-slate-900/40">
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
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/60 border border-slate-700 text-slate-400 text-xs font-bold uppercase tracking-widest mb-5">
              <Globe2 className="w-3 h-3" />
              Platform Features
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
              Everything You Need, <br />
              <span className="text-emerald-400">Built In One Place</span>
            </h2>
            <p className="text-slate-400 text-base mt-4 max-w-xl mx-auto">
              A full-featured procurement portal for both managers and vendors — no emails, no spreadsheets.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className={`relative p-6 rounded-2xl bg-gradient-to-br ${colorMap[f.color]} border backdrop-blur-sm hover:scale-[1.02] transition-transform duration-200 group`}
                >
                  <div className={`inline-flex p-3 rounded-xl mb-4 ${iconBgMap[f.color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-6 bg-slate-900/30">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/60 border border-slate-700 text-slate-400 text-xs font-bold uppercase tracking-widest mb-5">
            <TrendingUp className="w-3 h-3" />
            Procurement Lifecycle
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            From Request to Payment in <span className="text-emerald-400">4 Simple Steps</span>
          </h2>
          <p className="text-slate-400 text-sm mb-14">The entire procurement cycle, tracked and audited automatically.</p>

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
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 relative z-10">
                    <Icon className="w-6 h-6 text-emerald-400" />
                  </div>
                  {i < arr.length - 1 && (
                    <div className="hidden lg:block absolute top-7 left-full w-full h-px bg-gradient-to-r from-emerald-500/40 to-transparent -translate-y-px z-0" />
                  )}
                  <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">{s.step}</div>
                  <h3 className="font-bold text-white text-sm mb-1">{s.title}</h3>
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
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 border border-emerald-500/20 p-10 sm:p-14 text-center shadow-2xl shadow-emerald-950">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-600/8 rounded-full blur-3xl" />
            </div>
            <div className="relative z-10">
              <div className="inline-flex p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 mb-6">
                <ShieldCheck className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
                Ready to Digitise Your<br />Procurement Workflow?
              </h2>
              <p className="text-slate-400 text-sm mb-8 max-w-lg mx-auto">
                Sign in to the ProcureHub portal and experience end-to-end procurement management with role-based access for both managers and vendors.
              </p>
              <button
                id="cta-login-btn"
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-2xl shadow-xl shadow-emerald-900/50 transition-all duration-200 text-base"
              >
                Go to Login
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-800/60 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-400">
            <Building2 className="w-4 h-4 text-emerald-500" />
            Procure<span className="text-emerald-400">Hub</span>
            <span className="font-normal text-slate-600 ml-1">Enterprise Procurement Portal</span>
          </div>
          <p className="text-xs text-slate-600">© 2025 ProcureHub. All rights reserved. AES-256 Encrypted.</p>
        </div>
      </footer>
    </div>
  );
};
