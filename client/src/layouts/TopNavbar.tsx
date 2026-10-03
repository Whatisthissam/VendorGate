import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Menu,
  ChevronDown,
  ShieldCheck,
  User as UserIcon,
  LogOut,
} from 'lucide-react';

interface TopNavbarProps {
  onOpenSidebar: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onOpenSidebar }) => {
  const { user, demoUsers, switchUser, logout } = useAuth();
  const { success, error } = useToast();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Mobile Toggle & Page context */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-md lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-800">Pharmaceutical Distribution HQ</span>
            <span>/</span>
            <span className="font-mono text-slate-600">850 Vendor Network</span>
          </div>
        </div>

        {/* Right: Quick Role Switcher & Persona Selector */}
        <div className="flex items-center gap-2.5">
          {/* Active Role & Quick Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 hover:border-slate-400 rounded-md shadow-sm transition-colors"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-slate-900">{user?.role}</span>
              {user?.approvalLevel ? (
                <span className="font-mono text-[11px] bg-slate-100 px-1 py-0.2 rounded border border-slate-200">
                  L{user.approvalLevel}
                </span>
              ) : null}
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {roleDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setRoleDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg border border-slate-200 shadow-xl z-40 py-2 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3.5 py-2 bg-slate-50/70">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Demo Role Switcher
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Switch user personas to verify permissions & limits
                    </p>
                  </div>

                  <div className="py-1 max-h-80 overflow-y-auto">
                    {demoUsers.map(u => {
                      const isSelected = user?.id === u.id;
                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            switchUser(u);
                            setRoleDropdownOpen(false);
                            success('Role Switched', `Logged in as ${u.name} (${u.role}${u.approvalLevel ? ` - Level ${u.approvalLevel}` : ''})`);
                          }}
                          className={`w-full text-left px-3.5 py-2 flex items-start gap-2.5 transition-colors ${
                            isSelected
                              ? 'bg-slate-100 font-semibold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700 shrink-0 mt-0.5">
                            {u.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-slate-900 truncate">
                                {u.name}
                              </span>
                              <span className="text-[10px] font-mono px-1 py-0.2 bg-slate-100 rounded text-slate-600 border border-slate-200">
                                {u.role === 'APPROVER' ? `L${u.approvalLevel}` : u.role}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">{u.title}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-2 border-t border-slate-100 bg-slate-50/80">
                    <button
                      onClick={() => {
                        logout();
                        setRoleDropdownOpen(false);
                      }}
                      className="w-full text-center px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out to Login Page</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
