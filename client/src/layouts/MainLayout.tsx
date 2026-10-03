import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';

export const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <TopNavbar onOpenSidebar={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Enterprise Academic Footer */}
        <footer className="py-4 px-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
            <span>
              <strong>VendorGate</strong> — Pharmaceutical Vendor Onboarding & PO Governance System
            </span>
            <span className="font-mono text-slate-400">
              SE & PM Major Project Prototype • 59-Day CPM Schedule • Level 1-4 Gating
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};
