import { store } from '../data/store.js';
import { ROLES, VENDOR_STATUS, DOCUMENT_STATUS, REQUIRED_DOCUMENT_TYPES } from '../utils/constants.js';

export function getVendors(req, res) {
  // If vendor role, strictly enforce single vendor isolation
  if (req.user?.role === ROLES.VENDOR && req.user?.vendorId) {
    const ownVendor = store.getVendorById(req.user.vendorId);
    return res.json({
      success: true,
      count: ownVendor ? 1 : 0,
      data: ownVendor ? [ownVendor] : [],
    });
  }

  const { status, search } = req.query;
  const vendors = store.getVendors({ status, search });
  res.json({
    success: true,
    count: vendors.length,
    data: vendors,
  });
}

export function getVendorById(req, res) {
  const { id } = req.params;

  // Vendors can only inspect their own dossier
  if (req.user?.role === ROLES.VENDOR && req.user?.vendorId && id !== req.user.vendorId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Vendors may only access their own compliance dossier.',
    });
  }

  const vendor = store.getVendorById(id);

  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: `Vendor with ID '${id}' not found.`,
    });
  }

  res.json({
    success: true,
    data: vendor,
  });
}

export function createVendor(req, res) {
  const {
    companyName,
    category,
    contactPerson,
    email,
    phone,
    gstNumber,
    panNumber,
    address,
    city,
    state,
    pincode,
    bankName,
    accountNumber,
    ifscCode,
    notes,
    isDraft,
  } = req.body;

  // Validation (FR-02: Reject Incomplete Vendor Registration)
  if (isDraft) {
    if (!companyName?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Draft vendor registration requires at least a Company Name.',
      });
    }
  } else {
    const missing = [];
    if (!companyName?.trim()) missing.push('Company Name');
    if (!contactPerson?.trim()) missing.push('Contact Person');
    if (!email?.trim()) missing.push('Email');
    if (!phone?.trim()) missing.push('Phone Number');
    if (!gstNumber?.trim()) missing.push('GST Number');

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Incomplete vendor registration rejected. Missing required information: ${missing.join(', ')}.`,
        missingFields: missing,
      });
    }
  }

  // Generate 11 required document placeholders
  const documents = REQUIRED_DOCUMENT_TYPES.map(docType => ({
    id: `doc_${docType.id}`,
    documentTypeId: docType.id,
    name: docType.name,
    category: docType.category,
    fileName: `${docType.id}_submitted.pdf`,
    fileSize: '1.4 MB',
    uploadedAt: new Date().toISOString(),
    status: DOCUMENT_STATUS.UPLOADED, // Default to uploaded upon registration submit
    remarks: 'Submitted by vendor during onboarding registration.',
    verifiedAt: null,
    verifiedBy: null,
  }));

  const initialStatus = isDraft ? VENDOR_STATUS.DRAFT : VENDOR_STATUS.SUBMITTED;

  const newVendor = store.createVendor({
    companyName,
    category: category || 'Pharmaceutical Supplies',
    contactPerson,
    email,
    phone: phone || '',
    gstNumber: gstNumber || '',
    panNumber: panNumber || '',
    address: address || '',
    city: city || '',
    state: state || '',
    pincode: pincode || '',
    bankName: bankName || '',
    accountNumber: accountNumber || '',
    ifscCode: ifscCode || '',
    notes: notes || 'New vendor registration initiated through VendorGate portal.',
    status: initialStatus,
    documents,
    verificationStats: {
      verifiedCount: 0,
      totalCount: documents.length,
      progressPercent: 0,
      summary: `0 / ${documents.length} documents verified`,
    },
  });

  // Audit trail
  const currentUser = req.user || { name: contactPerson, role: 'VENDOR' };
  store.addAuditLog({
    userName: currentUser.name,
    userRole: currentUser.role,
    action: isDraft ? 'VENDOR_REGISTRATION_SAVED' : 'VENDOR_REGISTRATION_SUBMITTED',
    entityType: 'VENDOR',
    entityId: newVendor.id,
    description: `Vendor '${companyName}' (${newVendor.id}) ${isDraft ? 'saved draft registration' : 'submitted onboarding registration with 11 required compliance documents'}.`,
  });

  res.status(201).json({
    success: true,
    message: isDraft ? 'Vendor draft saved successfully.' : 'Vendor registration submitted successfully.',
    data: newVendor,
  });
}

export function updateVendor(req, res) {
  const { id } = req.params;
  const updates = req.body;

  const updated = store.updateVendor(id, updates);
  if (!updated) {
    return res.status(404).json({
      success: false,
      message: `Vendor with ID '${id}' not found.`,
    });
  }

  const currentUser = req.user || { name: 'System User', role: 'PROCUREMENT' };
  store.addAuditLog({
    userName: currentUser.name,
    userRole: currentUser.role,
    action: 'VENDOR_UPDATED',
    entityType: 'VENDOR',
    entityId: id,
    description: `Vendor profile for '${updated.companyName}' (${id}) was updated.`,
  });

  res.json({
    success: true,
    message: 'Vendor updated successfully.',
    data: updated,
  });
}
