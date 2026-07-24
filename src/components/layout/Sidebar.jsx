import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, Users, ShoppingCart, FileSpreadsheet, 
  CreditCard, BarChart3, PackageCheck, FileText, Wallet, Building2, Package, User, X 
} from 'lucide-react';

export const Sidebar = ({ mobileOpen, onMobileClose }) => {
  const { user } = useAuth();
  const role = user?.role;

  const managerNav = [
    { label: 'Dashboard', path: '/manager/dashboard', icon: LayoutDashboard },
    { label: 'Vendor Directory', path: '/manager/vendors', icon: Users },
    { label: 'Procurement (POs)', path: '/manager/procurement', icon: ShoppingCart },
    { label: 'Invoice Queue', path: '/manager/invoices', icon: FileSpreadsheet },
    { label: 'Payment Processing', path: '/manager/payments', icon: CreditCard },
    { label: 'Reports & Analytics', path: '/manager/reports', icon: BarChart3 },
    { label: 'My Account & Security', path: '/manager/profile', icon: User }
  ];

  const vendorNav = [
    { label: 'Dashboard', path: '/vendor/dashboard', icon: LayoutDashboard },
    { label: 'Product Catalog', path: '/vendor/products', icon: Package },
    { label: 'Incoming Orders', path: '/vendor/orders', icon: PackageCheck },
    { label: 'My Invoices', path: '/vendor/invoices', icon: FileText },
    { label: 'Earnings & Payments', path: '/vendor/payments', icon: Wallet },
    { label: 'Profile & Security', path: '/vendor/profile', icon: Building2 }
  ];

  const navItems = role === 'manager' ? managerNav : vendorNav;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed lg:static top-0 left-0 z-50 h-full w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header */}
        <div className="p-5 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl text-white ${role === 'manager' ? 'bg-primary-600' : 'bg-emerald-600'}`}>
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Portal View</p>
              <h2 className="text-sm font-bold text-white capitalize">{role} Workspace</h2>
            </div>
          </div>
          <button
            onClick={onMobileClose}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
            Main Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? role === 'manager'
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                        : 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Footer info card */}
        <div className="p-4 m-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs">
          <p className="text-slate-400 font-medium">Logged in as:</p>
          <p className="text-white font-bold truncate mt-0.5">{user?.name}</p>
          <p className="text-[10px] text-slate-400 truncate">{user?.companyName || user?.department}</p>
        </div>
      </aside>
    </>
  );
};
