import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { PurchaseOrder } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { CheckCircle2, XCircle, PackageCheck } from 'lucide-react';

interface VendorAcknowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseOrder;
  onSuccess: () => void;
}

export const VendorAcknowledgeModal: React.FC<VendorAcknowledgeModalProps> = ({
  isOpen,
  onClose,
  purchaseOrder,
  onSuccess,
}) => {
  const { success, error } = useToast();
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: 'ACKNOWLEDGE' | 'REJECT') => {
    if (action === 'REJECT' && !comments.trim()) {
      error('Reason Required', 'Please provide a reason why your company is declining this purchase order.');
      return;
    }

    try {
      setLoading(true);
      await api.acknowledgePurchaseOrder(purchaseOrder.id, action, comments);
      if (action === 'ACKNOWLEDGE') {
        success('PO Acknowledged', `Purchase Order ${purchaseOrder.poNumber} has been acknowledged.`);
      } else {
        success('PO Declined', `Purchase Order ${purchaseOrder.poNumber} was declined.`);
      }
      onSuccess();
    } catch (err: any) {
      error('Action Failed', err.message || 'Could not process vendor acknowledgement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Vendor Order Acknowledgement: ${purchaseOrder.poNumber}`}
      subtitle={`Customer Requisition: ${purchaseOrder.vendorName}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Order Details summary */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Requisition Item:</span>
            <span className="font-semibold text-slate-900">{purchaseOrder.productService}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Quantity Ordered:</span>
            <span className="font-mono text-slate-900">{purchaseOrder.quantity} units</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Total Contract Value:</span>
            <span className="font-bold font-mono text-slate-900">{formatCurrency(purchaseOrder.totalAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Required Delivery Date:</span>
            <span className="font-mono text-slate-900">{formatDate(purchaseOrder.requiredDate)}</span>
          </div>
        </div>

        {/* Vendor Notes */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700">
              Vendor Dispatch Notes / Delivery Confirmation
            </label>
            <span className="text-[10px] text-slate-500 font-mono">Viva Quick Notes:</span>
          </div>

          {/* Quick-fill chips */}
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <button
              type="button"
              onClick={() => setComments('Order confirmed by supplier dispatch team. Production allocation complete, delivery scheduled within 5 business days.')}
              className="px-2 py-0.5 text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded border border-emerald-200 transition-colors"
            >
              ⚡ Fill "Acceptance Note"
            </button>
            <button
              type="button"
              onClick={() => setComments('Declined: Inability to meet required delivery schedule due to active ingredient raw material stock-out.')}
              className="px-2 py-0.5 text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-800 rounded border border-rose-200 transition-colors"
            >
              ⚡ Fill "Decline Reason"
            </button>
          </div>

          <textarea
            rows={3}
            value={comments}
            onChange={e => setComments(e.target.value)}
            placeholder="e.g. Order confirmed. Scheduled dispatch date Oct 14 via cold chain..."
            className="input-base"
          />
        </div>

        {/* Actions */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-2 justify-end">
          <button
            type="button"
            onClick={() => handleAction('REJECT')}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors disabled:opacity-50"
          >
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>Decline / Reject PO</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction('ACKNOWLEDGE')}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors disabled:opacity-50 shadow-sm"
          >
            <PackageCheck className="w-4 h-4 text-emerald-400" />
            <span>Acknowledge & Accept Order</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
