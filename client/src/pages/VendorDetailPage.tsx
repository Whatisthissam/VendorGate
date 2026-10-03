import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { Vendor, PurchaseOrder } from '../types';
import { VendorStatusBadge, POStatusBadge, ApprovalLevelBadge } from '../components/common/Badge';
import { formatDate, formatCurrency } from '../utils/formatters';
import { DocumentChecklist } from '../components/vendors/DocumentChecklist';
import { EditVendorModal } from '../components/vendors/EditVendorModal';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  FileCheck2,
  FileText,
  Mail,
  Phone,
  MapPin,
  Landmark,
  CreditCard,
  ShieldCheck,
  ArrowLeft,
  PlusCircle,
  Edit3,
} from 'lucide-react';

export const VendorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab') as 'documents' | 'profile' | 'orders' | null;
  const { user, hasRole } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [vendorPOs, setVendorPOs] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'documents' | 'profile' | 'orders'>(
    requestedTab && ['documents', 'profile', 'orders'].includes(requestedTab)
      ? requestedTab
      : user?.role === 'VENDOR'
      ? 'documents'
      : 'profile'
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const loadVendorData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.getVendorById(id);
      if (res.success && res.data) {
        setVendor(res.data);
      }

      // Also fetch POs for this vendor
      const poRes = await api.getPurchaseOrders({ vendorId: id });
      if (poRes.success && poRes.data) {
        setVendorPOs(poRes.data);
      }
    } catch (err) {
      console.error('Failed to load vendor details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendorData();
  }, [id]);

  if (loading || !vendor) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-mono">Loading vendor dossier...</p>
        </div>
      </div>
    );
  }

  // If vendor tries to view another company's dossier, redirect to their own
  if (user?.role === 'VENDOR' && user.vendorId && id !== user.vendorId) {
    return <Navigate to={`/vendors/${user.vendorId}`} replace />;
  }

  const isVendor = user?.role === 'VENDOR';
  const isAuditor = user?.role === 'AUDITOR';

  return (
    <div className="space-y-6">
      {/* Back Link & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to={isVendor ? '/dashboard' : '/vendors'}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              {isVendor && (
                <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-sky-100 text-sky-800 rounded border border-sky-200">
                  My Compliance Dossier
                </span>
              )}
              {isAuditor && (
                <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-amber-100 text-amber-900 rounded border border-amber-200">
                  Auditor Inspection Dossier
                </span>
              )}
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                {vendor.companyName}
              </h1>
              <VendorStatusBadge status={vendor.status} />
              <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">
                {vendor.id}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {vendor.category} • Onboarded {formatDate(vendor.registrationDate)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {(hasRole('ADMIN', 'PROCUREMENT') || (isVendor && user?.vendorId === vendor.id)) && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="btn-secondary text-xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Vendor Details</span>
            </button>
          )}

          {hasRole('ADMIN', 'PROCUREMENT') && (
            <Link
              to={`/purchase-orders/new?vendorId=${vendor.id}`}
              className="btn-primary text-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Raise PO for this Vendor</span>
            </Link>
          )}
        </div>
      </div>

      {/* Verification KPI Overview Banner */}
      <div className="card-base p-4 bg-slate-900 text-white border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-bold text-white tracking-wide">
                Regulatory Dossier Verification Status
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Pharma distribution regulations mandate validation of all 11 compliance certificates before PO release.
            </p>
          </div>

          <div className="flex items-center gap-4 sm:border-l sm:border-slate-800 sm:pl-6 shrink-0">
            <div className="text-right">
              <span className="text-xl font-bold font-mono text-white">
                {vendor.verificationStats.summary}
              </span>
              <p className="text-[11px] text-slate-400">
                {vendor.verificationStats.progressPercent}% Mandatory Complete
              </p>
            </div>
            <div className="w-24 bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  vendor.verificationStats.progressPercent === 100
                    ? 'bg-emerald-500'
                    : 'bg-amber-400'
                }`}
                style={{ width: `${vendor.verificationStats.progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('documents')}
          className={`pb-3 flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'documents'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>11 Compliance Documents ({vendor.documents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'profile'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Statutory & Bank Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'orders'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Associated POs ({vendorPOs.length})</span>
        </button>
      </div>

      {/* Tab 1: 11 Compliance Documents Checklist */}
      {activeTab === 'documents' && (
        <DocumentChecklist
          vendorId={vendor.id}
          documents={vendor.documents}
          onDocumentUpdated={loadVendorData}
        />
      )}

      {/* Tab 2: Profile & Statutory Data */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Statutory Tax & Business Information */}
          <div className="card-base p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <CreditCard className="w-4 h-4 text-slate-500" />
              <span>Tax & Statutory Identification</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">GST Identification Number (GSTIN):</span>
                <span className="font-mono font-bold text-slate-900">{vendor.gstNumber || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Permanent Account Number (PAN):</span>
                <span className="font-mono font-bold text-slate-900">{vendor.panNumber || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Contact Person:</span>
                <span className="text-slate-900 font-medium">{vendor.contactPerson}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Official Email:</span>
                <span className="font-mono text-slate-900">{vendor.email}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Phone Number:</span>
                <span className="font-mono text-slate-900">{vendor.phone}</span>
              </div>
            </div>
          </div>

          {/* Banking & Registered Premises */}
          <div className="card-base p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Landmark className="w-4 h-4 text-slate-500" />
              <span>Banking & Settlement Coordinates</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Bank Name:</span>
                <span className="font-medium text-slate-900">{vendor.bankName || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Account Number:</span>
                <span className="font-mono font-bold text-slate-900">{vendor.accountNumber || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">IFSC Branch Code:</span>
                <span className="font-mono font-bold text-slate-900">{vendor.ifscCode || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Registered Address:</span>
                <span className="text-slate-800 text-right max-w-xs">{vendor.address}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">City & State:</span>
                <span className="text-slate-800">{vendor.city}, {vendor.state} - {vendor.pincode}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Associated Purchase Orders */}
      {activeTab === 'orders' && (
        <div className="card-base overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">
              Orders Issued to {vendor.companyName} ({vendorPOs.length})
            </span>
          </div>

          {vendorPOs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No purchase orders raised for this vendor yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">PO Number</th>
                    <th className="py-2.5 px-4">Product / Item</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                    <th className="py-2.5 px-4">Approval Tier</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Required Delivery</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vendorPOs.map(po => (
                    <tr key={po.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        {po.poNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium">
                        {po.productService}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(po.totalAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <ApprovalLevelBadge level={po.requiredApprovalLevel} />
                      </td>
                      <td className="py-3 px-4">
                        <POStatusBadge status={po.status} />
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {formatDate(po.requiredDate)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/purchase-orders/${po.id}`}
                          className="text-xs text-slate-700 hover:text-slate-950 underline font-medium"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Edit Vendor Information Modal (FR-03) */}
      {isEditModalOpen && (
        <EditVendorModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          vendor={vendor}
          onSuccess={updated => {
            setVendor(updated);
            setIsEditModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
