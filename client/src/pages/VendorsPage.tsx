import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api } from '../services/api';
import { Vendor } from '../types';
import { VendorStatusBadge } from '../components/common/Badge';
import { formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  Search,
  Filter,
  Plus,
  ArrowRight,
} from 'lucide-react';

export const VendorsPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadVendors = async () => {
    try {
      setLoading(true);
      const res = await api.getVendors({ status: statusFilter, search });
      if (res.success && res.data) {
        setVendors(res.data);
      }
    } catch (err) {
      console.error('Failed to load vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadVendors();
  };

  const statuses = [
    'ALL',
    'Approved',
    'Under Review',
    'Submitted',
    'Correction Required',
    'Draft',
    'Rejected',
  ];

  // If a vendor tries to visit /vendors, redirect them to their own dossier
  if (user?.role === 'VENDOR') {
    return <Navigate to={user.vendorId ? `/vendors/${user.vendorId}` : '/dashboard'} replace />;
  }

  const isAuditor = user?.role === 'AUDITOR';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            {isAuditor && (
              <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-amber-100 text-amber-900 rounded border border-amber-200">
                Auditor Inspection View
              </span>
            )}
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Vendor Directory
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralized directory of registered pharmaceutical vendors, corporate contact persons, and tax registrations
          </p>
        </div>

        {hasRole('ADMIN', 'PROCUREMENT') && (
          <Link to="/vendors/new" className="btn-primary text-xs">
            <Plus className="w-3.5 h-3.5" />
            <span>Onboard New Vendor</span>
          </Link>
        )}
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
              placeholder="Search by company name, ID, contact, GSTIN, or city..."
              className="input-base pl-9 text-xs"
            />
          </form>

          {/* Status Filter Tabs / Select */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden md:block" />
            {statuses.map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium whitespace-nowrap transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL' ? 'All Vendors' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="card-base overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-semibold text-slate-700">
            Registered Vendors ({vendors.length})
          </span>
          <span className="text-xs font-mono text-slate-500">
            Active Supplier Registry
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 font-mono">
            Loading vendors directory...
          </div>
        ) : vendors.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No vendors found</p>
            <p className="text-xs text-slate-500">
              Try adjusting your search query or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Vendor ID</th>
                  <th className="py-2.5 px-4">Company Name</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Contact Details</th>
                  <th className="py-2.5 px-4">GSTIN / PAN</th>
                  <th className="py-2.5 px-4">Location</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendors.map(vendor => (
                  <tr key={vendor.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                      {vendor.id}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        to={`/vendors/${vendor.id}`}
                        className="font-semibold text-slate-900 hover:underline block"
                      >
                        {vendor.companyName}
                      </Link>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Reg: {formatDate(vendor.registrationDate)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-[150px] truncate">
                      {vendor.category}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{vendor.contactPerson}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{vendor.email}</div>
                      {vendor.phone && (
                        <div className="text-[11px] text-slate-400 font-mono">{vendor.phone}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-700 font-medium">{vendor.gstNumber || '—'}</div>
                      <div className="text-[11px] text-slate-500 font-mono">PAN: {vendor.panNumber || '—'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-800 font-medium">{vendor.city}, {vendor.state}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{vendor.pincode ? `PIN: ${vendor.pincode}` : ''}</div>
                    </td>
                    <td className="py-3 px-4">
                      <VendorStatusBadge status={vendor.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/vendors/${vendor.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded shadow-sm transition-colors"
                      >
                        <span>View Profile</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
