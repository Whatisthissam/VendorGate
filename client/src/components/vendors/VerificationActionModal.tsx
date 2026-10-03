import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { VendorDocument } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { CheckCircle2, XCircle, AlertTriangle, FileText } from 'lucide-react';

interface VerificationActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorId: string;
  document: VendorDocument;
  onSuccess: () => void;
}

export const VerificationActionModal: React.FC<VerificationActionModalProps> = ({
  isOpen,
  onClose,
  vendorId,
  document,
  onSuccess,
}) => {
  const { success, error } = useToast();
  const [remarks, setRemarks] = useState(document.remarks || '');
  const [loading, setLoading] = useState(false);

  const handleAction = async (status: 'Verified' | 'Rejected' | 'Uploaded') => {
    try {
      setLoading(true);
      await api.verifyDocument(vendorId, document.id, status, remarks);
      success(
        'Document Updated',
        `Document '${document.name}' has been marked as '${status}'.`
      );
      onSuccess();
    } catch (err: any) {
      error('Verification Error', err.message || 'Failed to update document status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Verify Vendor Compliance Document"
      subtitle={`Dossier Item: ${document.name}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Document summary box */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Document Type</span>
            <span className="text-xs font-mono text-slate-600">{document.category}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">File Name</span>
            <span className="text-xs font-mono text-slate-600 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              {document.fileName || 'Pending upload'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Current Status</span>
            <span className="text-xs font-medium text-slate-800">{document.status}</span>
          </div>
        </div>

        {/* Verification comments / audit remarks input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Verification Remarks / Auditor Comments
          </label>
          <textarea
            rows={3}
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            placeholder="e.g. Verified with state drug licensing authority / Stamp legible..."
            className="input-base"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            These comments will be permanently recorded in the immutable compliance audit trail.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-2 justify-end">
          <button
            type="button"
            onClick={() => handleAction('Rejected')}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors disabled:opacity-50"
          >
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>Reject Document</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction('Uploaded')}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors disabled:opacity-50"
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Request Correction</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction('Verified')}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors disabled:opacity-50 shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Verify & Approve</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
