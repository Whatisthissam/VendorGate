import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { DashboardData, PurchaseOrder, Vendor } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { VendorStatusBadge, POStatusBadge, ApprovalLevelBadge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import { canApprovePO, getApprovalLevelDescription } from '../utils/approvalRules';
import { ApprovalActionModal } from '../components/purchaseOrders/ApprovalActionModal';
import { VendorAcknowledgeModal } from '../components/purchaseOrders/VendorAcknowledgeModal';
import {
  Building2,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  PlusCircle,
  FileCheck2,
  PackageCheck,
  History,
  Lock,
  Layers,
  KanbanSquare,
  Building,
  RotateCcw,
  Sparkles,
  BarChart3,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isAckModalOpen, setIsAckModalOpen] = useState(false);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardStats();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [user]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-mono">Loading {user?.role} workspace dashboard...</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 1: VENDOR DASHBOARD (Strictly tailored to Vendor perspective)
  // -------------------------------------------------------------
  if (user?.role === 'VENDOR') {
    const vData = data.vendorData;
    const vendor: Vendor | undefined = vData?.vendor;
    const vendorMetrics = vData?.metrics || {
      totalOrders: 0,
      pendingAckCount: 0,
      acknowledgedCount: 0,
      totalBusinessValue: 0,
      verificationStats: { summary: '0 / 11 verified', progressPercent: 0 },
      status: 'Under Review',
    };
    const pendingAckOrders: PurchaseOrder[] = vData?.pendingAckOrders || [];
    const allOrders: PurchaseOrder[] = vData?.orders || [];
    const documents = vData?.documents || [];

    return (
      <div className="space-y-6">
        {/* Vendor Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-sky-100 text-sky-800 rounded border border-sky-200">
                Supplier Portal
              </span>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                {vendor?.companyName || user.companyName || 'Vendor Dashboard'}
              </h1>
              {vendor && <VendorStatusBadge status={vendor.status} />}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Distribution Partner Order Desk & Regulatory Compliance Dashboard
            </p>
          </div>

          <Link
            to={user.vendorId ? `/vendors/${user.vendorId}` : '/vendors'}
            className="btn-secondary text-xs"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-slate-600" />
            <span>My Compliance Dossier (11 Docs)</span>
          </Link>
        </div>

        {/* Distributor Relationship Card */}
        <div className="card-base p-5 bg-gradient-to-r from-slate-950 to-slate-900 text-white border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Distributor Relationship & Standing
                </h3>
              </div>
              <p className="text-xs text-slate-300">
                Distributor: <strong>Pharma Distribution HQ</strong> • Account ID: <span className="font-mono text-amber-300">{vendor?.id || user.vendorId}</span>
              </p>
              <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap pt-1">
                <span>Category: <strong>{vendor?.category || 'Pharmaceutical Supplies'}</strong></span>
                <span>•</span>
                <span>GSTIN: <strong className="font-mono text-slate-200">{vendor?.gstNumber || '27AABCA1234F1Z5'}</strong></span>
                <span>•</span>
                <span>Account Status: <strong className="text-emerald-400">{vendor?.status || 'Active Certified Partner'}</strong></span>
              </div>
            </div>

            {/* Document progress */}
            <div className="shrink-0 md:border-l md:border-slate-800 md:pl-6 space-y-1">
              <span className="text-[11px] text-slate-400 font-medium">Compliance Dossier</span>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold font-mono text-white">
                  {vendorMetrics.verificationStats.summary}
                </span>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  {vendorMetrics.verificationStats.progressPercent}%
                </span>
              </div>
              <div className="w-32 bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
                <div
                  className={`h-full rounded-full ${
                    vendorMetrics.verificationStats.progressPercent === 100
                      ? 'bg-emerald-500'
                      : 'bg-amber-400'
                  }`}
                  style={{ width: `${vendorMetrics.verificationStats.progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Vendor KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card-base p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Orders Received
              </span>
              <FileText className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 font-mono">
                {vendorMetrics.totalOrders}
              </span>
              <span className="text-xs text-slate-500">purchase orders</span>
            </div>
            <p className="mt-2 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              Total orders issued by distributor
            </p>
          </div>

          <div className="card-base p-4 border-amber-200 bg-amber-50/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-900 uppercase tracking-wider">
                Pending Acknowledgement
              </span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-800 font-mono">
                {vendorMetrics.pendingAckCount}
              </span>
              <span className="text-xs text-amber-700 font-medium">requires action</span>
            </div>
            <p className="mt-2 text-[11px] text-amber-700 pt-2 border-t border-amber-200/60 font-medium">
              Awaiting your response/acceptance
            </p>
          </div>

          <div className="card-base p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Accepted & In Fulfillment
              </span>
              <PackageCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 font-mono">
                {vendorMetrics.acknowledgedCount}
              </span>
              <span className="text-xs text-emerald-700 font-medium">acknowledged</span>
            </div>
            <p className="mt-2 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              Dispatched / in transit to warehouse
            </p>
          </div>

          <div className="card-base p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Order Value
              </span>
              <TrendingUp className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
                {formatCurrency(vendorMetrics.totalBusinessValue)}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              Cumulative distributor volume
            </p>
          </div>
        </div>

        {/* Action Needed: Orders Pending Acknowledgement */}
        {pendingAckOrders.length > 0 && (
          <div className="card-base border-amber-300 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-700" />
                <h3 className="text-sm font-bold text-amber-950">
                  Action Required: Orders Awaiting Acknowledgement ({pendingAckOrders.length})
                </h3>
              </div>
              <span className="text-xs text-amber-800 font-medium">
                Please acknowledge delivery feasibility
              </span>
            </div>

            <div className="divide-y divide-amber-100">
              {pendingAckOrders.map(po => (
                <div key={po.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-amber-50/40">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900">{po.poNumber}</span>
                      <POStatusBadge status={po.status} />
                      <span className="text-xs font-mono font-bold text-slate-900">
                        {formatCurrency(po.totalAmount)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium mt-1">{po.productService}</p>
                    <p className="text-[11px] text-slate-500">
                      Quantity: {po.quantity.toLocaleString('en-IN')} units • Required Delivery: {formatDate(po.requiredDate)}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <Link
                      to={`/purchase-orders/${po.id}`}
                      className="btn-secondary text-xs py-1.5"
                    >
                      Inspect Order
                    </Link>
                    <button
                      onClick={() => {
                        setSelectedPO(po);
                        setIsAckModalOpen(true);
                      }}
                      className="btn-success text-xs py-1.5"
                    >
                      <PackageCheck className="w-3.5 h-3.5" />
                      <span>Acknowledge Order</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Two Column Grid: My Recent POs + My 11 Compliance Documents Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="card-base">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Purchase Orders History</h3>
              <Link to="/purchase-orders" className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium">
                <span>View All Orders</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {allOrders.slice(0, 5).map(po => (
                <div key={po.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/60">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link to={`/purchase-orders/${po.id}`} className="font-mono font-bold text-xs text-slate-900 hover:underline">
                        {po.poNumber}
                      </Link>
                      <POStatusBadge status={po.status} />
                    </div>
                    <p className="text-xs text-slate-600 truncate mt-0.5">{po.productService}</p>
                    <span className="text-[11px] text-slate-400 font-mono">{formatDate(po.createdAt)}</span>
                  </div>
                  <div className="text-right shrink-0 font-mono font-bold text-xs text-slate-900">
                    {formatCurrency(po.totalAmount)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance Checklist Summary */}
          <div className="card-base">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">My Compliance Documents (11 Types)</h3>
                <p className="text-[11px] text-slate-500">Pharma distributor qualification checklist</p>
              </div>
              <Link
                to={user.vendorId ? `/vendors/${user.vendorId}` : '/vendors'}
                className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1"
              >
                <span>Full Dossier</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-4 space-y-2.5 max-h-72 overflow-y-auto text-xs">
              {documents.map((doc: any, idx: number) => (
                <div key={doc.id} className="p-2.5 bg-slate-50 rounded border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-slate-400 w-4">{idx + 1}.</span>
                    <span className="font-medium text-slate-800 truncate">{doc.name}</span>
                  </div>
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.5 rounded border uppercase font-bold shrink-0 ${
                      doc.status === 'Verified'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : doc.status === 'Uploaded'
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : doc.status === 'Rejected'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modals for Vendor */}
        {selectedPO && isAckModalOpen && (
          <VendorAcknowledgeModal
            isOpen={isAckModalOpen}
            onClose={() => {
              setIsAckModalOpen(false);
              setSelectedPO(null);
            }}
            purchaseOrder={selectedPO}
            onSuccess={() => {
              setIsAckModalOpen(false);
              setSelectedPO(null);
              loadDashboard();
            }}
          />
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: AUDITOR DASHBOARD (Strictly tailored to Compliance Audit)
  // -------------------------------------------------------------
  if (user?.role === 'AUDITOR') {
    const auditorData = data.auditorData || {
      metrics: {
        historicViolations: 34,
        currentViolations: 0,
        blockedAttemptsCount: 0,
        totalAuditLogsCount: 0,
        complianceRate: 100,
        fullyCompliantCount: 0,
        totalVendorsCount: 0,
      },
      blockedAttempts: [],
      recentSecurityEvents: [],
      recentAuditActivity: [],
    };
    const { metrics: aMetrics, blockedAttempts, recentSecurityEvents, recentAuditActivity } = auditorData;

    return (
      <div className="space-y-6">
        {/* Auditor Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-amber-100 text-amber-900 rounded border border-amber-200">
                Statutory Audit Console
              </span>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Compliance & Authorization Governance
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Inspection of financial authorization boundaries, blocked bypass attempts, and regulatory documents
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/audit" className="btn-primary text-xs">
              <History className="w-3.5 h-3.5" />
              <span>Full Audit Trail ({aMetrics.totalAuditLogsCount})</span>
            </Link>
            <Link to="/reports" className="btn-secondary text-xs">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Boundary Test Reports</span>
            </Link>
          </div>
        </div>

        {/* Primary Audit Governance Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Historic Manual System Violations */}
          <div className="card-base p-4 border-slate-300 bg-slate-50/70">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Historic Bypass Incidents
              </span>
              <ShieldAlert className="w-4 h-4 text-slate-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 font-mono">
                {aMetrics.historicViolations}
              </span>
              <span className="text-xs text-rose-700 font-medium">paper-era findings</span>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 pt-2 border-t border-slate-200">
              Legacy manual POs approved above limits
            </p>
          </div>

          {/* Current Period System Violations */}
          <div className="card-base p-4 border-emerald-200 bg-emerald-50/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-900 uppercase tracking-wider">
                Active System Bypasses
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-700 font-mono">
                0
              </span>
              <span className="text-xs text-emerald-700 font-semibold">100% Policy Adherence</span>
            </div>
            <p className="mt-2 text-[11px] text-emerald-700 pt-2 border-t border-emerald-200 font-medium">
              Zero unauthorized PO releases under VendorGate
            </p>
          </div>

          {/* Blocked Unauthorized Attempts */}
          <div className="card-base p-4 border-rose-200 bg-rose-50/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-900 uppercase tracking-wider">
                Blocked Out-of-Limit Attempts
              </span>
              <Lock className="w-4 h-4 text-rose-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-rose-700 font-mono">
                {aMetrics.blockedAttemptsCount}
              </span>
              <span className="text-xs text-rose-700 font-medium">strictly intercepted</span>
            </div>
            <p className="mt-2 text-[11px] text-rose-700 pt-2 border-t border-rose-200 font-medium">
              Attempted sign-offs rejected by server gate
            </p>
          </div>

          {/* Vendor Compliance Rate */}
          <div className="card-base p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Vendor Compliance Rate
              </span>
              <FileCheck2 className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 font-mono">
                {aMetrics.complianceRate}%
              </span>
              <span className="text-xs text-slate-500">fully verified</span>
            </div>
            <p className="mt-2 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              {aMetrics.fullyCompliantCount} of {aMetrics.totalVendorsCount} vendors with 11/11 docs
            </p>
          </div>
        </div>

        {/* Security & Authorization Exceptions Table (Critical for Auditor) */}
        <div className="card-base overflow-hidden border-rose-200">
          <div className="px-5 py-3.5 bg-rose-50/70 border-b border-rose-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-700" />
              <h3 className="text-sm font-bold text-rose-950">
                Security & Authorization Interceptions Log
              </h3>
            </div>
            <span className="text-xs font-mono text-rose-800 font-medium">
              Automated Server-Side Gating Invariant
            </span>
          </div>

          {blockedAttempts.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No blocked attempts recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-rose-100 text-xs">
              {blockedAttempts.map((log: any) => (
                <div key={log.id} className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] font-bold px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded border border-rose-200">
                        {log.action}
                      </span>
                      <span className="font-semibold text-slate-900">{log.userName}</span>
                      <span className="text-slate-400">•</span>
                      <span className="font-mono text-slate-700">Target: {log.entityId}</span>
                    </div>
                    <p className="text-slate-700 text-xs leading-relaxed">{log.description}</p>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                    {formatDate(log.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Regulatory Audit Stream */}
        <div className="card-base overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-semibold text-slate-900">Recent Immutable Event Log</h3>
            </div>
            <Link to="/audit" className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium">
              <span>View Full Audit Trail</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {recentAuditActivity.map((log: any) => (
              <div key={log.id} className="p-3.5 flex items-start gap-3 hover:bg-slate-50/50">
                <span className="font-mono text-[11px] text-slate-400 shrink-0 mt-0.5">
                  {formatDate(log.timestamp)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{log.userName}</span>
                    <span className="text-[10px] font-mono px-1 py-0.2 bg-slate-100 text-slate-600 rounded">
                      {log.userRole}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="font-mono font-semibold text-slate-800 text-[11px]">
                      {log.action}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-0.5">{log.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 3: APPROVER DASHBOARD (Level 1, 2, 3, 4)
  // -------------------------------------------------------------
  if (user?.role === 'APPROVER') {
    const appData = data.approverData || {
      userLevel: user.approvalLevel || 1,
      limitDescription: user.limitDescription || '',
      metrics: {
        pendingMyLevelCount: 0,
        pendingWithinAuthCount: 0,
        pendingRestrictedCount: 0,
        myApprovedCount: 0,
      },
      actionableQueue: [],
      restrictedQueue: [],
    };
    const { metrics: apMetrics, actionableQueue, restrictedQueue } = appData;

    return (
      <div className="space-y-6">
        {/* Approver Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-slate-900 text-white rounded">
                Level {user.approvalLevel} Approver
              </span>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                {user.name}’s Approval Command Center
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Financial Authority Ceiling: <strong>{user.limitDescription}</strong>
            </p>
          </div>

          <Link to="/approvals" className="btn-primary text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Open Dedicated Inbox ({apMetrics.pendingWithinAuthCount})</span>
          </Link>
        </div>

        {/* Approver Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card-base p-4 border-indigo-200 bg-indigo-50/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-900 uppercase tracking-wider">
                Actionable by You
              </span>
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-indigo-800 font-mono">
                {apMetrics.pendingWithinAuthCount}
              </span>
              <span className="text-xs text-indigo-700 font-medium">ready to approve</span>
            </div>
            <p className="mt-2 text-[11px] text-indigo-700 pt-2 border-t border-indigo-200/60 font-medium">
              Strictly Level {user.approvalLevel} orders
            </p>
          </div>

          <div className="card-base p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Targeted at Level {user.approvalLevel}
              </span>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 font-mono">
                {apMetrics.pendingMyLevelCount}
              </span>
              <span className="text-xs text-slate-500">exact tier</span>
            </div>
            <p className="mt-2 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              Orders requiring your specific level
            </p>
          </div>

          <div className="card-base p-4 border-rose-200 bg-rose-50/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-900 uppercase tracking-wider">
                Other Tiers (Restricted)
              </span>
              <ShieldAlert className="w-4 h-4 text-rose-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-rose-800 font-mono">
                {apMetrics.pendingRestrictedCount}
              </span>
              <span className="text-xs text-rose-700 font-medium">restricted</span>
            </div>
            <p className="mt-2 text-[11px] text-rose-700 pt-2 border-t border-rose-200/60 font-medium">
              Non-Level {user.approvalLevel} orders • Gated by policy
            </p>
          </div>

          <div className="card-base p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Approved by You
              </span>
              <PackageCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 font-mono">
                {apMetrics.myApprovedCount}
              </span>
              <span className="text-xs text-slate-500">cleared</span>
            </div>
            <p className="mt-2 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              Authorized orders on record
            </p>
          </div>
        </div>

        {/* Actionable Orders List */}
        <div className="card-base overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Purchase Orders Requiring Approval ({actionableQueue.length})
              </h3>
              <p className="text-[11px] text-slate-500">
                You are authorized to review and sign off on these requisitions
              </p>
            </div>
            <Link to="/approvals" className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium">
              <span>View Full Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {actionableQueue.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No pending purchase orders within your authority right now.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {actionableQueue.map((po: PurchaseOrder) => (
                <div key={po.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link to={`/purchase-orders/${po.id}`} className="font-mono font-bold text-sm text-slate-900 hover:underline">
                        {po.poNumber}
                      </Link>
                      <ApprovalLevelBadge level={po.requiredApprovalLevel} />
                      <span className="font-mono font-bold text-slate-900">{formatCurrency(po.totalAmount)}</span>
                    </div>
                    <p className="text-slate-700 font-medium mt-0.5">{po.productService}</p>
                    <p className="text-[11px] text-slate-500">
                      Vendor: {po.vendorName} • Created: {formatDate(po.createdAt)}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedPO(po);
                        setIsApprovalModalOpen(true);
                      }}
                      className="btn-primary text-xs py-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Authorize PO</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal for Approver */}
        {selectedPO && isApprovalModalOpen && (
          <ApprovalActionModal
            isOpen={isApprovalModalOpen}
            onClose={() => {
              setIsApprovalModalOpen(false);
              setSelectedPO(null);
            }}
            purchaseOrder={selectedPO}
            onSuccess={() => {
              setIsApprovalModalOpen(false);
              setSelectedPO(null);
              loadDashboard();
            }}
          />
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 4: ADMIN / PROCUREMENT / FINANCE DASHBOARD
  // -------------------------------------------------------------
  const { metrics, recentVendors, recentPurchaseOrders, pendingApprovalPOs, recentAuditActivity } = data;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-slate-900 text-white rounded">
              {user?.role} Workspace
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {user?.role === 'ADMIN'
                ? 'System Administration & Governance Console'
                : user?.role === 'FINANCE'
                ? 'Finance & Spend Commitments Dashboard'
                : 'Procurement Operations & Supplier Management'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {user?.role === 'ADMIN'
              ? 'Complete operational oversight, monorepo state management, and academic project controls'
              : user?.role === 'FINANCE'
              ? 'Spend commitments tracking, tier allocation analysis, and financial audit review'
              : 'Vendor onboarding qualification, 11-document inspection, and requisition pipeline'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {user?.role === 'ADMIN' && (
            <Link to="/project-overview" className="btn-secondary text-xs">
              <KanbanSquare className="w-3.5 h-3.5 text-slate-600" />
              <span>Project Overview (59-Day CPM)</span>
            </Link>
          )}

          {hasRole('ADMIN', 'PROCUREMENT') && (
            <>
              <Link to="/vendors/new" className="btn-secondary text-xs">
                <Building2 className="w-3.5 h-3.5" />
                <span>Onboard Vendor</span>
              </Link>
              <Link to="/purchase-orders/new" className="btn-primary text-xs">
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create Purchase Order</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-base p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Vendors
            </span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {metrics.totalVendors}
            </span>
            <span className="text-xs text-slate-500">pharma partners</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100 font-medium">
            <span className="text-emerald-700">{metrics.approvedVendors} Approved</span>
            <span className="text-amber-700">{metrics.pendingVendors} Pending</span>
          </div>
        </div>

        <div className="card-base p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Purchase Orders
            </span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {metrics.totalPurchaseOrders}
            </span>
            <span className="text-xs text-slate-500">requisitions</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100 font-medium">
            <span className="text-emerald-700">{metrics.approvedPOs} Cleared</span>
            <span className="text-rose-700">{metrics.rejectedPOs} Rejected</span>
          </div>
        </div>

        <div className="card-base p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Approvals
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {metrics.pendingApprovals}
            </span>
            <span className="text-xs text-amber-700 font-medium">in queue</span>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-mono text-slate-600 pt-2 border-t border-slate-100">
            <span>L1:{metrics.pendingByLevel.level1}</span>
            <span>•</span>
            <span>L2:{metrics.pendingByLevel.level2}</span>
            <span>•</span>
            <span>L3:{metrics.pendingByLevel.level3}</span>
            <span>•</span>
            <span>L4:{metrics.pendingByLevel.level4}</span>
          </div>
        </div>

        <div className="card-base p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total PO Volume
            </span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {formatCurrency(metrics.totalPOValue)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>Compliance Controlled</span>
            <span className="text-emerald-700 font-medium">0 Bypass Cases</span>
          </div>
        </div>
      </div>

      {/* Admin Fast Actions Banner */}
      {user?.role === 'ADMIN' && (
        <div className="card-base p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <KanbanSquare className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Academic Project Management Section
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                59-Day Critical Path Schedule (CPM) & Risk Exposure Treatment Matrix available in Admin workspace.
              </p>
            </div>
          </div>
          <Link
            to="/project-overview"
            className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded transition-colors shrink-0"
          >
            Open Project Overview
          </Link>
        </div>
      )}

      {/* Pending Approvals Queue */}
      <div className="card-base">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <span>Pending Authorization Queue</span>
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 bg-amber-50 text-amber-800 rounded border border-amber-200">
                {pendingApprovalPOs.length} Requires Review
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Orders algorithmically routed based on value thresholds
            </p>
          </div>
          {hasRole('ADMIN', 'APPROVER') && (
            <Link
              to="/approvals"
              className="text-xs font-medium text-slate-700 hover:text-slate-900 flex items-center gap-1"
            >
              <span>View Full Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">PO Number</th>
                <th className="py-2.5 px-4">Vendor</th>
                <th className="py-2.5 px-4">Product / Item</th>
                <th className="py-2.5 px-4 text-right">Total Amount</th>
                <th className="py-2.5 px-4">Required Tier</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingApprovalPOs.slice(0, 5).map((po: PurchaseOrder) => (
                <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                    <Link to={`/purchase-orders/${po.id}`} className="hover:underline">
                      {po.poNumber}
                    </Link>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800 max-w-[160px] truncate">
                    {po.vendorName}
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate">
                    {po.productService}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(po.totalAmount)}
                  </td>
                  <td className="py-3 px-4">
                    <ApprovalLevelBadge level={po.requiredApprovalLevel} />
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono">
                    {formatDate(po.createdAt)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/purchase-orders/${po.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded shadow-sm transition-colors"
                    >
                      <span>Review</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Section: Recent Vendors + Recent POs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Vendors */}
        <div className="card-base">
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Recent Vendors</h2>
              <p className="text-xs text-slate-500">Document compliance & onboarding status</p>
            </div>
            <Link
              to="/vendors"
              className="text-xs font-medium text-slate-700 hover:text-slate-900 flex items-center gap-1"
            >
              <span>View All ({metrics.totalVendors})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentVendors.map((vendor: Vendor) => (
              <div
                key={vendor.id}
                className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/vendors/${vendor.id}`}
                      className="text-sm font-semibold text-slate-900 hover:underline truncate"
                    >
                      {vendor.companyName}
                    </Link>
                    <VendorStatusBadge status={vendor.status} />
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <span className="font-mono">{vendor.id}</span>
                    <span>•</span>
                    <span className="truncate">{vendor.category}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-medium text-slate-700">
                    {vendor.verificationStats.summary}
                  </span>
                  <div className="w-24 bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        vendor.verificationStats.progressPercent === 100
                          ? 'bg-emerald-600'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${vendor.verificationStats.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Purchase Orders */}
        <div className="card-base">
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Recent Purchase Orders</h2>
              <p className="text-xs text-slate-500">Order lifecycle and approval progress</p>
            </div>
            <Link
              to="/purchase-orders"
              className="text-xs font-medium text-slate-700 hover:text-slate-900 flex items-center gap-1"
            >
              <span>View All ({metrics.totalPurchaseOrders})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentPurchaseOrders.map((po: PurchaseOrder) => (
              <div
                key={po.id}
                className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/purchase-orders/${po.id}`}
                      className="text-sm font-semibold text-slate-900 hover:underline font-mono"
                    >
                      {po.poNumber}
                    </Link>
                    <POStatusBadge status={po.status} />
                  </div>
                  <p className="text-xs text-slate-600 truncate mt-0.5">{po.productService}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{po.vendorName}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-bold font-mono text-slate-900">
                    {formatCurrency(po.totalAmount)}
                  </span>
                  <div className="mt-1">
                    <ApprovalLevelBadge level={po.requiredApprovalLevel} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
