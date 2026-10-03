import React, { useState } from 'react';
import { VendorDocument, DocumentStatus } from '../../types';
import { DocumentStatusBadge } from '../common/Badge';
import { formatDate } from '../../utils/formatters';
import {
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Upload,
  Download,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { VerificationActionModal } from './VerificationActionModal';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface DocumentChecklistProps {
  vendorId: string;
  documents: VendorDocument[];
  onDocumentUpdated: () => void;
  readOnly?: boolean;
}

export const DocumentChecklist: React.FC<DocumentChecklistProps> = ({
  vendorId,
  documents,
  onDocumentUpdated,
  readOnly = false,
}) => {
  const { user, hasRole } = useAuth();
  const { success, error } = useToast();
  const [selectedDoc, setSelectedDoc] = useState<VendorDocument | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);

  const canVerify = hasRole('ADMIN', 'PROCUREMENT') && !readOnly;
  const isVendor = user?.role === 'VENDOR' && !readOnly;

  const handleOpenVerifyModal = (doc: VendorDocument) => {
    setSelectedDoc(doc);
    setIsModalOpen(true);
  };

  const handleSimulateUpload = async (doc: VendorDocument) => {
    try {
      setUploadingDocId(doc.id);
      await api.uploadDocument(vendorId, doc.id, `${doc.documentTypeId}_signed_2026.pdf`);
      success('File Uploaded', `Simulated file uploaded for '${doc.name}'.`);
      onDocumentUpdated();
    } catch (err: any) {
      error('Upload Failed', err.message || 'Could not upload document.');
    } finally {
      setUploadingDocId(null);
    }
  };

  return (
    <>
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Regulatory Compliance Checklist (11 Documents)
            </h3>
            <p className="text-xs text-slate-500">
              Standard pharma distributor verification dossier
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {documents.filter(d => d.status === 'Verified').length} / {documents.length} Completed
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {documents.map((doc, idx) => (
            <div
              key={doc.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0">
                <span className="text-xs font-mono text-slate-400 w-5 text-right mt-0.5 shrink-0">
                  {String(idx + 1).padStart(2, '0')}.
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-medium text-slate-900 leading-snug">
                      {doc.name}
                    </h4>
                    <DocumentStatusBadge status={doc.status} />
                    <span className="text-[10px] font-mono text-slate-500 px-1.5 py-0.2 bg-slate-100 rounded border border-slate-200">
                      {doc.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                    {doc.fileName ? (
                      <span className="flex items-center gap-1 font-mono text-slate-600">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        {doc.fileName} ({doc.fileSize || '1.5 MB'})
                      </span>
                    ) : (
                      <span className="italic text-slate-400">No document attached</span>
                    )}

                    {doc.verifiedAt && (
                      <span className="text-slate-500">
                        • Verified by {doc.verifiedBy} on {formatDate(doc.verifiedAt)}
                      </span>
                    )}
                  </div>

                  {doc.remarks && (
                    <p className="mt-1 text-xs text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-200/60 font-sans">
                      <span className="font-semibold text-slate-700">Remarks:</span> {doc.remarks}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {/* Simulated file download */}
                {doc.fileName && (
                  <button
                    onClick={() => success('Viewing Document', `Opening verified copy of ${doc.name}...`)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                    title="Preview file"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}

                {/* Simulated Vendor Upload button */}
                {isVendor && (
                  <button
                    onClick={() => handleSimulateUpload(doc)}
                    disabled={uploadingDocId === doc.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{doc.fileName ? 'Re-upload' : 'Upload'}</span>
                  </button>
                )}

                {/* Procurement Officer Verification trigger */}
                {canVerify && (
                  <button
                    onClick={() => handleOpenVerifyModal(doc)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-md transition-colors shadow-sm"
                  >
                    <span>Inspect & Verify</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedDoc && (
        <VerificationActionModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedDoc(null);
          }}
          vendorId={vendorId}
          document={selectedDoc}
          onSuccess={() => {
            onDocumentUpdated();
            setIsModalOpen(false);
            setSelectedDoc(null);
          }}
        />
      )}
    </>
  );
};
