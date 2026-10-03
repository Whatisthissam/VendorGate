import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { PurchaseOrder } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import { canApprovePO, getApprovalLevelDescription } from '../../utils/approvalRules';
import { ShieldAlert, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface ApprovalActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseOrder;
  onSuccess: () => void;
}

export const ApprovalActionModal: React.FC<ApprovalActionModalProps> = ({
  isOpen,
  onClose,
  purchaseOrder,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [blockedAlertMessage, setBlockedAlertMessage] = useState<string | null>(null);

  // Authority check
  const authorityCheck = canApprovePO(user, purchaseOrder.requiredApprovalLevel);

  const handleApprove = async () => {
    // Client-side verification
    if (!authorityCheck.allowed) {
      setBlockedAlertMessage(authorityCheck.reason || 'Insufficient approval authority.');
      return;
    }

    try {
      setLoading(true);
      await api.approvePurchaseOrder(purchaseOrder.id, comments);
      success(
        'Purchase Order Approved',
        `${purchaseOrder.poNumber} has been authorized under Level ${user?.approvalLevel || 4} authority.`
      );
      onSuccess();
    } catch (err: any) {
      if (err.data && err.data.blocked) {
        setBlockedAlertMessage(err.data.message);
      } else {
        error('Approval Failed', err.message || 'Could not approve PO.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!comments.trim()) {
      error('Reason Required', 'Please enter a justification comment for rejecting this purchase order.');
      return;
    }

    try {
      setLoading(true);
      await api.rejectPurchaseOrder(purchaseOrder.id, comments);
      success(
        'Purchase Order Rejected',
        `${purchaseOrder.poNumber} has been marked as Rejected.`
      );
      onSuccess();
    } catch (err: any) {
      error('Rejection Failed', err.message || 'Could not reject purchase order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Purchase Order Authorization: ${purchaseOrder.poNumber}`}
      subtitle={`Total Value: ${formatCurrency(purchaseOrder.totalAmount)}`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* PO & Approver Authority Card */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Vendor:</span>
            <span className="font-semibold text-slate-900">{purchaseOrder.vendorName}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Line Item:</span>
            <span className="font-mono text-slate-800">{purchaseOrder.productService}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Total Amount:</span>
            <span className="font-bold text-slate-900 text-sm font-mono">
              {formatCurrency(purchaseOrder.totalAmount)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/80">
            <span className="text-slate-600 font-medium">Required Approval Tier:</span>
            <span className="font-semibold font-mono text-slate-900">
              {getApprovalLevelDescription(purchaseOrder.requiredApprovalLevel)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Your Current Authority:</span>
            <span className="font-semibold font-mono text-indigo-700">
              {user?.role === 'ADMIN'
                ? 'System Admin (Super-User)'
                : user?.approvalLevel
                ? `Level ${user.approvalLevel} (${user.limitDescription || 'Restricted'})`
                : 'No Approval Rights'}
            </span>
          </div>
        </div>

        {/* POLICY GATING BANNER (Crucial demo display) */}
        {(!authorityCheck.allowed || blockedAlertMessage) && (
          <div className="p-4 bg-rose-50 border border-rose-300 rounded-lg text-rose-900 space-y-1.5 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-sm text-rose-800">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
              <span>Approval Restricted</span>
            </div>
            <p className="text-xs text-rose-700 leading-relaxed font-medium">
              {blockedAlertMessage || authorityCheck.reason}
            </p>
            <p className="text-[11px] text-rose-600 italic">
              Note: This restriction prevents approval limit bypass and enforces organizational compliance policies.
            </p>
          </div>
        )}

        {/* Approver Comments */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700">
              Approver Comments / Audit Log Note
            </label>
            <span className="text-[10px] text-slate-500 font-mono">Viva Quick Remarks:</span>
          </div>

          {/* Quick-fill chips */}
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <button
              type="button"
              onClick={() => setComments(`Verified formulation batch quality & pricing. Authorized under Level ${user?.approvalLevel || 1} authority.`)}
              className="px-2 py-0.5 text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded border border-emerald-200 transition-colors"
            >
              ⚡ Fill "Approval Remarks"
            </button>
            <button
              type="button"
              onClick={() => setComments('Rejected: Batch analytical assay report discrepancy and delivery timeline shortfall.')}
              className="px-2 py-0.5 text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-800 rounded border border-rose-200 transition-colors"
            >
              ⚡ Fill "Rejection Reason"
            </button>
          </div>

          <textarea
            rows={3}
            value={comments}
            onChange={e => setComments(e.target.value)}
            placeholder="Add regulatory authorization comments or rejection reason..."
            className="input-base"
          />
        </div>

        {/* Actions */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-2 justify-end">
          <button
            type="button"
            onClick={handleReject}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors disabled:opacity-50"
          >
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>Reject Purchase Order</span>
          </button>

          <button
            type="button"
            onClick={handleApprove}
            disabled={loading || !authorityCheck.allowed}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Authorize & Approve PO</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
