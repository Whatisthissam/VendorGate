import { store } from '../data/store.js';
import { PO_STATUS, ROLES } from '../utils/constants.js';
import {
  calculatePOAmount,
  determineApprovalLevel,
  canApprovePO,
  getApprovalLevelDescription,
} from '../utils/approvalRules.js';

export function getPurchaseOrders(req, res) {
  let { status, approvalLevel, vendorId, search } = req.query;

  // Vendors can strictly only see their own purchase orders
  if (req.user?.role === ROLES.VENDOR && req.user?.vendorId) {
    vendorId = req.user.vendorId;
  }

  const orders = store.getPurchaseOrders({ status, approvalLevel, vendorId, search });

  res.json({
    success: true,
    count: orders.length,
    data: orders,
  });
}

export function getPurchaseOrderById(req, res) {
  const { id } = req.params;
  const po = store.getPurchaseOrderById(id);

  if (!po) {
    return res.status(404).json({
      success: false,
      message: `Purchase Order '${id}' not found.`,
    });
  }

  // Vendors can only inspect orders addressed to their company
  if (req.user?.role === ROLES.VENDOR && req.user?.vendorId && po.vendorId !== req.user.vendorId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: You may only view purchase orders issued to your company.',
    });
  }

  res.json({
    success: true,
    data: po,
  });
}

export function createPurchaseOrder(req, res) {
  // Only Admin and Procurement can create Purchase Orders
  if (req.user?.role !== ROLES.ADMIN && req.user?.role !== ROLES.PROCUREMENT) {
    return res.status(403).json({
      success: false,
      message: `Access denied: Role '${req.user?.role}' is not authorized to create Purchase Orders.`,
    });
  }

  const {
    vendorId,
    productService,
    description,
    quantity,
    unitPrice,
    requiredDate,
    notes,
    isDraft,
  } = req.body;

  // Validation
  if (!vendorId || !productService || !quantity || !unitPrice) {
    return res.status(400).json({
      success: false,
      message: 'Invalid PO input. Vendor, Product/Service, Quantity, and Unit Price are required.',
    });
  }

  const parsedQty = Number(quantity);
  const parsedPrice = Number(unitPrice);

  if (isNaN(parsedQty) || parsedQty <= 0 || isNaN(parsedPrice) || parsedPrice <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid PO amount. Quantity and Unit Price must be positive numeric values.',
    });
  }

  const vendor = store.getVendorById(vendorId);
  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: `Vendor with ID '${vendorId}' not found.`,
    });
  }

  // Core business calculation
  const totalAmount = calculatePOAmount(parsedQty, parsedPrice);
  const requiredApprovalLevel = determineApprovalLevel(totalAmount);
  const initialStatus = isDraft ? PO_STATUS.DRAFT : PO_STATUS.PENDING_APPROVAL;

  const currentUser = req.user || { name: 'Pooja Verma', role: 'PROCUREMENT' };

  const newPO = store.createPurchaseOrder({
    vendorId: vendor.id,
    vendorName: vendor.companyName,
    productService,
    description: description || '',
    quantity: parsedQty,
    unitPrice: parsedPrice,
    totalAmount,
    requiredApprovalLevel,
    status: initialStatus,
    requiredDate: requiredDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    notes: notes || '',
    createdBy: `${currentUser.name} (${currentUser.role})`,
    approvalHistory: isDraft
      ? []
      : [
          {
            action: 'SUBMITTED',
            user: currentUser.name,
            role: currentUser.role,
            timestamp: new Date().toISOString(),
            comments: `PO submitted for Level ${requiredApprovalLevel} approval (${getApprovalLevelDescription(requiredApprovalLevel)}).`,
          },
        ],
    vendorAcknowledgement: null,
  });

  // Audit trail
  store.addAuditLog({
    userName: currentUser.name,
    userRole: currentUser.role,
    action: isDraft ? 'PO_DRAFT_CREATED' : 'PO_CREATED',
    entityType: 'PURCHASE_ORDER',
    entityId: newPO.poNumber,
    description: `Created ${newPO.poNumber} for ₹${totalAmount.toLocaleString('en-IN')} assigned to '${vendor.companyName}'. System calculated Required Approval: Level ${requiredApprovalLevel}. Status: ${initialStatus}.`,
  });

  res.status(201).json({
    success: true,
    message: isDraft ? 'Purchase Order draft saved.' : `Purchase Order ${newPO.poNumber} created successfully.`,
    data: newPO,
  });
}

/**
 * Submit Draft Purchase Order for Approval (FR-05)
 */
export function submitPurchaseOrder(req, res) {
  const { id } = req.params;
  const po = store.getPurchaseOrderById(id);

  if (!po) {
    return res.status(404).json({
      success: false,
      message: `Purchase Order '${id}' not found.`,
    });
  }

  // Only Admin and Procurement can submit POs
  if (req.user?.role !== ROLES.ADMIN && req.user?.role !== ROLES.PROCUREMENT) {
    return res.status(403).json({
      success: false,
      message: `Access denied: Role '${req.user?.role}' is not authorized to submit Purchase Orders.`,
    });
  }

  if (po.status !== PO_STATUS.DRAFT) {
    return res.status(400).json({
      success: false,
      message: `Cannot submit PO. Current status is '${po.status}', but must be 'Draft'.`,
    });
  }

  // Identify applicable approval level based on PO value
  const requiredApprovalLevel = determineApprovalLevel(po.totalAmount);
  const currentUser = req.user || { name: 'Pooja Verma', role: ROLES.PROCUREMENT };
  const timestamp = new Date().toISOString();

  po.status = PO_STATUS.PENDING_APPROVAL;
  po.requiredApprovalLevel = requiredApprovalLevel;
  if (!po.approvalHistory) {
    po.approvalHistory = [];
  }
  po.approvalHistory.push({
    action: 'SUBMITTED',
    user: currentUser.name,
    role: currentUser.role,
    timestamp,
    comments: `Draft PO submitted for Level ${requiredApprovalLevel} approval (${getApprovalLevelDescription(requiredApprovalLevel)}).`,
  });

  store.updatePurchaseOrder(po.id, {
    status: po.status,
    requiredApprovalLevel: po.requiredApprovalLevel,
    approvalHistory: po.approvalHistory,
  });

  // Audit trail
  store.addAuditLog({
    userName: currentUser.name,
    userRole: currentUser.role,
    action: 'PO_SUBMITTED',
    entityType: 'PURCHASE_ORDER',
    entityId: po.poNumber,
    description: `${currentUser.name} (${currentUser.role}) submitted draft ${po.poNumber} (₹${po.totalAmount.toLocaleString('en-IN')}) for Level ${requiredApprovalLevel} authorization.`,
  });

  res.json({
    success: true,
    message: `Purchase Order ${po.poNumber} submitted for Level ${requiredApprovalLevel} approval.`,
    data: po,
  });
}

/**
 * Approve Purchase Order with strict authority verification
 */
export function approvePurchaseOrder(req, res) {
  const { id } = req.params;
  const { comments } = req.body;
  const po = store.getPurchaseOrderById(id);

  if (!po) {
    return res.status(404).json({
      success: false,
      message: `Purchase Order '${id}' not found.`,
    });
  }

  if (po.status !== PO_STATUS.PENDING_APPROVAL) {
    return res.status(400).json({
      success: false,
      message: `Cannot approve PO in status '${po.status}'. PO must be in 'Pending Approval' state.`,
    });
  }

  const currentUser = req.user || { name: 'Deepak Singhania', role: ROLES.APPROVER, approvalLevel: 3 };

  // CORE BUSINESS RULE: Check Approval Authority
  const check = canApprovePO(currentUser, po.requiredApprovalLevel);
  if (!check.allowed) {
    // Record unauthorized approval attempt in audit trail
    store.addAuditLog({
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'UNAUTHORIZED_APPROVAL_BLOCKED',
      entityType: 'PURCHASE_ORDER',
      entityId: po.poNumber,
      description: `BLOCKED: ${currentUser.name} (${currentUser.role}, Level ${currentUser.approvalLevel || 0}) attempted to approve ${po.poNumber} of ₹${po.totalAmount.toLocaleString('en-IN')}, which requires Level ${po.requiredApprovalLevel} approval. Action blocked by policy gate.`,
    });

    return res.status(403).json({
      success: false,
      blocked: true,
      userLevel: currentUser.approvalLevel || 0,
      requiredLevel: po.requiredApprovalLevel,
      message: check.reason || 'PO amount exceeds your approval authority.',
    });
  }

  // Update PO status
  const timestamp = new Date().toISOString();
  po.status = PO_STATUS.APPROVED;
  po.approvalHistory.push({
    action: 'APPROVED',
    user: currentUser.name,
    role: currentUser.role,
    approvalLevel: currentUser.approvalLevel || 4,
    timestamp,
    comments: comments || `Approved under Level ${currentUser.approvalLevel || 4} authority.`,
  });

  store.updatePurchaseOrder(po.id, {
    status: po.status,
    approvalHistory: po.approvalHistory,
  });

  // Audit trail
  store.addAuditLog({
    userName: currentUser.name,
    userRole: currentUser.role,
    action: 'PO_APPROVED',
    entityType: 'PURCHASE_ORDER',
    entityId: po.poNumber,
    description: `${currentUser.name} (Approval Level ${currentUser.approvalLevel || 4}) approved ${po.poNumber} of ₹${po.totalAmount.toLocaleString('en-IN')} within permitted authority threshold.`,
  });

  res.json({
    success: true,
    message: `Purchase Order ${po.poNumber} successfully approved.`,
    data: po,
  });
}

/**
 * Reject Purchase Order
 */
export function rejectPurchaseOrder(req, res) {
  const { id } = req.params;
  const { comments } = req.body;
  const po = store.getPurchaseOrderById(id);

  if (!po) {
    return res.status(404).json({
      success: false,
      message: `Purchase Order '${id}' not found.`,
    });
  }

  if (po.status !== PO_STATUS.PENDING_APPROVAL) {
    return res.status(400).json({
      success: false,
      message: `Cannot reject PO in status '${po.status}'.`,
    });
  }

  const currentUser = req.user || { name: 'Deepak Singhania', role: ROLES.APPROVER, approvalLevel: 3 };
  const timestamp = new Date().toISOString();

  po.status = PO_STATUS.REJECTED;
  po.approvalHistory.push({
    action: 'REJECTED',
    user: currentUser.name,
    role: currentUser.role,
    approvalLevel: currentUser.approvalLevel || 0,
    timestamp,
    comments: comments || 'Purchase order rejected by approving officer.',
  });

  store.updatePurchaseOrder(po.id, {
    status: po.status,
    approvalHistory: po.approvalHistory,
  });

  // Audit trail
  store.addAuditLog({
    userName: currentUser.name,
    userRole: currentUser.role,
    action: 'PO_REJECTED',
    entityType: 'PURCHASE_ORDER',
    entityId: po.poNumber,
    description: `${currentUser.name} (${currentUser.role}) rejected ${po.poNumber} of ₹${po.totalAmount.toLocaleString('en-IN')}. Reason: "${comments || 'No comments provided'}"`,
  });

  res.json({
    success: true,
    message: `Purchase Order ${po.poNumber} has been rejected.`,
    data: po,
  });
}

/**
 * Transmit approved PO to Vendor
 */
export function sendPOToVendor(req, res) {
  const { id } = req.params;
  const po = store.getPurchaseOrderById(id);

  if (!po) {
    return res.status(404).json({
      success: false,
      message: `Purchase Order '${id}' not found.`,
    });
  }

  if (po.status !== PO_STATUS.APPROVED) {
    return res.status(400).json({
      success: false,
      message: `Cannot send PO to vendor. Current status is '${po.status}', must be 'Approved'.`,
    });
  }

  const currentUser = req.user || { name: 'Pooja Verma', role: 'PROCUREMENT' };
  po.status = PO_STATUS.SENT_TO_VENDOR;

  store.updatePurchaseOrder(po.id, { status: po.status });

  store.addAuditLog({
    userName: currentUser.name,
    userRole: currentUser.role,
    action: 'PO_SENT_TO_VENDOR',
    entityType: 'PURCHASE_ORDER',
    entityId: po.poNumber,
    description: `Purchase order ${po.poNumber} transmitted to vendor '${po.vendorName}' for electronic acknowledgement.`,
  });

  res.json({
    success: true,
    message: `PO ${po.poNumber} transmitted to vendor.`,
    data: po,
  });
}

/**
 * Vendor Acknowledgement or Rejection
 */
export function acknowledgePurchaseOrder(req, res) {
  const { id } = req.params;
  const { action, comments } = req.body; // action: 'ACKNOWLEDGE' or 'REJECT'
  const po = store.getPurchaseOrderById(id);

  if (!po) {
    return res.status(404).json({
      success: false,
      message: `Purchase Order '${id}' not found.`,
    });
  }

  // Vendors can only acknowledge orders addressed to their company (FR-11)
  if (req.user?.role === ROLES.VENDOR && req.user?.vendorId && po.vendorId !== req.user.vendorId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: You can only acknowledge purchase orders issued to your company.',
    });
  }

  // PO should be either Approved or Sent to Vendor (or Pending Vendor Action)
  if (po.status !== PO_STATUS.SENT_TO_VENDOR && po.status !== PO_STATUS.APPROVED) {
    return res.status(400).json({
      success: false,
      message: `Cannot acknowledge PO in status '${po.status}'. Must be in 'Approved' or 'Sent to Vendor' status.`,
    });
  }

  const currentUser = req.user || { name: 'Rohan Mehta', role: 'VENDOR' };
  const timestamp = new Date().toISOString();

  if (action === 'REJECT') {
    po.status = PO_STATUS.VENDOR_REJECTED;
    po.vendorAcknowledgement = {
      status: 'VENDOR_REJECTED',
      acknowledgedBy: `${currentUser.name} (Vendor)`,
      timestamp,
      comments: comments || 'Vendor unable to fulfill order under current terms/timeline.',
    };

    store.updatePurchaseOrder(po.id, {
      status: po.status,
      vendorAcknowledgement: po.vendorAcknowledgement,
    });

    store.addAuditLog({
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'PO_VENDOR_REJECTED',
      entityType: 'PURCHASE_ORDER',
      entityId: po.poNumber,
      description: `Vendor '${po.vendorName}' rejected ${po.poNumber}. Remarks: "${comments || 'No reason provided'}"`,
    });

    return res.json({
      success: true,
      message: `Purchase Order ${po.poNumber} rejected by vendor.`,
      data: po,
    });
  } else {
    // Default: ACKNOWLEDGE
    po.status = PO_STATUS.ACKNOWLEDGED;
    po.vendorAcknowledgement = {
      status: 'ACKNOWLEDGED',
      acknowledgedBy: `${currentUser.name} (Vendor)`,
      timestamp,
      comments: comments || 'Order confirmed and delivery timeline accepted.',
    };

    store.updatePurchaseOrder(po.id, {
      status: po.status,
      vendorAcknowledgement: po.vendorAcknowledgement,
    });

    store.addAuditLog({
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'PO_ACKNOWLEDGED',
      entityType: 'PURCHASE_ORDER',
      entityId: po.poNumber,
      description: `Vendor '${po.vendorName}' electronically acknowledged ${po.poNumber} for ₹${po.totalAmount.toLocaleString('en-IN')}. Remarks: "${comments || 'Order accepted'}"`,
    });

    return res.json({
      success: true,
      message: `Purchase Order ${po.poNumber} acknowledged successfully.`,
      data: po,
    });
  }
}
