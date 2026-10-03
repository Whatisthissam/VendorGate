export type UserRole = 'ADMIN' | 'PROCUREMENT' | 'FINANCE' | 'APPROVER' | 'AUDITOR' | 'VENDOR';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  department: string;
  approvalLevel?: number; // 0, 1, 2, 3, 4
  limitDescription?: string;
  avatar: string;
  vendorId?: string;
  companyName?: string;
}

export type VendorStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Approved'
  | 'Rejected'
  | 'Correction Required';

export type DocumentStatus = 'Pending' | 'Uploaded' | 'Verified' | 'Rejected';

export interface VendorDocument {
  id: string;
  documentTypeId: string;
  name: string;
  category: string;
  fileName: string | null;
  fileSize: string | null;
  uploadedAt: string | null;
  status: DocumentStatus;
  remarks: string;
  verifiedAt: string | null;
  verifiedBy: string | null;
}

export interface VerificationStats {
  verifiedCount: number;
  totalCount: number;
  progressPercent: number;
  summary: string;
}

export interface Vendor {
  id: string;
  companyName: string;
  category: string;
  contactPerson: string;
  email: string;
  phone: string;
  gstNumber: string;
  panNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  registrationDate: string;
  status: VendorStatus;
  documents: VendorDocument[];
  verificationStats: VerificationStats;
  notes?: string;
}

export type POStatus =
  | 'Draft'
  | 'Submitted'
  | 'Pending Approval'
  | 'Approved'
  | 'Rejected'
  | 'Sent to Vendor'
  | 'Acknowledged'
  | 'Vendor Rejected';

export interface ApprovalHistoryItem {
  action: string;
  user: string;
  role: string;
  approvalLevel?: number;
  timestamp: string;
  comments?: string;
}

export interface VendorAcknowledgement {
  status: 'ACKNOWLEDGED' | 'VENDOR_REJECTED';
  acknowledgedBy: string;
  timestamp: string;
  comments?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  productService: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  requiredApprovalLevel: number;
  status: POStatus;
  requiredDate: string;
  notes: string;
  createdBy: string;
  createdAt: string;
  approvalHistory: ApprovalHistoryItem[];
  vendorAcknowledgement?: VendorAcknowledgement | null;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
}

export interface DashboardMetrics {
  totalVendors: number;
  approvedVendors: number;
  pendingVendors: number;
  rejectedVendors: number;
  totalPurchaseOrders: number;
  pendingApprovals: number;
  approvedPOs: number;
  rejectedPOs: number;
  totalPOValue: number;
  pendingByLevel: {
    level1: number;
    level2: number;
    level3: number;
    level4: number;
  };
}

export interface DashboardData {
  metrics: DashboardMetrics;
  recentVendors: Vendor[];
  recentPurchaseOrders: PurchaseOrder[];
  pendingApprovalPOs: PurchaseOrder[];
  recentAuditActivity: AuditLog[];
}

export interface ProjectTask {
  id: string;
  name: string;
  durationDays: number;
  startDay: number;
  endDay: number;
  dependencies: string[];
  owner: string;
  deliverable: string;
  isCritical: boolean;
  slackDays?: number;
  status: string;
}

export interface RiskItem {
  id: string;
  title: string;
  category: string;
  probability: number;
  impact: number;
  exposure: number;
  mitigation: string;
  status: string;
}

export interface ProjectMetadata {
  projectTitle: string;
  subtitle: string;
  clientContext: string;
  problemStatement: string[];
  totalWorkingDays: number;
  criticalPath: { id: string; name: string; duration: number; isCritical: boolean }[];
  tasks: ProjectTask[];
  riskRegister: RiskItem[];
  academicMetrics: {
    criticalPathDuration: number;
    numberOfPhases: number;
    keyMilestone: string;
  };
}
