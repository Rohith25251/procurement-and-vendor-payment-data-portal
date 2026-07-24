import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export const VendorLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMobileMenuToggle={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
