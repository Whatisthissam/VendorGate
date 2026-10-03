import { store } from '../data/store.js';
import { DOCUMENT_STATUS, VENDOR_STATUS } from '../utils/constants.js';

export function getVendorDocuments(req, res) {
  const { id } = req.params;
  const vendor = store.getVendorById(id);

  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: `Vendor with ID '${id}' not found.`,
    });
  }

  res.json({
    success: true,
    vendorId: vendor.id,
    companyName: vendor.companyName,
    verificationStats: vendor.verificationStats,
    status: vendor.status,
    documents: vendor.documents,
  });
}

/**
 * Verify, Reject, or Request Correction on a vendor's document
 */
export function verifyDocument(req, res) {
  const { vendorId, documentId } = req.params;
  const { status, remarks } = req.body;

  if (!status || !Object.values(DOCUMENT_STATUS).includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid document verification status '${status}'. Must be one of: ${Object.values(DOCUMENT_STATUS).join(', ')}`,
    });
  }

  const vendor = store.getVendorById(vendorId);
  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: `Vendor with ID '${vendorId}' not found.`,
    });
  }

  const docIndex = vendor.documents.findIndex(d => d.id === documentId || d.documentTypeId === documentId);
  if (docIndex === -1) {
    return res.status(404).json({
      success: false,
      message: `Document '${documentId}' not found for vendor '${vendorId}'.`,
    });
  }

  const currentUser = req.user || { name: 'Pooja Verma', role: 'PROCUREMENT' };
  const targetDoc = vendor.documents[docIndex];

  targetDoc.status = status;
  targetDoc.remarks = remarks || (status === DOCUMENT_STATUS.VERIFIED ? 'Verified by procurement officer.' : 'Verification rejected / clarification needed.');
  targetDoc.verifiedAt = new Date().toISOString();
  targetDoc.verifiedBy = `${currentUser.name} (${currentUser.role})`;

  // Recalculate verification progress stats
  const verifiedCount = vendor.documents.filter(d => d.status === DOCUMENT_STATUS.VERIFIED).length;
  const rejectedCount = vendor.documents.filter(d => d.status === DOCUMENT_STATUS.REJECTED).length;
  const totalCount = vendor.documents.length;

  vendor.verificationStats = {
    verifiedCount,
    totalCount,
    progressPercent: Math.round((verifiedCount / totalCount) * 100),
    summary: `${verifiedCount} / ${totalCount} documents verified`,
  };

  // Automatically update overall vendor registration status based on compliance status
  let previousVendorStatus = vendor.status;
  if (verifiedCount === totalCount) {
    vendor.status = VENDOR_STATUS.APPROVED;
  } else if (rejectedCount > 0) {
    vendor.status = VENDOR_STATUS.CORRECTION_REQUIRED;
  } else if (verifiedCount > 0 && verifiedCount < totalCount) {
    vendor.status = VENDOR_STATUS.UNDER_REVIEW;
  }

  // Update store
  store.updateVendor(vendor.id, {
    documents: vendor.documents,
    verificationStats: vendor.verificationStats,
    status: vendor.status,
  });

  // Log to audit trail
  store.addAuditLog({
    userName: currentUser.name,
    userRole: currentUser.role,
    action: `DOCUMENT_${status.toUpperCase()}`,
    entityType: 'VENDOR_DOCUMENT',
    entityId: vendor.id,
    description: `${currentUser.name} (${currentUser.role}) updated document '${targetDoc.name}' to '${status}' for vendor '${vendor.companyName}' (${vendor.id}). Current progress: ${vendor.verificationStats.summary}.${vendor.status !== previousVendorStatus ? ` Overall Vendor Status transitioned to '${vendor.status}'.` : ''}`,
  });

  res.json({
    success: true,
    message: `Document '${targetDoc.name}' marked as ${status}.`,
    data: {
      document: targetDoc,
      verificationStats: vendor.verificationStats,
      vendorStatus: vendor.status,
    },
  });
}

/**
 * Simulated file upload for a document
 */
export function uploadDocument(req, res) {
  const { vendorId, documentId } = req.params;
  const { fileName } = req.body;

  const vendor = store.getVendorById(vendorId);
  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: `Vendor with ID '${vendorId}' not found.`,
    });
  }

  const doc = vendor.documents.find(d => d.id === documentId || d.documentTypeId === documentId);
  if (!doc) {
    return res.status(404).json({
      success: false,
      message: `Document '${documentId}' not found.`,
    });
  }

  doc.status = DOCUMENT_STATUS.UPLOADED;
  doc.fileName = fileName || `${doc.documentTypeId}_scanned_upload.pdf`;
  doc.fileSize = '2.1 MB';
  doc.uploadedAt = new Date().toISOString();
  doc.remarks = 'Simulated upload successful. Awaiting verification.';

  store.updateVendor(vendor.id, { documents: vendor.documents });

  const currentUser = req.user || { name: vendor.contactPerson, role: 'VENDOR' };
  store.addAuditLog({
    userName: currentUser.name,
    userRole: currentUser.role,
    action: 'DOCUMENT_UPLOADED',
    entityType: 'VENDOR_DOCUMENT',
    entityId: vendor.id,
    description: `Uploaded compliance document '${doc.name}' (${doc.fileName}) for vendor '${vendor.companyName}'.`,
  });

  res.json({
    success: true,
    message: `File '${doc.fileName}' uploaded successfully.`,
    data: doc,
  });
}
