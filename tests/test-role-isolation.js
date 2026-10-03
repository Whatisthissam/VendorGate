import { store } from '../server/src/data/store.js';
import { getVendors, getVendorById } from '../server/src/controllers/vendor.controller.js';
import { getPurchaseOrders, getPurchaseOrderById, createPurchaseOrder } from '../server/src/controllers/po.controller.js';
import { getAuditLogs } from '../server/src/controllers/audit.controller.js';
import { getProjectOverview } from '../server/src/controllers/project.controller.js';
import { getDashboardStats } from '../server/src/controllers/dashboard.controller.js';
import { ROLES } from '../server/src/utils/constants.js';

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
console.log('  VENDORGATE: ROLE ISOLATION & TAILORED WORKSPACE VERIFICATION');
console.log('========================================================================\n');

let passed = 0;
let total = 0;

function assert(condition, testName) {
  total++;
  if (condition) {
    passed++;
    console.log(`[PASS] ${testName}`);
  } else {
    console.error(`[FAIL] ${testName}`);
  }
}

// TEST 1: Vendor cannot view other vendors
const vendorUser = store.getUsers().find(u => u.role === ROLES.VENDOR);
const otherVendor = store.getVendors().find(v => v.id !== vendorUser.vendorId);

const req1 = { user: vendorUser, query: {} };
const res1 = mockRes();
getVendors(req1, res1);
assert(
  res1.data.success && res1.data.count === 1 && res1.data.data[0].id === vendorUser.vendorId,
  'Vendor querying /api/vendors only receives their own company record'
);

// TEST 2: Vendor accessing another vendor dossier is blocked (403)
const req2 = { user: vendorUser, params: { id: otherVendor.id } };
const res2 = mockRes();
getVendorById(req2, res2);
assert(
  res2.statusCode === 403,
  'Vendor attempting to inspect competitor vendor dossier is blocked with 403 Forbidden'
);

// TEST 3: Vendor accessing their own dossier succeeds (200)
const req3 = { user: vendorUser, params: { id: vendorUser.vendorId } };
const res3 = mockRes();
getVendorById(req3, res3);
assert(
  res3.statusCode === 200 && res3.data.data.id === vendorUser.vendorId,
  'Vendor inspecting their own compliance dossier succeeds (200 OK)'
);

// TEST 4: Vendor querying POs only gets their assigned orders
const req4 = { user: vendorUser, query: {} };
const res4 = mockRes();
getPurchaseOrders(req4, res4);
const allAreOwnPOs = res4.data.data.every(po => po.vendorId === vendorUser.vendorId);
assert(
  res4.data.success && allAreOwnPOs && res4.data.data.length > 0,
  'Vendor querying /api/purchase-orders only receives POs assigned to their company'
);

// TEST 5: Vendor querying competitor PO detail is blocked (403)
const competitorPO = store.getPurchaseOrders().find(po => po.vendorId !== vendorUser.vendorId);
const req5 = { user: vendorUser, params: { id: competitorPO.id } };
const res5 = mockRes();
getPurchaseOrderById(req5, res5);
assert(
  res5.statusCode === 403,
  'Vendor attempting to inspect competitor PO detail is blocked with 403 Forbidden'
);

// TEST 6: Vendor cannot create POs (403)
const req6 = {
  user: vendorUser,
  body: {
    vendorId: vendorUser.vendorId,
    productService: 'Unauthorized Requisition',
    quantity: 10,
    unitPrice: 100,
  },
};
const res6 = mockRes();
createPurchaseOrder(req6, res6);
assert(
  res6.statusCode === 403,
  'Vendor attempting to create PO is blocked with 403 Forbidden'
);

// TEST 7: Vendor cannot access distributor internal audit logs (403)
const req7 = { user: vendorUser, query: {} };
const res7 = mockRes();
getAuditLogs(req7, res7);
assert(
  res7.statusCode === 403,
  'Vendor attempting to access internal audit logs is blocked with 403 Forbidden'
);

// TEST 8: Auditor can access audit logs
const auditorUser = store.getUsers().find(u => u.role === ROLES.AUDITOR);
const req8 = { user: auditorUser, query: {} };
const res8 = mockRes();
getAuditLogs(req8, res8);
assert(
  res8.statusCode === 200 && res8.data.data.length > 0,
  'Auditor successfully accesses immutable audit logs (200 OK)'
);

// TEST 9: Project Overview (59-Day CPM) is restricted from non-admin roles (403)
const req9a = { user: vendorUser };
const res9a = mockRes();
getProjectOverview(req9a, res9a);
assert(
  res9a.statusCode === 403,
  'Vendor cannot access Academic Project Overview (403 Forbidden)'
);

const req9b = { user: auditorUser };
const res9b = mockRes();
getProjectOverview(req9b, res9b);
assert(
  res9b.statusCode === 403,
  'Auditor cannot access Academic Project Overview (403 Forbidden)'
);

// TEST 10: Admin can access Project Overview
const adminUser = store.getUsers().find(u => u.role === ROLES.ADMIN);
const req10 = { user: adminUser };
const res10 = mockRes();
getProjectOverview(req10, res10);
assert(
  res10.statusCode === 200 && res10.data.data.totalWorkingDays === 59,
  'Administrator can access Academic Project Overview (59-Day CPM confirmed)'
);

// TEST 11: Vendor Dashboard stats contains tailored vendorData with distributor relationship & compliance
const req11 = { user: vendorUser, query: {} };
const res11 = mockRes();
getDashboardStats(req11, res11);
assert(
  res11.data.data.vendorData &&
    res11.data.data.vendorData.vendor.id === vendorUser.vendorId &&
    res11.data.data.vendorData.metrics.verificationStats,
  'Vendor dashboard stats contains tailored vendorData (distributor relationship & 11-doc compliance)'
);

// TEST 12: Auditor Dashboard stats contains 34 historic findings and 0 current bypasses
const req12 = { user: auditorUser, query: {} };
const res12 = mockRes();
getDashboardStats(req12, res12);
assert(
  res12.data.data.auditorData &&
    res12.data.data.auditorData.metrics.historicViolations === 34 &&
    res12.data.data.auditorData.metrics.currentViolations === 0,
  'Auditor dashboard stats contains 34 historic findings vs 0 active bypasses invariant'
);

console.log('\n========================================================================');
console.log(`TOTAL TEST RESULT: ${passed} / ${total} PASSED (${Math.round((passed / total) * 100)}%)`);
console.log('========================================================================\n');
