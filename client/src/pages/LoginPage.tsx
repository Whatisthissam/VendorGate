import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  ShieldCheck,
  UserCheck,
  Building2,
  FileCheck,
  Coins,
  History,
  Lock,
  ArrowRight,
  Info,
} from 'lucide-react';
import { User } from '../types';

export const LoginPage: React.FC = () => {
  const { demoUsers, loginAs } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [selectedUserId, setSelectedUserId] = useState<string>('usr_procurement');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleLogin = async (userIdToLogin?: string) => {
    const targetId = userIdToLogin || selectedUserId;
    try {
      setIsSubmitting(true);
      const loggedUser = await loginAs(targetId);
      success('Logged In', `Authenticated as ${loggedUser.name} (${loggedUser.role})`);
      navigate('/dashboard');
    } catch (err: any) {
      error('Login Failed', err.message || 'Unable to authenticate demo user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group demo users by function
  const approverUsers = demoUsers.filter(u => u.role === 'APPROVER');
  const roleOrder: Record<string, number> = { PROCUREMENT: 1, FINANCE: 2, ADMIN: 3 };
  const operationsUsers = demoUsers
    .filter(u => ['PROCUREMENT', 'FINANCE', 'ADMIN'].includes(u.role))
    .sort((a, b) => (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99));
  const complianceUsers = demoUsers.filter(u => u.role === 'AUDITOR');
  const vendorUsers = demoUsers.filter(u => u.role === 'VENDOR');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-white selection:text-slate-900">
      <div className="max-w-4xl w-full mx-auto space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white text-slate-950 font-bold shadow-lg mb-2">
            <ShieldCheck className="w-7 h-7 text-slate-900" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            VENDORGATE
          </h1>
          <p className="text-sm font-medium text-slate-400 max-w-xl mx-auto">
            Vendor Onboarding & Purchase Order Management Portal
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-xs font-mono border border-slate-700">
            <span>Academic Demonstration Prototype</span>
            <span>•</span>
            <span className="text-emerald-400">Zero-Auth Persona Simulation</span>
          </div>
        </div>

        {/* Demo Persona Selection Card */}
        <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Select Demo User Persona</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Click any persona to log in instantly and test role-specific workflows
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <Info className="w-3.5 h-3.5 text-sky-400" />
              <span>Simulated multi-role session</span>
            </div>
          </div>

          {/* Section 1: Operations, Finance & Administration */}
          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Procurement, Finance & System Admin
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {operationsUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => handleLogin(u.id)}
                  disabled={isSubmitting}
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-600 text-left transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-800 text-slate-200 rounded border border-slate-700">
                        {u.role}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-sm font-semibold text-white mt-2 leading-tight">
                      {u.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{u.title}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
                    {u.department}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Financial Approvers (Levels 1 - 4 in the Middle) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span>Financial Approvers (Delegation of Authority Matrix)</span>
              <span className="text-[11px] font-mono text-amber-400">Core Evaluation Feature</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {approverUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => handleLogin(u.id)}
                  disabled={isSubmitting}
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-600 hover:bg-slate-850 text-left transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-800 text-slate-200 rounded border border-slate-700">
                        Level {u.approvalLevel}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-sm font-semibold text-white mt-2 leading-tight">
                      {u.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{u.title}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-emerald-400 font-medium">
                    {u.limitDescription}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Vendors & Auditor */}
          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              External Vendor & Compliance Auditor
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {vendorUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => handleLogin(u.id)}
                  disabled={isSubmitting}
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-600 text-left transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-sky-950 text-sky-400 rounded border border-sky-800">
                        VENDOR ({u.vendorId})
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-sm font-semibold text-white mt-2 leading-tight">
                      {u.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{u.companyName}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
                    Self-Service Portal & PO Ack
                  </div>
                </button>
              ))}

              {complianceUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => handleLogin(u.id)}
                  disabled={isSubmitting}
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-600 text-left transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-950 text-amber-400 rounded border border-amber-800">
                        AUDITOR
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-sm font-semibold text-white mt-2 leading-tight">
                      {u.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{u.title}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
                    Read-Only Logs & Inspection
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Vendor Self-Registration Link (FR-01 / FR-02) */}
        <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-slate-300">
            <Building2 className="w-5 h-5 text-sky-400 shrink-0" />
            <div>
              <span className="font-semibold text-white">Prospective Pharmaceutical Supplier?</span>
              <p className="text-[11px] text-slate-400">Complete the 5-section qualification form & submit compliance certificates.</p>
            </div>
          </div>
          <Link
            to="/register"
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg transition-colors shrink-0"
          >
            Register as New Vendor
          </Link>
        </div>

        {/* Presentation Tip */}
        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <span>💡</span>
          <span>
            Tip: You can switch roles at any point from the top navigation bar without returning to this screen.
          </span>
        </div>
      </div>
    </div>
  );
};
