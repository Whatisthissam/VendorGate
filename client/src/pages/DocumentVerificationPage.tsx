import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api } from '../services/api';
import { Vendor } from '../types';
import { DocumentChecklist } from '../components/vendors/DocumentChecklist';
import { useAuth } from '../context/AuthContext';
import {
  FileCheck2,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Building2,
  FileText,
} from 'lucide-react';

export const DocumentVerificationPage: React.FC = () => {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [complianceFilter, setComplianceFilter] = useState<'ALL' | 'COMPLIANT' | 'PARTIAL' | 'PENDING'>('ALL');
  const [expandedVendorId, setExpandedVendorId] = useState<string | null>(null);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const res = await api.getVendors({ search });
      if (res.success && res.data) {
        setVendors(res.data);
      }
    } catch (err) {
      console.error('Failed to load vendors for document verification:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadVendors();
  };

  // If a vendor tries to visit /documents, redirect them to their compliance dossier
  if (user?.role === 'VENDOR') {
    return <Navigate to={user.vendorId ? `/vendors/${user.vendorId}?tab=documents` : '/dashboard'} replace />;
  }

  const isAuditor = user?.role === 'AUDITOR';

  // Metrics calculation
  const totalVendors = vendors.length;
  const compliantVendors = vendors.filter(v => v.verificationStats?.progressPercent === 100).length;
  const partialVendors = vendors.filter(
    v => (v.verificationStats?.progressPercent || 0) > 0 && (v.verificationStats?.progressPercent || 0) < 100
  ).length;
  const pendingVendors = vendors.filter(v => (v.verificationStats?.progressPercent || 0) === 0).length;

  const totalDocuments = vendors.reduce((acc, v) => acc + (v.documents?.length || 0), 0);
  const totalVerifiedDocs = vendors.reduce(
    (acc, v) => acc + (v.documents?.filter(d => d.status === 'Verified').length || 0),
    0
  );

  // Filter vendors based on compliance filter
  const filteredVendors = vendors.filter(vendor => {
    const percent = vendor.verificationStats?.progressPercent || 0;
    if (complianceFilter === 'COMPLIANT') return percent === 100;
    if (complianceFilter === 'PARTIAL') return percent > 0 && percent < 100;
    if (complianceFilter === 'PENDING') return percent === 0;
    return true;
  });

  const toggleExpand = (vendorId: string) => {
    setExpandedVendorId(prev => (prev === vendorId ? null : vendorId));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            {isAuditor && (
              <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-amber-100 text-amber-900 rounded border border-amber-200">
                Auditor Compliance Inspection
              </span>
            )}
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-6 h-6 text-slate-700" />
              Document Verification & Statutory Compliance
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Mandatory 11-document pharma distributor dossiers, statutory certificates, and regulatory verification audits
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-base p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Vendors in Scope</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">{totalVendors}</div>
          <div className="text-[11px] text-slate-500 mt-1">Total registered suppliers</div>
        </div>

        <div className="card-base p-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Fully Compliant (11/11)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-2">{compliantVendors}</div>
          <div className="text-[11px] text-slate-500 mt-1">Ready for Purchase Order release</div>
        </div>

        <div className="card-base p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Partially Verified</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-2">{partialVendors}</div>
          <div className="text-[11px] text-slate-500 mt-1">Verification in progress</div>
        </div>

        <div className="card-base p-4 border-l-4 border-l-sky-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Statutory Documents</span>
            <ShieldCheck className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-sky-700 mt-2">
            {totalVerifiedDocs} <span className="text-sm font-normal text-slate-400">/ {totalDocuments}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Total certificates verified</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="card-base p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by vendor name, ID, or category..."
              className="input-base pl-9 text-xs"
            />
          </form>

          {/* Compliance Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden md:block" />
            {(
              [
                { id: 'ALL', label: 'All Vendors' },
                { id: 'COMPLIANT', label: `100% Compliant (${compliantVendors})` },
                { id: 'PARTIAL', label: `In Progress (${partialVendors})` },
                { id: 'PENDING', label: `Pending (${pendingVendors})` },
              ] as const
            ).map(tab => (
              <button
                key={tab.id}
                onClick={() => setComplianceFilter(tab.id)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium whitespace-nowrap transition-colors ${
                  complianceFilter === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Document Verification Table */}
      <div className="card-base overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-semibold text-slate-700">
            Vendor Statutory Compliance Status ({filteredVendors.length})
          </span>
          <span className="text-xs font-mono text-slate-500">
            11-Document Statutory Dossier Standard
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 font-mono">
            Loading document verification records...
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No matching vendors found</p>
            <p className="text-xs text-slate-500">
              Try adjusting your search criteria or compliance filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredVendors.map(vendor => {
              const isExpanded = expandedVendorId === vendor.id;
              const stats = vendor.verificationStats || {
                progressPercent: 0,
                verifiedCount: 0,
                totalCount: 11,
                summary: '0/11 Verified',
              };
              const verifiedDocs = vendor.documents?.filter(d => d.status === 'Verified').length || 0;
              const uploadedDocs = vendor.documents?.filter(d => d.status === 'Uploaded').length || 0;
              const pendingDocs = vendor.documents?.filter(d => d.status === 'Pending' || d.status === 'Rejected').length || 0;

              return (
                <div key={vendor.id} className="transition-colors">
                  {/* Vendor Summary Row */}
                  <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/60">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 bg-slate-100 rounded-md border border-slate-200 shrink-0">
                        <FileCheck2 className={`w-5 h-5 ${stats.progressPercent === 100 ? 'text-emerald-600' : 'text-slate-500'}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            to={`/vendors/${vendor.id}?tab=documents`}
                            className="font-semibold text-sm text-slate-900 hover:underline"
                          >
                            {vendor.companyName}
                          </Link>
                          <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">
                            {vendor.id}
                          </span>
                          <span className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                            {vendor.category}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                          <span>Contact: <strong className="text-slate-700">{vendor.contactPerson}</strong></span>
                          <span>GSTIN: <span className="font-mono text-slate-700">{vendor.gstNumber || '—'}</span></span>
                          <span>State: <span className="text-slate-700">{vendor.state}</span></span>
                        </div>
                      </div>
                    </div>

                    {/* Verification Progress & Breakdown */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6 shrink-0">
                      {/* Progress Bar */}
                      <div className="w-full sm:w-44">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-mono font-medium text-slate-700">{stats.summary}</span>
                          <span className="font-mono font-semibold text-slate-900">{stats.progressPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              stats.progressPercent === 100
                                ? 'bg-emerald-600'
                                : stats.progressPercent >= 50
                                ? 'bg-amber-500'
                                : 'bg-slate-400'
                            }`}
                            style={{ width: `${stats.progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Document Status Counts */}
                      <div className="flex items-center gap-2 text-[11px] font-mono">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">
                          {verifiedDocs} Verified
                        </span>
                        {uploadedDocs > 0 && (
                          <span className="px-2 py-0.5 bg-sky-50 text-sky-800 border border-sky-200 rounded">
                            {uploadedDocs} Uploaded
                          </span>
                        )}
                        {pendingDocs > 0 && (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded">
                            {pendingDocs} Action Req
                          </span>
                        )}
                      </div>

                      {/* Interactive Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleExpand(vendor.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
                            isExpanded
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300'
                          }`}
                        >
                          <span>{isExpanded ? 'Hide Checklist' : 'Inspect 11 Documents'}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <Link
                          to={`/vendors/${vendor.id}?tab=documents`}
                          title="Open Full Dossier"
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Checklist Sub-Section */}
                  {isExpanded && (
                    <div className="p-4 bg-slate-50/80 border-t border-slate-200">
                      <div className="max-w-5xl mx-auto space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800">
                            Regulatory Dossier Checklist for {vendor.companyName}
                          </span>
                          <span className="font-mono text-slate-500">
                            {isAuditor ? 'Read-Only Audit Mode' : 'Verify, approve, or reject documents'}
                          </span>
                        </div>
                        <DocumentChecklist
                          vendorId={vendor.id}
                          documents={vendor.documents || []}
                          onDocumentUpdated={loadVendors}
                          readOnly={isAuditor}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
