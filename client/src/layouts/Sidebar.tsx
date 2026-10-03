import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  FileCheck2,
  FileText,
  CheckSquare,
  History,
  BarChart3,
  KanbanSquare,
  LogOut,
  ShieldCheck,
  Building,
  PackageCheck,
  FileSearch,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  // Role-specific navigation definitions
  const getNavItems = () => {
    if (!user) return [];

    switch (user.role) {
      case 'VENDOR':
        return [
          {
            name: 'Vendor Dashboard',
            path: '/dashboard',
            icon: LayoutDashboard,
          },
          {
            name: 'My Purchase Orders',
            path: '/purchase-orders',
            icon: PackageCheck,
          },
          {
            name: 'My Compliance Dossier',
            path: user.vendorId ? `/vendors/${user.vendorId}` : '/vendors',
            icon: FileCheck2,
          },
        ];

      case 'AUDITOR':
        return [
          {
            name: 'Audit Dashboard',
            path: '/dashboard',
            icon: LayoutDashboard,
          },
          {
            name: 'Compliance Audit Trail',
            path: '/audit',
            icon: History,
          },
          {
            name: 'Vendors Inspection',
            path: '/vendors',
            icon: Building2,
          },
          {
            name: 'Document Verification',
            path: '/documents',
            icon: FileCheck2,
          },
          {
            name: 'Purchase Orders Audit',
            path: '/purchase-orders',
            icon: FileSearch,
          },
          {
            name: 'Compliance Reports',
            path: '/reports',
            icon: BarChart3,
          },
        ];

      case 'APPROVER':
        return [
          {
            name: 'Approvals Dashboard',
            path: '/dashboard',
            icon: LayoutDashboard,
          },
          {
            name: 'Approval Inbox',
            path: '/approvals',
            icon: CheckSquare,
            badge: `Level ${user.approvalLevel || 1}`,
          },
          {
            name: 'Purchase Orders',
            path: '/purchase-orders',
            icon: FileText,
          },
          {
            name: 'Threshold Reports',
            path: '/reports',
            icon: BarChart3,
          },
        ];

      case 'PROCUREMENT':
        return [
          {
            name: 'Procurement Dashboard',
            path: '/dashboard',
            icon: LayoutDashboard,
          },
          {
            name: 'Vendor Directory',
            path: '/vendors',
            icon: Building2,
          },
          {
            name: 'Document Verification',
            path: '/documents',
            icon: FileCheck2,
          },
          {
            name: 'Purchase Orders',
            path: '/purchase-orders',
            icon: FileText,
          },
          {
            name: 'Analytics & Spend',
            path: '/reports',
            icon: BarChart3,
          },
        ];

      case 'FINANCE':
        return [
          {
            name: 'Finance Dashboard',
            path: '/dashboard',
            icon: LayoutDashboard,
          },
          {
            name: 'Purchase Orders',
            path: '/purchase-orders',
            icon: FileText,
          },
          {
            name: 'Spend Analytics',
            path: '/reports',
            icon: BarChart3,
          },
          {
            name: 'Financial Audit Trail',
            path: '/audit',
            icon: History,
          },
        ];

      case 'ADMIN':
      default:
        return [
          {
            name: 'Admin Dashboard',
            path: '/dashboard',
            icon: LayoutDashboard,
          },
          {
            name: 'Vendors Directory',
            path: '/vendors',
            icon: Building2,
          },
          {
            name: 'Document Verification',
            path: '/documents',
            icon: FileCheck2,
          },
          {
            name: 'Purchase Orders',
            path: '/purchase-orders',
            icon: FileText,
          },
          {
            name: 'Approval Inbox',
            path: '/approvals',
            icon: CheckSquare,
            badge: 'Super-User',
          },
          {
            name: 'Audit Trail',
            path: '/audit',
            icon: History,
          },
          {
            name: 'Reports & Analytics',
            path: '/reports',
            icon: BarChart3,
          },
          // Only Admin has the Project Overview (Academic Software Engineering section)
          {
            name: 'Project Overview',
            path: '/project-overview',
            icon: KanbanSquare,
            badge: 'Admin Only',
          },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-950 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-800/80 bg-slate-950">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-950 font-bold shadow-sm">
            <ShieldCheck className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-white text-base">VENDORGATE</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
                PORTAL
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {user?.role === 'VENDOR' ? 'Supplier Order Portal' : 'Pharma Compliance System'}
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>{user?.role} Workspace</span>
            {user?.role === 'APPROVER' && (
              <span className="font-mono text-amber-400 text-[10px]">Tier {user.approvalLevel}</span>
            )}
          </div>

          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                  }`
                }
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded border border-slate-700 shrink-0">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Bottom User & Role Section */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/80">
          <div className="px-2 py-2 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                {user?.avatar || 'VG'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate leading-tight">
                  {user?.name || 'Guest User'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-mono text-slate-300 px-1 py-0.2 bg-slate-800 rounded">
                    {user?.role}
                    {user?.approvalLevel ? ` (L${user.approvalLevel})` : ''}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Logout / Switch User"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
