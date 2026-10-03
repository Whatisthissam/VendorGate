import { determineApprovalLevel, canApprovePO } from '../server/src/utils/approvalRules.js';
import { ROLES } from '../server/src/utils/constants.js';

console.log('========================================================================');
console.log('  VENDORGATE: AUTOMATED BOUNDARY VALUE & AUTHORITY POLICY VERIFICATION');
console.log('========================================================================\n');

const testCases = [
  { amount: 49999, expectedLevel: 1, desc: 'Boundary: ₹49,999 (Amount < ₹50,000 threshold)' },
  { amount: 50000, expectedLevel: 1, desc: 'Boundary: ₹50,000 (Exact Level 1 ceiling)' },
  { amount: 50001, expectedLevel: 2, desc: 'Boundary: ₹50,001 (+₹1 above Level 1 ceiling)' },
  { amount: 199999, expectedLevel: 2, desc: 'Boundary: ₹1,99,999 (Amount < ₹2,00,000 threshold)' },
  { amount: 200000, expectedLevel: 2, desc: 'Boundary: ₹2,00,000 (Exact Level 2 ceiling)' },
  { amount: 200001, expectedLevel: 3, desc: 'Boundary: ₹2,00,001 (+₹1 above Level 2 ceiling)' },
  { amount: 999999, expectedLevel: 3, desc: 'Boundary: ₹9,99,999 (Amount < ₹10,00,000 threshold)' },
  { amount: 1000000, expectedLevel: 3, desc: 'Boundary: ₹10,00,000 (Exact Level 3 ceiling)' },
  { amount: 1000001, expectedLevel: 4, desc: 'Boundary: ₹10,00,001 (+₹1 above Level 3 ceiling)' },
];

let passedCount = 0;

console.log('TEST SUITE 1: BOUNDARY VALUE ROUTING');
console.log('------------------------------------------------------------------------');
testCases.forEach((tc, idx) => {
  const calculated = determineApprovalLevel(tc.amount);
  const passed = calculated === tc.expectedLevel;
  if (passed) passedCount++;

  console.log(
    `[${passed ? 'PASS' : 'FAIL'}] Case ${idx + 1}: ₹${tc.amount.toLocaleString('en-IN').padStart(10)} ` +
    `-> Calculated: Level ${calculated} | Expected: Level ${tc.expectedLevel} | ${tc.desc}`
  );
});

console.log('\nTEST SUITE 2: APPROVAL RESTRICTION & AUTHORITY GATING');
console.log('------------------------------------------------------------------------');

// User 1: Level 2 Approver (Limit: ₹2,00,000)
const level2User = {
  id: 'usr_appr_l2',
  name: 'Vikram Malhotra',
  role: ROLES.APPROVER,
  approvalLevel: 2,
};

// User 2: Level 3 Approver (Limit: ₹10,00,000)
const level3User = {
  id: 'usr_appr_l3',
  name: 'Deepak Singhania',
  role: ROLES.APPROVER,
  approvalLevel: 3,
};

// Prompt Demo Scenario PO: ₹5,00,000 -> Required Level 3
const demoPOAmount = 500000;
const requiredLevel = determineApprovalLevel(demoPOAmount); // 3

// Test Case A: Level 2 Approver attempts to approve Level 3 PO
const testA = canApprovePO(level2User, requiredLevel);
const testAPassed = !testA.allowed && testA.reason.includes('Approval Restricted');
if (testAPassed) passedCount++;

console.log(
  `[${testAPassed ? 'PASS' : 'FAIL'}] Authority Restriction Test (Level 2 user on ₹5,00,000 PO):\n` +
  `       Blocked as expected: ${!testA.allowed}\n` +
  `       Restriction Message: "${testA.reason}"`
);

// Test Case B: Level 3 Approver attempts to approve Level 3 PO
const testB = canApprovePO(level3User, requiredLevel);
const testBPassed = testB.allowed;
if (testBPassed) passedCount++;

console.log(
  `\n[${testBPassed ? 'PASS' : 'FAIL'}] Authority Grant Test (Level 3 user on ₹5,00,000 PO):\n` +
  `       Allowed as expected: ${testB.allowed}`
);

// User 3: Level 4 Approver (Executive Authority)
const level4User = {
  id: 'usr_appr_l4',
  name: 'Ananya Deshmukh',
  role: ROLES.APPROVER,
  approvalLevel: 4,
};

// User 4: Level 1 Approver (Up to ₹50,000)
const level1User = {
  id: 'usr_appr_l1',
  name: 'Amit Patel',
  role: ROLES.APPROVER,
  approvalLevel: 1,
};

// Level 1 PO Scenario: ₹35,000 -> Required Level 1
const level1POAmount = 35000;
const requiredLevel1 = determineApprovalLevel(level1POAmount); // 1

// Test Case C: Level 4 Approver attempts to approve Level 1 PO (Should be BLOCKED: strict level matching)
const testC = canApprovePO(level4User, requiredLevel1);
const testCPassed = !testC.allowed && testC.reason.includes('Approval Restricted');
if (testCPassed) passedCount++;

console.log(
  `\n[${testCPassed ? 'PASS' : 'FAIL'}] Strict Level Matching Test (Level 4 user on Level 1 PO):\n` +
  `       Blocked as expected: ${!testC.allowed}\n` +
  `       Restriction Message: "${testC.reason}"`
);

// Test Case D: Level 1 Approver approves Level 1 PO (Should be ALLOWED)
const testD = canApprovePO(level1User, requiredLevel1);
const testDPassed = testD.allowed;
if (testDPassed) passedCount++;

console.log(
  `\n[${testDPassed ? 'PASS' : 'FAIL'}] Exact Tier Match Test (Level 1 user on Level 1 PO):\n` +
  `       Allowed as expected: ${testD.allowed}`
);

const totalExpectedTests = testCases.length + 4;
console.log('\n========================================================================');
console.log(`TOTAL TEST RESULT: ${passedCount} / ${totalExpectedTests} PASSED (${Math.round((passedCount / totalExpectedTests) * 100)}%)`);
console.log('========================================================================');

if (passedCount === totalExpectedTests) {
  process.exit(0);
} else {
  process.exit(1);
}
