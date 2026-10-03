import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AuditLog } from '../types';
import { formatDateTime } from '../utils/formatters';
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Building2,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const AuditTrailPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs({
        entityType: entityFilter,
        userRole: roleFilter,
        search,
      });
      if (res.success && res.data) {
        setLogs(res.data);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [entityFilter, roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadAuditLogs();
  };

  const entityTypes = [
    'ALL',
    'PURCHASE_ORDER',
    'VENDOR',
    'VENDOR_DOCUMENT',
    'AUTHENTICATION',
    'COMPLIANCE',
  ];

  const userRoles = [
    'ALL',
    'ADMIN',
    'PROCUREMENT',
    'APPROVER',
    'FINANCE',
    'AUDITOR',
    'VENDOR',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Immutable Regulatory Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tamper-proof event logs for procurement decisions, approvals, boundary checks, and vendor responses
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>Read-Only Compliance Record</span>
        </div>
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
              placeholder="Search audit trail by description, username, entity ID, or action..."
              className="input-base pl-9 text-xs"
            />
          </form>

          {/* User Role Filter */}
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <span className="text-xs font-semibold text-slate-500">Role:</span>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="input-base py-1 px-2.5 text-xs font-medium w-auto"
            >
              {userRoles.map(r => (
                <option key={r} value={r}>
                  {r === 'ALL' ? 'All Roles' : r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Entity Type Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {entityTypes.map(et => (
            <button
              key={et}
              onClick={() => setEntityFilter(et)}
              className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                entityFilter === et
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {et === 'ALL' ? 'All Entities' : et.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card-base overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">
            Audit Records ({logs.length})
          </span>
          <span className="text-xs font-mono text-slate-500">
            Chronological ISO Timestamps
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 font-mono">
            Loading compliance audit records...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <History className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No audit records found</p>
            <p className="text-xs text-slate-500">
              Try adjusting your query or entity filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">User & Role</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Entity</th>
                  <th className="py-2.5 px-4">Target ID</th>
                  <th className="py-2.5 px-4">Audit Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map(log => {
                  const isBlockedAction = log.action.includes('BLOCKED');
                  const isApproval = log.action.includes('APPROVED');
                  const isAck = log.action.includes('ACKNOWLEDGED');

                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isBlockedAction ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {formatDateTime(log.timestamp)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{log.userName}</div>
                        <span className="text-[10px] font-mono px-1 py-0.2 bg-slate-100 text-slate-600 rounded border border-slate-200">
                          {log.userRole}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded border ${
                            isBlockedAction
                              ? 'bg-rose-100 text-rose-800 border-rose-200'
                              : isApproval
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : isAck
                              ? 'bg-sky-50 text-sky-800 border-sky-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {isBlockedAction && <ShieldAlert className="w-3 h-3 text-rose-600" />}
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                        {log.entityType}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {log.entityId}
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-md leading-relaxed font-sans">
                        {log.description}
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
