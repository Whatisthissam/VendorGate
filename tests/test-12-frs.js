import { store } from '../server/src/data/store.js';
import { getVendors, getVendorById, createVendor, updateVendor } from '../server/src/controllers/vendor.controller.js';
import {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  submitPurchaseOrder,
  approvePurchaseOrder,
  rejectPurchaseOrder,
  sendPOToVendor,
  acknowledgePurchaseOrder,
} from '../server/src/controllers/po.controller.js';
import { getAuditLogs } from '../server/src/controllers/audit.controller.js';
import { ROLES, PO_STATUS, VENDOR_STATUS } from '../server/src/utils/constants.js';

function mockRes() {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };
  return res;
}

console.log('========================================================================');
console.log('  VENDORGATE: 12 FUNCTIONAL REQUIREMENTS (FR-01 to FR-12) AUDIT TEST');
console.log('========================================================================\n');

let passed = 0;
let total = 0;

function assert(condition, frCode, testName) {
  total++;
  if (condition) {
    passed++;
    console.log(`[PASS] ${frCode}: ${testName}`);
  } else {
    console.error(`[FAIL] ${frCode}: ${testName}`);
  }
}

// ------------------------------------------------------------------------
// FR-01: Vendor Registration
// ------------------------------------------------------------------------
const regReq = {
  body: {
    companyName: 'Zenith Lifesciences Pvt Ltd',
    category: 'Pharmaceutical Formulations',
    contactPerson: 'Sanjay Deshpande',
    email: 'sanjay.d@zenithlife.in',
    phone: '+91 98200 55443',
    gstNumber: '27AAACZ1234K1Z2',
    isDraft: false,
  },
};
const regRes = mockRes();
createVendor(regReq, regRes);
assert(
  regRes.statusCode === 201 &&
    regRes.data.data.status === VENDOR_STATUS.SUBMITTED &&
    regRes.data.data.documents.length === 11,
  'FR-01',
  'Vendor registration accepts vendor info, creates 11 documents, and sets status to Submitted'
);

// ------------------------------------------------------------------------
// FR-02: Reject Incomplete Vendor Registration
// ------------------------------------------------------------------------
const incompleteReq = {
  body: {
    companyName: 'Incomplete Pharma Inc',
    // Missing contactPerson, email, phone, gstNumber
    isDraft: false,
  },
};
const incompleteRes = mockRes();
createVendor(incompleteReq, incompleteRes);
assert(
  incompleteRes.statusCode === 400 &&
    incompleteRes.data.success === false &&
    incompleteRes.data.missingFields &&
    incompleteRes.data.missingFields.length > 0,
  'FR-02',
  'Incomplete registration missing required fields is rejected with 400 & feedback'
);

// ------------------------------------------------------------------------
// FR-03: Manage Vendor Information
// ------------------------------------------------------------------------
const vendorToUpdate = store.getVendors()[0];
const updateReq = {
  params: { id: vendorToUpdate.id },
  body: {
    contactPerson: 'Updated Contact Person',
    phone: '+91 99999 88888',
    notes: 'Updated contact details for corporate procurement communication.',
  },
  user: { name: 'Pooja Verma', role: ROLES.PROCUREMENT },
};
const updateRes = mockRes();
updateVendor(updateReq, updateRes);
assert(
  updateRes.statusCode === 200 &&
    updateRes.data.data.contactPerson === 'Updated Contact Person' &&
    updateRes.data.data.phone === '+91 99999 88888',
  'FR-03',
  'Vendor details and registration info can be edited and persisted to state'
);

// ------------------------------------------------------------------------
// FR-04: Create Purchase Order (Draft)
// ------------------------------------------------------------------------
const createReq = {
  user: { name: 'Pooja Verma', role: ROLES.PROCUREMENT },
  body: {
    vendorId: vendorToUpdate.id,
    productService: 'Surgical Gauze Swabs 10x10',
    description: '100% sterile cotton absorbent gauze swabs',
    quantity: 1000,
    unitPrice: 35.0, // ₹35,000 -> Level 1
    isDraft: true,
  },
};
const createRes = mockRes();
createPurchaseOrder(createReq, createRes);
const createdPO = createRes.data.data;
assert(
  createRes.statusCode === 201 &&
    createdPO.status === PO_STATUS.DRAFT &&
    createdPO.poNumber &&
    createdPO.totalAmount === 35000,
  'FR-04',
  'Procurement can create PO with unique PO ID in initial status Draft'
);

// ------------------------------------------------------------------------
// FR-05: Submit Purchase Order
// ------------------------------------------------------------------------
const submitReq = {
  params: { id: createdPO.id },
  user: { name: 'Pooja Verma', role: ROLES.PROCUREMENT },
};
const submitRes = mockRes();
submitPurchaseOrder(submitReq, submitRes);
assert(
  submitRes.statusCode === 200 &&
    submitRes.data.data.status === PO_STATUS.PENDING_APPROVAL &&
    submitRes.data.data.requiredApprovalLevel === 1,
  'FR-05',
  'Draft PO submitted into approval workflow with applicable approval level (Level 1)'
);

// ------------------------------------------------------------------------
// FR-06: Level 1 Approval (<= ₹50,000 - Amit Patel)
// ------------------------------------------------------------------------
const amitUser = store.getUsers().find(u => u.name === 'Amit Patel');
const poLevel1 = store.getPurchaseOrders().find(p => p.poNumber === 'PO-001'); // ₹35,000 -> Level 1
const apprL1Req = {
  params: { id: poLevel1.id },
  user: amitUser,
  body: { comments: 'Authorized by Amit Patel under Level 1 authority.' },
};
const apprL1Res = mockRes();
approvePurchaseOrder(apprL1Req, apprL1Res);
assert(
  apprL1Res.statusCode === 200 &&
    apprL1Res.data.data.status === PO_STATUS.APPROVED &&
    poLevel1.requiredApprovalLevel === 1,
  'FR-06',
  'PO <= ₹50,000 (PO-001: ₹35,000) routed and approved by Level 1 authority Amit Patel'
);

// ------------------------------------------------------------------------
// FR-07: Level 2 Approval (> ₹50,000 and <= ₹2,00,000 - Vikram Malhotra)
// ------------------------------------------------------------------------
const vikramUser = store.getUsers().find(u => u.name === 'Vikram Malhotra');
const poLevel2 = store.getPurchaseOrders().find(p => p.poNumber === 'PO-002'); // ₹1,50,000 -> Level 2

// Verify Level 1 user Amit Patel cannot approve PO-002 (Approval Bypass Prevention!)
const bypassReq = {
  params: { id: poLevel2.id },
  user: amitUser,
  body: { comments: 'Attempted bypass by Level 1 user' },
};
const bypassRes = mockRes();
approvePurchaseOrder(bypassReq, bypassRes);
assert(
  bypassRes.statusCode === 403 && bypassRes.data.blocked === true,
  'Approval Control',
  'Bypass prevention: Level 1 approver blocked from approving Level 2 PO'
);

// Now authorized Level 2 user Vikram Malhotra approves PO-002
const apprL2Req = {
  params: { id: poLevel2.id },
  user: vikramUser,
  body: { comments: 'Authorized by Vikram Malhotra under Level 2 authority.' },
};
const apprL2Res = mockRes();
approvePurchaseOrder(apprL2Req, apprL2Res);
assert(
  apprL2Res.statusCode === 200 &&
    apprL2Res.data.data.status === PO_STATUS.APPROVED &&
    poLevel2.requiredApprovalLevel === 2,
  'FR-07',
  'PO > ₹50,000 & <= ₹2,00,000 (PO-002: ₹1,50,000) approved by Level 2 authority Vikram Malhotra'
);

// ------------------------------------------------------------------------
// FR-08: Level 3 Approval (> ₹2,00,000 and <= ₹10,00,000 - Deepak Singhania)
// ------------------------------------------------------------------------
const deepakUser = store.getUsers().find(u => u.name === 'Deepak Singhania');
const poLevel3 = store.getPurchaseOrders().find(p => p.poNumber === 'PO-003'); // ₹7,50,000 -> Level 3
const apprL3Req = {
  params: { id: poLevel3.id },
  user: deepakUser,
  body: { comments: 'Authorized by Deepak Singhania under Level 3 authority.' },
};
const apprL3Res = mockRes();
approvePurchaseOrder(apprL3Req, apprL3Res);
assert(
  apprL3Res.statusCode === 200 &&
    apprL3Res.data.data.status === PO_STATUS.APPROVED &&
    poLevel3.requiredApprovalLevel === 3,
  'FR-08',
  'PO > ₹2,00,000 & <= ₹10,00,000 (PO-003: ₹7,50,000) approved by Level 3 authority Deepak Singhania'
);

// ------------------------------------------------------------------------
// FR-09: Level 4 Approval (> ₹10,00,000 - Ananya Deshmukh)
// ------------------------------------------------------------------------
const ananyaUser = store.getUsers().find(u => u.name === 'Ananya Deshmukh');
const poLevel4 = store.getPurchaseOrders().find(p => p.poNumber === 'PO-004'); // ₹15,00,000 -> Level 4
const apprL4Req = {
  params: { id: poLevel4.id },
  user: ananyaUser,
  body: { comments: 'Authorized by Ananya Deshmukh under Executive Level 4 authority.' },
};
const apprL4Res = mockRes();
approvePurchaseOrder(apprL4Req, apprL4Res);
assert(
  apprL4Res.statusCode === 200 &&
    apprL4Res.data.data.status === PO_STATUS.APPROVED &&
    poLevel4.requiredApprovalLevel === 4,
  'FR-09',
  'PO > ₹10,00,000 (PO-004: ₹15,00,000) approved by Level 4 Executive authority Ananya Deshmukh'
);

// ------------------------------------------------------------------------
// FR-10: Approve / Reject Purchase Order
// ------------------------------------------------------------------------
// Create PO to test rejection
const poToReject = store.createPurchaseOrder({
  vendorId: vendorToUpdate.id,
  vendorName: vendorToUpdate.companyName,
  productService: 'Expired Formulation Consignment',
  quantity: 50,
  unitPrice: 500,
  totalAmount: 25000,
  requiredApprovalLevel: 1,
  status: PO_STATUS.PENDING_APPROVAL,
  createdBy: 'Pooja Verma',
  approvalHistory: [],
});
const rejectReq = {
  params: { id: poToReject.id },
  user: amitUser,
  body: { comments: 'Rejected due to failed quality verification specifications.' },
};
const rejectRes = mockRes();
rejectPurchaseOrder(rejectReq, rejectRes);
assert(
  rejectRes.statusCode === 200 &&
    rejectRes.data.data.status === PO_STATUS.REJECTED &&
    rejectRes.data.data.approvalHistory.some(h => h.action === 'REJECTED' && h.user === 'Amit Patel'),
  'FR-10',
  'Authorized approver can reject PO with recorded decision, timestamp, comments'
);

// ------------------------------------------------------------------------
// FR-11: Vendor Acknowledgement
// ------------------------------------------------------------------------
const poForAck = store.getPurchaseOrders().find(p => p.poNumber === 'PO-005');
const rohanUser = store.getUsers().find(u => u.name === 'Rohan Mehta');
const ackReq = {
  params: { id: poForAck.id },
  user: rohanUser,
  body: {
    action: 'ACKNOWLEDGE',
    comments: 'Order accepted by Astra Meditech. Delivery scheduled for Oct 18.',
  },
};
const ackRes = mockRes();
acknowledgePurchaseOrder(ackReq, ackRes);
assert(
  ackRes.statusCode === 200 &&
    ackRes.data.data.status === PO_STATUS.ACKNOWLEDGED &&
    ackRes.data.data.vendorAcknowledgement.status === 'ACKNOWLEDGED' &&
    ackRes.data.data.vendorAcknowledgement.acknowledgedBy.includes('Rohan Mehta'),
  'FR-11',
  'Vendor electronically acknowledges approved PO, moving status to Acknowledged'
);

// Verify vendor cannot acknowledge another vendor's PO
const meeraUser = store.getUsers().find(u => u.name === 'Meera Rao');
const wrongVendorAckReq = {
  params: { id: poForAck.id },
  user: meeraUser,
  body: { action: 'ACKNOWLEDGE', comments: 'Unauthorized ack attempt' },
};
const wrongVendorAckRes = mockRes();
acknowledgePurchaseOrder(wrongVendorAckReq, wrongVendorAckRes);
assert(
  wrongVendorAckRes.statusCode === 403,
  'FR-11 Security',
  'Vendor cannot acknowledge POs belonging to competitor/different vendor'
);

// ------------------------------------------------------------------------
// FR-12: Review / Audit Approval Records
// ------------------------------------------------------------------------
const kavitaUser = store.getUsers().find(u => u.name === 'Kavita Nair');
const auditReq = {
  user: kavitaUser,
  query: { entityType: 'PURCHASE_ORDER' },
};
const auditRes = mockRes();
getAuditLogs(auditReq, auditRes);
assert(
  auditRes.statusCode === 200 &&
    auditRes.data.data.length > 0 &&
    auditRes.data.data.some(l => l.action.includes('APPROVED')),
  'FR-12',
  'Auditor Kavita Nair can review read-only PO approval records, amounts, approvers, decisions'
);

console.log('\n========================================================================');
console.log(`TOTAL 12-FR AUDIT RESULT: ${passed} / ${total} PASSED (${Math.round((passed / total) * 100)}%)`);
console.log('========================================================================\n');
