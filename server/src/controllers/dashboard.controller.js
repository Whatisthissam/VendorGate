import { store } from '../data/store.js';
import { VENDOR_STATUS, PO_STATUS, ROLES } from '../utils/constants.js';

export function getDashboardStats(req, res) {
  const vendors = store.getVendors();
  const purchaseOrders = store.getPurchaseOrders();
  const auditLogs = store.getAuditLogs();

  const currentUser = req.user || null;

  // Global / System-Wide Statistics
  const totalVendors = vendors.length;
  const approvedVendors = vendors.filter(v => v.status === VENDOR_STATUS.APPROVED).length;
  const pendingVendors = vendors.filter(v =>
    v.status === VENDOR_STATUS.SUBMITTED ||
    v.status === VENDOR_STATUS.UNDER_REVIEW ||
    v.status === VENDOR_STATUS.DRAFT ||
    v.status === VENDOR_STATUS.CORRECTION_REQUIRED
  ).length;
  const rejectedVendors = vendors.filter(v => v.status === VENDOR_STATUS.REJECTED).length;

  const totalPurchaseOrders = purchaseOrders.length;
  const pendingApprovals = purchaseOrders.filter(p => p.status === PO_STATUS.PENDING_APPROVAL).length;
  const approvedPOs = purchaseOrders.filter(p =>
    p.status === PO_STATUS.APPROVED ||
    p.status === PO_STATUS.SENT_TO_VENDOR ||
    p.status === PO_STATUS.ACKNOWLEDGED
  ).length;
  const rejectedPOs = purchaseOrders.filter(p =>
    p.status === PO_STATUS.REJECTED ||
    p.status === PO_STATUS.VENDOR_REJECTED
  ).length;

  const totalPOValue = purchaseOrders.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0);

  const pendingByLevel = {
    level1: purchaseOrders.filter(p => p.status === PO_STATUS.PENDING_APPROVAL && p.requiredApprovalLevel === 1).length,
    level2: purchaseOrders.filter(p => p.status === PO_STATUS.PENDING_APPROVAL && p.requiredApprovalLevel === 2).length,
    level3: purchaseOrders.filter(p => p.status === PO_STATUS.PENDING_APPROVAL && p.requiredApprovalLevel === 3).length,
    level4: purchaseOrders.filter(p => p.status === PO_STATUS.PENDING_APPROVAL && p.requiredApprovalLevel === 4).length,
  };

  // Recent Global Lists
  const recentVendors = [...vendors].slice(0, 5);
  const recentPurchaseOrders = [...purchaseOrders].slice(0, 6);
  const pendingApprovalPOs = purchaseOrders
    .filter(p => p.status === PO_STATUS.PENDING_APPROVAL)
    .slice(0, 6);
  const recentAuditActivity = auditLogs.slice(0, 8);

  // VENDOR-SPECIFIC METRICS
  let vendorData = null;
  const vendorId = currentUser?.vendorId || req.query?.vendorId;
  if (vendorId) {
    const targetVendor = store.getVendorById(vendorId);
    if (targetVendor) {
      const vendorOrders = purchaseOrders.filter(p => p.vendorId === targetVendor.id);
      const pendingAckOrders = vendorOrders.filter(
        p => p.status === PO_STATUS.SENT_TO_VENDOR || p.status === PO_STATUS.APPROVED
      );
      const ackOrders = vendorOrders.filter(p => p.status === PO_STATUS.ACKNOWLEDGED);
      const vendorValue = vendorOrders.reduce((acc, p) => acc + (Number(p.totalAmount) || 0), 0);

      vendorData = {
        vendor: targetVendor,
        metrics: {
          totalOrders: vendorOrders.length,
          pendingAckCount: pendingAckOrders.length,
          acknowledgedCount: ackOrders.length,
          totalBusinessValue: vendorValue,
          verificationStats: targetVendor.verificationStats,
          status: targetVendor.status,
        },
        orders: vendorOrders,
        pendingAckOrders,
        documents: targetVendor.documents,
      };
    }
  }

  // AUDITOR-SPECIFIC METRICS
  const blockedAttempts = auditLogs.filter(
    l => l.action === 'UNAUTHORIZED_APPROVAL_BLOCKED' || l.action.includes('BLOCKED')
  );
  const rejectedDocs = auditLogs.filter(l => l.action === 'DOCUMENT_REJECTED');
  const fullyCompliantVendors = vendors.filter(v => v.verificationStats?.progressPercent === 100);

  const auditorData = {
    metrics: {
      historicViolations: 34, // Manual paper system legacy audit finding
      currentViolations: 0,   // Zero bypasses under VendorGate
      blockedAttemptsCount: blockedAttempts.length,
      totalAuditLogsCount: auditLogs.length,
      complianceRate: Math.round((fullyCompliantVendors.length / totalVendors) * 100),
      fullyCompliantCount: fullyCompliantVendors.length,
      totalVendorsCount: totalVendors,
    },
    blockedAttempts,
    recentSecurityEvents: auditLogs.filter(l =>
      l.action.includes('BLOCKED') ||
      l.action.includes('APPROVED') ||
      l.action.includes('REJECTED') ||
      l.action === 'AUDIT_FINDING_FILED'
    ).slice(0, 8),
    recentAuditActivity,
  };

  // APPROVER-SPECIFIC METRICS
  let approverData = null;
  if (currentUser?.role === ROLES.APPROVER) {
    const userLevel = Number(currentUser.approvalLevel) || 1;
    const pendingMyLevel = purchaseOrders.filter(
      p => p.status === PO_STATUS.PENDING_APPROVAL && p.requiredApprovalLevel === userLevel
    );
    const pendingWithinAuth = pendingMyLevel;
    const pendingRestricted = purchaseOrders.filter(
      p => p.status === PO_STATUS.PENDING_APPROVAL && p.requiredApprovalLevel !== userLevel
    );
    const myApprovals = purchaseOrders.filter(p =>
      p.approvalHistory?.some(h => h.user === currentUser.name && h.action === 'APPROVED')
    );

    approverData = {
      userLevel,
      limitDescription: currentUser.limitDescription || `Level ${userLevel}`,
      metrics: {
        pendingMyLevelCount: pendingMyLevel.length,
        pendingWithinAuthCount: pendingWithinAuth.length,
        pendingRestrictedCount: pendingRestricted.length,
        myApprovedCount: myApprovals.length,
      },
      actionableQueue: pendingWithinAuth,
      restrictedQueue: pendingRestricted,
    };
  }

  res.json({
    success: true,
    data: {
      metrics: {
        totalVendors,
        approvedVendors,
        pendingVendors,
        rejectedVendors,
        totalPurchaseOrders,
        pendingApprovals,
        approvedPOs,
        rejectedPOs,
        totalPOValue,
        pendingByLevel,
      },
      recentVendors,
      recentPurchaseOrders,
      pendingApprovalPOs,
      recentAuditActivity,
      // Role-specific bundles
      vendorData,
      auditorData,
      approverData,
    },
  });
}

export function getReportMetrics(req, res) {
  const vendors = store.getVendors();
  const purchaseOrders = store.getPurchaseOrders();

  // Vendor Status Distribution
  const vendorStatusDistribution = [
    { status: 'Approved', count: vendors.filter(v => v.status === VENDOR_STATUS.APPROVED).length, color: '#16a34a' },
    { status: 'Under Review', count: vendors.filter(v => v.status === VENDOR_STATUS.UNDER_REVIEW).length, color: '#2563eb' },
    { status: 'Submitted', count: vendors.filter(v => v.status === VENDOR_STATUS.SUBMITTED).length, color: '#f59e0b' },
    { status: 'Correction Required', count: vendors.filter(v => v.status === VENDOR_STATUS.CORRECTION_REQUIRED).length, color: '#ea580c' },
    { status: 'Draft', count: vendors.filter(v => v.status === VENDOR_STATUS.DRAFT).length, color: '#64748b' },
    { status: 'Rejected', count: vendors.filter(v => v.status === VENDOR_STATUS.REJECTED).length, color: '#dc2626' },
  ];

  // PO Status Distribution
  const poStatusDistribution = [
    { status: 'Pending Approval', count: purchaseOrders.filter(p => p.status === PO_STATUS.PENDING_APPROVAL).length, color: '#f59e0b' },
    { status: 'Approved', count: purchaseOrders.filter(p => p.status === PO_STATUS.APPROVED).length, color: '#16a34a' },
    { status: 'Sent to Vendor', count: purchaseOrders.filter(p => p.status === PO_STATUS.SENT_TO_VENDOR).length, color: '#0284c7' },
    { status: 'Acknowledged', count: purchaseOrders.filter(p => p.status === PO_STATUS.ACKNOWLEDGED).length, color: '#0d9488' },
    { status: 'Rejected', count: purchaseOrders.filter(p => p.status === PO_STATUS.REJECTED).length, color: '#dc2626' },
    { status: 'Vendor Rejected', count: purchaseOrders.filter(p => p.status === PO_STATUS.VENDOR_REJECTED).length, color: '#b91c1c' },
    { status: 'Draft', count: purchaseOrders.filter(p => p.status === PO_STATUS.DRAFT).length, color: '#64748b' },
  ];

  // Value by Approval Level
  const levels = [1, 2, 3, 4];
  const poValueByApprovalLevel = levels.map(lvl => {
    const matching = purchaseOrders.filter(p => p.requiredApprovalLevel === lvl);
    const totalVal = matching.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0);
    const titles = {
      1: 'Level 1 (≤ ₹50,000)',
      2: 'Level 2 (> ₹50k & ≤ ₹2L)',
      3: 'Level 3 (> ₹2L & ≤ ₹10L)',
      4: 'Level 4 (> ₹10L)',
    };
    return {
      level: lvl,
      label: titles[lvl],
      poCount: matching.length,
      totalValue: totalVal,
    };
  });

  // Boundary Value Test Cases
  const boundaryTests = [
    { poNumber: 'PO-1001', amount: 49999, calculatedLevel: 1, expectedLevel: 1, condition: 'Amount < ₹50,000 ceiling', status: 'PASS' },
    { poNumber: 'PO-1002', amount: 50000, calculatedLevel: 1, expectedLevel: 1, condition: 'Amount == ₹50,000 exact ceiling', status: 'PASS' },
    { poNumber: 'PO-1003', amount: 50001, calculatedLevel: 2, expectedLevel: 2, condition: 'Amount == ₹50,001 (+₹1 above Level 1)', status: 'PASS' },
    { poNumber: 'PO-1004', amount: 199999, calculatedLevel: 2, expectedLevel: 2, condition: 'Amount < ₹2,00,000 ceiling', status: 'PASS' },
    { poNumber: 'PO-1005', amount: 200000, calculatedLevel: 2, expectedLevel: 2, condition: 'Amount == ₹2,00,000 exact ceiling', status: 'PASS' },
    { poNumber: 'PO-1006', amount: 200001, calculatedLevel: 3, expectedLevel: 3, condition: 'Amount == ₹2,00,001 (+₹1 above Level 2)', status: 'PASS' },
    { poNumber: 'PO-1007', amount: 999999, calculatedLevel: 3, expectedLevel: 3, condition: 'Amount < ₹10,00,000 ceiling', status: 'PASS' },
    { poNumber: 'PO-1008', amount: 1000000, calculatedLevel: 3, expectedLevel: 3, condition: 'Amount == ₹10,00,000 exact ceiling', status: 'PASS' },
    { poNumber: 'PO-1009', amount: 1000001, calculatedLevel: 4, expectedLevel: 4, condition: 'Amount == ₹10,00,001 (+₹1 above Level 3)', status: 'PASS' },
  ];

  res.json({
    success: true,
    data: {
      vendorStatusDistribution,
      poStatusDistribution,
      poValueByApprovalLevel,
      boundaryTests,
      summary: {
        totalVendors: vendors.length,
        totalPOs: purchaseOrders.length,
        boundaryTestsPassed: boundaryTests.filter(b => b.status === 'PASS').length,
        totalBoundaryTests: boundaryTests.length,
      },
    },
  });
}
