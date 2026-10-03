import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { PurchaseOrder } from '../types';
import { POStatusBadge, ApprovalLevelBadge } from '../components/common/Badge';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';
import { canApprovePO, getApprovalLevelDescription } from '../utils/approvalRules';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ApprovalActionModal } from '../components/purchaseOrders/ApprovalActionModal';
import { VendorAcknowledgeModal } from '../components/purchaseOrders/VendorAcknowledgeModal';
import {
  FileText,
  Building2,
  Calendar,
  Layers,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Send,
  ShieldAlert,
  PackageCheck,
  History,
  Lock,
  UserCheck,
} from 'lucide-react';

export const PODetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { success, error } = useToast();

  const [po, setPO] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isAckModalOpen, setIsAckModalOpen] = useState(false);
  const [isSendingToVendor, setIsSendingToVendor] = useState(false);
  const [isSubmittingPO, setIsSubmittingPO] = useState(false);

  const handleSubmitPO = async () => {
    if (!po) return;
    try {
      setIsSubmittingPO(true);
      const res = await api.submitPurchaseOrder(po.id);
      if (res.success && res.data) {
        success(
          'PO Submitted for Approval',
          `Purchase Order ${po.poNumber} has been submitted for Level ${res.data.requiredApprovalLevel} authorization.`
        );
        loadPO();
      }
    } catch (err: any) {
      error('Submission Error', err.message || 'Failed to submit purchase order.');
    } finally {
      setIsSubmittingPO(false);
    }
  };

  const loadPO = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.getPurchaseOrderById(id);
      if (res.success && res.data) {
        setPO(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load purchase order:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPO();
  }, [id]);

  const handleSendToVendor = async () => {
    if (!po) return;
    try {
      setIsSendingToVendor(true);
      await api.sendPOToVendor(po.id);
      success('PO Transmitted', `Purchase Order ${po.poNumber} transmitted to vendor portal.`);
      loadPO();
    } catch (err: any) {
      error('Transmission Error', err.message || 'Failed to transmit PO to vendor.');
    } finally {
      setIsSendingToVendor(false);
    }
  };

  if (loading || !po) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-mono">Loading purchase order dossier...</p>
        </div>
      </div>
    );
  }

  // Authority calculation for the active user
  const authorityCheck = canApprovePO(user, po.requiredApprovalLevel);
  const isApproverUser = user?.role === 'APPROVER' || user?.role === 'ADMIN';
  const isVendorUser = user?.role === 'VENDOR';
  const isProcurementUser = hasRole('ADMIN', 'PROCUREMENT');

  // Lifecycle stage check
  const lifecycleStages = [
    { label: 'Draft', active: ['Draft', 'Submitted', 'Pending Approval', 'Approved', 'Sent to Vendor', 'Acknowledged', 'Rejected', 'Vendor Rejected'].includes(po.status) },
    { label: 'Pending Approval', active: ['Pending Approval', 'Approved', 'Sent to Vendor', 'Acknowledged'].includes(po.status) },
    { label: 'Approved', active: ['Approved', 'Sent to Vendor', 'Acknowledged'].includes(po.status) },
    { label: 'Sent to Vendor', active: ['Sent to Vendor', 'Acknowledged'].includes(po.status) },
    { label: 'Acknowledged', active: po.status === 'Acknowledged' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/purchase-orders"
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 font-mono">
                {po.poNumber}
              </h1>
              <POStatusBadge status={po.status} />
              <ApprovalLevelBadge level={po.requiredApprovalLevel} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Created by {po.createdBy} on {formatDate(po.createdAt)}
            </p>
          </div>
        </div>

        {/* Action Buttons based on Role & State */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Draft: Procurement submits for approval (FR-05) */}
          {po.status === 'Draft' && isProcurementUser && (
            <button
              onClick={handleSubmitPO}
              disabled={isSubmittingPO}
              className="btn-primary text-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmittingPO ? 'Submitting...' : 'Submit PO for Approval'}</span>
            </button>
          )}

          {/* Pending Approval: Approver action buttons */}
          {po.status === 'Pending Approval' && (
            <button
              onClick={() => setIsApprovalModalOpen(true)}
              className="btn-primary text-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Review Authorization (Level {po.requiredApprovalLevel})</span>
            </button>
          )}

          {/* Approved: Procurement transmits to Vendor */}
          {po.status === 'Approved' && isProcurementUser && (
            <button
              onClick={handleSendToVendor}
              disabled={isSendingToVendor}
              className="btn-primary text-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Transmit PO to Vendor</span>
            </button>
          )}

          {/* Sent to Vendor / Approved: Vendor Acknowledgement */}
          {(po.status === 'Sent to Vendor' || po.status === 'Approved') && isVendorUser && (
            <button
              onClick={() => setIsAckModalOpen(true)}
              className="btn-success text-xs"
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>Acknowledge / Respond to PO</span>
            </button>
          )}
        </div>
      </div>

      {/* Lifecycle Progress Bar */}
      <div className="card-base p-4 bg-white">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span className="font-semibold text-slate-700">Requisition Lifecycle Progression</span>
          <span className="font-mono text-slate-500">Status: {po.status}</span>
        </div>
        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          {lifecycleStages.map((stage, idx) => (
            <div key={idx} className="space-y-1.5">
              <div
                className={`h-2 rounded-full transition-colors ${
                  po.status === 'Rejected' || po.status === 'Vendor Rejected'
                    ? idx === 0
                      ? 'bg-slate-800'
                      : 'bg-rose-400'
                    : stage.active
                    ? 'bg-slate-900'
                    : 'bg-slate-200'
                }`}
              />
              <span
                className={`block text-[11px] truncate ${
                  stage.active ? 'font-semibold text-slate-900' : 'text-slate-400'
                }`}
              >
                {stage.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* APPROVAL RESTRICTION GATING BANNER (Crucial Presentation Demo Step 14) */}
      {po.status === 'Pending Approval' && isApproverUser && !authorityCheck.allowed && (
        <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-xl text-rose-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-rose-800">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <span>Approval Restricted</span>
          </div>
          <p className="text-xs text-rose-800 leading-relaxed font-semibold">
            Your approval authority is Level {user?.approvalLevel || 0}. This PO requires Level {po.requiredApprovalLevel} approval.
          </p>
          <div className="text-[11px] text-rose-700 bg-rose-100/70 p-2 rounded font-sans">
            <strong>System Policy Gate:</strong> To eliminate unauthorized purchases and preserve strict segregation of duties, the system enforces exact-tier authorization. Level {po.requiredApprovalLevel} purchase orders must be approved exclusively by a Level {po.requiredApprovalLevel} Approver.
          </div>
        </div>
      )}

      {/* Main Order Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Item details & financial calculations */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card-base p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-700" />
                <h2 className="text-sm font-bold text-slate-900">Line Item Requisition</h2>
              </div>
              <span className="text-xs font-mono text-slate-500">Fixed Rate Supply</span>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">{po.productService}</h3>
                {po.description && (
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{po.description}</p>
                )}
              </div>

              {/* Table of calculation */}
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-700">
                    <tr>
                      <th className="py-2.5 px-4">Item Detail</th>
                      <th className="py-2.5 px-4 text-right">Quantity</th>
                      <th className="py-2.5 px-4 text-right">Unit Price</th>
                      <th className="py-2.5 px-4 text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 font-mono">
                    <tr>
                      <td className="py-3 px-4 font-sans text-slate-800 font-medium">
                        {po.productService}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-900">
                        {po.quantity.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-900">
                        ₹{po.unitPrice.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-950 text-sm">
                        {formatCurrency(po.totalAmount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Delivery and logistics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Target Delivery Date</span>
                  </span>
                  <span className="font-semibold text-slate-900 font-mono text-sm">
                    {formatDate(po.requiredDate)}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5 mb-1">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Calculated Authority Threshold</span>
                  </span>
                  <span className="font-semibold text-indigo-700 font-mono">
                    {getApprovalLevelDescription(po.requiredApprovalLevel)}
                  </span>
                </div>
              </div>

              {po.notes && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <span className="font-semibold text-slate-700">Special Instructions / Logistics:</span>
                  <p className="text-slate-600 mt-0.5">{po.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Audit & Approval History Timeline */}
          <div className="card-base p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <History className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-bold text-slate-900">
                Audited Approval & Acknowledgement Log
              </h2>
            </div>

            {po.approvalHistory && po.approvalHistory.length > 0 ? (
              <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {po.approvalHistory.map((h, idx) => (
                  <div key={idx} className="relative pl-7 text-xs">
                    <div className="absolute left-1.5 top-1 w-3 h-3 rounded-full bg-slate-800 border-2 border-white ring-1 ring-slate-300" />
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 font-mono text-[11px] px-1.5 py-0.2 bg-slate-100 rounded">
                        {h.action}
                      </span>
                      <span className="font-semibold text-slate-800">{h.user}</span>
                      <span className="text-slate-500">({h.role})</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500 font-mono">{formatDateTime(h.timestamp)}</span>
                    </div>
                    {h.comments && (
                      <p className="mt-1 text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 italic">
                        "{h.comments}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No historical approvals recorded yet.</p>
            )}

            {/* Vendor Acknowledgement Details */}
            {po.vendorAcknowledgement && (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
                    <PackageCheck className="w-4 h-4 text-emerald-700" />
                    <span>Vendor Response: {po.vendorAcknowledgement.status}</span>
                  </span>
                  <span className="font-mono text-emerald-700">
                    {formatDateTime(po.vendorAcknowledgement.timestamp)}
                  </span>
                </div>
                <p className="text-emerald-800">
                  Responded by: <strong>{po.vendorAcknowledgement.acknowledgedBy}</strong>
                </p>
                {po.vendorAcknowledgement.comments && (
                  <p className="text-emerald-700 italic mt-1">
                    "{po.vendorAcknowledgement.comments}"
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Vendor Card & Quick Approver Switcher */}
        <div className="space-y-6">
          {/* Vendor Card */}
          <div className="card-base p-5 space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>Contracted Vendor</span>
            </h3>
            <div>
              <Link
                to={`/vendors/${po.vendorId}`}
                className="text-sm font-bold text-slate-900 hover:underline block"
              >
                {po.vendorName}
              </Link>
              <span className="text-xs font-mono text-slate-500">{po.vendorId}</span>
            </div>
            <div className="pt-2 border-t border-slate-100 text-xs">
              <Link
                to={`/vendors/${po.vendorId}`}
                className="text-xs text-slate-700 hover:text-slate-950 font-medium underline flex items-center gap-1"
              >
                <span>View Full Vendor Dossier & 11 Documents</span>
              </Link>
            </div>
          </div>

          {/* Presentation Helper Card: What should the presenter do? */}
          <div className="card-base p-4 bg-slate-900 text-white space-y-2.5">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>Presentation Testing Card</span>
            </h3>
            <div className="text-xs text-slate-300 space-y-1.5 leading-relaxed">
              <p>
                This PO requires <strong>Level {po.requiredApprovalLevel}</strong> authorization.
              </p>
              <div className="p-2 bg-slate-800/80 rounded border border-slate-700 text-[11px] font-mono space-y-1">
                <div>• Level 2 User: Blocked from approval</div>
                <div>• Level 3/4 User: Permitted to approve</div>
                <div>• Vendor: Can acknowledge once approved</div>
              </div>
              <p className="text-[11px] text-slate-400">
                Switch users via the top-right persona menu to verify these transitions live.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      {isApprovalModalOpen && (
        <ApprovalActionModal
          isOpen={isApprovalModalOpen}
          onClose={() => setIsApprovalModalOpen(false)}
          purchaseOrder={po}
          onSuccess={() => {
            setIsApprovalModalOpen(false);
            loadPO();
          }}
        />
      )}

      {/* Vendor Acknowledgement Modal */}
      {isAckModalOpen && (
        <VendorAcknowledgeModal
          isOpen={isAckModalOpen}
          onClose={() => setIsAckModalOpen(false)}
          purchaseOrder={po}
          onSuccess={() => {
            setIsAckModalOpen(false);
            loadPO();
          }}
        />
      )}
    </div>
  );
};
