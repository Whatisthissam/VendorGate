export const ROLES = {
  ADMIN: 'ADMIN',
  PROCUREMENT: 'PROCUREMENT',
  FINANCE: 'FINANCE',
  APPROVER: 'APPROVER',
  AUDITOR: 'AUDITOR',
  VENDOR: 'VENDOR',
};

export const APPROVAL_LEVELS = {
  LEVEL_1: 1,
  LEVEL_2: 2,
  LEVEL_3: 3,
  LEVEL_4: 4,
};

export const APPROVAL_LIMITS = {
  LEVEL_1_MAX: 50000,
  LEVEL_2_MAX: 200000,
  LEVEL_3_MAX: 1000000,
};

export const VENDOR_STATUS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CORRECTION_REQUIRED: 'Correction Required',
};

export const DOCUMENT_STATUS = {
  PENDING: 'Pending',
  UPLOADED: 'Uploaded',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
};

export const PO_STATUS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  SENT_TO_VENDOR: 'Sent to Vendor',
  ACKNOWLEDGED: 'Acknowledged',
  VENDOR_REJECTED: 'Vendor Rejected',
};

// 11 Required Pharmaceutical Vendor Verification Documents
export const REQUIRED_DOCUMENT_TYPES = [
  {
    id: 'gst_certificate',
    name: 'GST Certificate',
    category: 'Tax & Legal',
    description: 'Government Issued GSTIN Registration Certificate with active status',
    mandatory: true,
  },
  {
    id: 'pan_card',
    name: 'PAN Card',
    category: 'Tax & Legal',
    description: 'Permanent Account Number card of corporate entity / partnership',
    mandatory: true,
  },
  {
    id: 'company_reg',
    name: 'Company Registration Certificate',
    category: 'Corporate Identity',
    description: 'Certificate of Incorporation (MCA) / Partnership Deed / Shop Act',
    mandatory: true,
  },
  {
    id: 'bank_certificate',
    name: 'Bank Certificate / Cancelled Cheque',
    category: 'Banking & Financial',
    description: 'Bank verification letter with IFSC, branch code and cancelled cheque',
    mandatory: true,
  },
  {
    id: 'drug_license',
    name: 'Drug License (Form 20B / 21B)',
    category: 'Regulatory & Pharma',
    description: 'State FDA/CDSCO issued wholesale drug sales & distribution license',
    mandatory: true,
  },
  {
    id: 'address_proof',
    name: 'Registered Address Proof',
    category: 'Corporate Identity',
    description: 'Latest utility bill / lease agreement showing registered premises',
    mandatory: true,
  },
  {
    id: 'msme_certificate',
    name: 'MSME / Udyam Certificate',
    category: 'Business Classification',
    description: 'Udyam Registration Certificate for enterprise categorization',
    mandatory: true,
  },
  {
    id: 'trade_license',
    name: 'Trade License',
    category: 'Regulatory & Pharma',
    description: 'Current local municipal corporation trade operating license',
    mandatory: true,
  },
  {
    id: 'quality_certificate',
    name: 'Quality Certificate (WHO-GMP / ISO)',
    category: 'Quality & Compliance',
    description: 'Valid WHO-GMP, ISO 9001:2015 or cGMP compliance certificate',
    mandatory: true,
  },
  {
    id: 'tax_registration',
    name: 'Tax Clearance Certificate',
    category: 'Tax & Legal',
    description: 'Latest income tax assessment clearance / IT return acknowledgment',
    mandatory: true,
  },
  {
    id: 'auth_signatory',
    name: 'Authorized Signatory Proof',
    category: 'Corporate Identity',
    description: 'Board Resolution / Power of Attorney for authorized representative',
    mandatory: true,
  },
];
