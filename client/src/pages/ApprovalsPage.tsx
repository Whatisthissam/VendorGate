import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { PurchaseOrder } from '../types';
import { ApprovalLevelBadge, POStatusBadge } from '../components/common/Badge';
import { formatCurrency, formatDate } from '../utils/formatters';
import { canApprovePO, getApprovalLevelDescription } from '../utils/approvalRules';
import { useAuth } from '../context/AuthContext';
import { ApprovalActionModal } from '../components/purchaseOrders/ApprovalActionModal';
import {
  CheckSquare,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const ApprovalsPage: React.FC = () => {
  const { user } = useAuth();
  const [pendingOrders, setPendingOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'AUTHORIZED' | 'RESTRICTED'>('ALL');
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const res = await api.getPurchaseOrders({ status: 'Pending Approval' });
      if (res.success && res.data) {
        setPendingOrders(res.data);
      }
    } catch (err) {
      console.error('Failed to load pending approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, [user]);

  const filteredOrders = pendingOrders.filter(po => {
    const check = canApprovePO(user, po.requiredApprovalLevel);
    if (filterType === 'AUTHORIZED') return check.allowed;
    if (filterType === 'RESTRICTED') return !check.allowed;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Managerial Approval Inbox & Authorization Gateway
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict policy-gated purchase order queue awaiting managerial sign-off
          </p>
        </div>

        {/* Current user tier pill */}
        <div className="flex items-center gap-2 text-xs bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
          <span className="text-slate-500">Active Persona:</span>
          <span className="font-semibold text-slate-900">{user?.name}</span>
          <span className="font-mono text-[11px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-bold border border-slate-200">
            {user?.role === 'ADMIN'
              ? 'ADMIN (Super-User)'
              : user?.approvalLevel
              ? `Level ${user.approvalLevel} Authority`
              : 'No Approver Rights'}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card-base p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
              filterType === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Pending Orders ({pendingOrders.length})
          </button>
          <button
            onClick={() => setFilterType('AUTHORIZED')}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
              filterType === 'AUTHORIZED'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            Within My Level ({pendingOrders.filter(p => canApprovePO(user, p.requiredApprovalLevel).allowed).length})
          </button>
          <button
            onClick={() => setFilterType('RESTRICTED')}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
              filterType === 'RESTRICTED'
                ? 'bg-rose-700 text-white'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            Other Levels / Restricted ({pendingOrders.filter(p => !canApprovePO(user, p.requiredApprovalLevel).allowed).length})
          </button>
        </div>

        <span className="text-[11px] text-slate-500 font-mono">
          Exact Tier Routing Enforced by Server Gate
        </span>
      </div>

      {/* Approvals Table */}
      <div className="card-base overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 font-mono">
            Loading approval queue...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">No pending orders in this view</p>
            <p className="text-xs text-slate-500">
              All purchase orders for this filter category have been resolved.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">PO Number</th>
                  <th className="py-2.5 px-4">Vendor</th>
                  <th className="py-2.5 px-4">Product Details</th>
                  <th className="py-2.5 px-4 text-right">Total Amount</th>
                  <th className="py-2.5 px-4">Required Tier</th>
                  <th className="py-2.5 px-4">Policy Clearance Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map(po => {
                  const check = canApprovePO(user, po.requiredApprovalLevel);

                  return (
                    <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
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
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-950 text-sm">
                        {formatCurrency(po.totalAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <ApprovalLevelBadge level={po.requiredApprovalLevel} />
                      </td>
                      <td className="py-3 px-4">
                        {check.allowed ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>Authorized to Approve</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            <ShieldAlert className="w-3 h-3 text-rose-600" />
                            <span>Approval Restricted</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedPO(po)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors shadow-sm ${
                            check.allowed
                              ? 'bg-slate-900 text-white hover:bg-slate-800'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                          }`}
                        >
                          <span>{check.allowed ? 'Authorize' : 'Inspect'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedPO && (
        <ApprovalActionModal
          isOpen={!!selectedPO}
          onClose={() => setSelectedPO(null)}
          purchaseOrder={selectedPO}
          onSuccess={() => {
            setSelectedPO(null);
            loadApprovals();
          }}
        />
      )}
    </div>
  );
};
