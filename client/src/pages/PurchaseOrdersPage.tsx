import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { PurchaseOrder } from '../types';
import { POStatusBadge, ApprovalLevelBadge } from '../components/common/Badge';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Search,
  Filter,
  PlusCircle,
  ArrowRight,
  ShieldAlert,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export const PurchaseOrdersPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [levelFilter, setLevelFilter] = useState('ALL');

  const loadPOs = async () => {
    try {
      setLoading(true);
      // If user is a vendor, filter to their vendor ID automatically
      const vendorId = user?.role === 'VENDOR' ? user.vendorId : undefined;
      const res = await api.getPurchaseOrders({
        status: statusFilter,
        approvalLevel: levelFilter,
        vendorId,
        search,
      });
      if (res.success && res.data) {
        setPurchaseOrders(res.data);
      }
    } catch (err) {
      console.error('Failed to load purchase orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPOs();
  }, [statusFilter, levelFilter, user]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadPOs();
  };

  const statuses = [
    'ALL',
    'Pending Approval',
    'Approved',
    'Sent to Vendor',
    'Acknowledged',
    'Draft',
    'Rejected',
    'Vendor Rejected',
  ];

  const levels = ['ALL', '1', '2', '3', '4'];

  const isVendor = user?.role === 'VENDOR';
  const isAuditor = user?.role === 'AUDITOR';
  const isApprover = user?.role === 'APPROVER';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            {isVendor && (
              <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-sky-100 text-sky-800 rounded border border-sky-200">
                Supplier Orders
              </span>
            )}
            {isAuditor && (
              <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-amber-100 text-amber-900 rounded border border-amber-200">
                Auditor Inspection View
              </span>
            )}
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {isVendor
                ? 'My Purchase Orders from Distributor'
                : isAuditor
                ? 'Purchase Orders Regulatory Audit Inspection'
                : isApprover
                ? 'Purchase Orders Directory & Approval Thresholds'
                : 'Purchase Orders & Approval Limit Routing'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isVendor
              ? `Requisitions issued by distributor to ${user?.companyName || 'your supplier account'}`
              : isAuditor
              ? 'Statutory verification of purchase orders, boundary values, and approval signatures'
              : 'Automated boundary tier assignment (Levels 1-4) and electronic vendor acknowledgement'}
          </p>
        </div>

        {hasRole('ADMIN', 'PROCUREMENT') && (
          <Link to="/purchase-orders/new" className="btn-primary text-xs">
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Purchase Order</span>
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="card-base p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by PO number, vendor, product, or keywords..."
              className="input-base pl-9 text-xs"
            />
          </form>

          {/* Level Filter Dropdown */}
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <span className="text-xs font-semibold text-slate-500">Approval Tier:</span>
            <div className="flex items-center gap-1">
              {levels.map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setLevelFilter(lvl)}
                  className={`px-2.5 py-1 text-xs rounded font-mono font-medium transition-colors ${
                    levelFilter === lvl
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {lvl === 'ALL' ? 'All Tiers' : `L${lvl}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {statuses.map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Statuses' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="card-base overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">
            Purchase Orders Record ({purchaseOrders.length})
          </span>
          <span className="text-xs font-mono text-slate-500">
            Strict Multi-Tier Policy Enforced
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 font-mono">
            Loading purchase orders...
          </div>
        ) : purchaseOrders.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No purchase orders found</p>
            <p className="text-xs text-slate-500">
              Try adjusting your search filters or status parameters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">PO Number</th>
                  <th className="py-2.5 px-4">Vendor Partner</th>
                  <th className="py-2.5 px-4">Product / Specification</th>
                  <th className="py-2.5 px-4 text-center">Qty</th>
                  <th className="py-2.5 px-4 text-right">Total Amount</th>
                  <th className="py-2.5 px-4">Required Tier</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchaseOrders.map(po => {
                  const isBoundaryCase = [
                    49999, 50000, 50001, 199999, 200000, 200001, 999999, 1000000, 1000001,
                  ].includes(po.totalAmount);

                  return (
                    <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <Link to={`/purchase-orders/${po.id}`} className="hover:underline">
                          {po.poNumber}
                        </Link>
                        {isBoundaryCase && (
                          <span className="block text-[9px] font-mono text-purple-700 uppercase font-semibold">
                            Boundary Test
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{po.vendorName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{po.vendorId}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs">
                        <div className="font-medium truncate">{po.productService}</div>
                        <div className="text-[11px] text-slate-400 truncate">{po.description}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-600">
                        {po.quantity.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                        {formatCurrency(po.totalAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <ApprovalLevelBadge level={po.requiredApprovalLevel} />
                      </td>
                      <td className="py-3 px-4">
                        <POStatusBadge status={po.status} />
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        {formatDate(po.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/purchase-orders/${po.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded shadow-sm transition-colors"
                        >
                          <span>Manage</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
