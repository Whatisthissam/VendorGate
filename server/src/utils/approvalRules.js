import { APPROVAL_LEVELS, APPROVAL_LIMITS, ROLES } from './constants.js';

/**
 * Calculates total amount for a PO line item or collection of items
 * @param {number} quantity 
 * @param {number} unitPrice 
 * @returns {number} Total amount
 */
export function calculatePOAmount(quantity, unitPrice) {
  const qty = Number(quantity) || 0;
  const price = Number(unitPrice) || 0;
  return Math.round(qty * price * 100) / 100;
}

/**
 * Determines the required approval level based on the PO total amount.
 * 
 * Boundary Logic:
 * Level 1: amount <= ₹50,000
 * Level 2: amount > ₹50,000 and <= ₹2,00,000
 * Level 3: amount > ₹2,00,000 and <= ₹10,00,000
 * Level 4: amount > ₹10,00,000
 * 
 * @param {number} amount Total PO Amount
 * @returns {number} Approval Level (1, 2, 3, or 4)
 */
export function determineApprovalLevel(amount) {
  const amt = Number(amount);
  if (isNaN(amt) || amt <= 0) {
    return APPROVAL_LEVELS.LEVEL_1;
  }

  if (amt <= APPROVAL_LIMITS.LEVEL_1_MAX) {
    return APPROVAL_LEVELS.LEVEL_1;
  } else if (amt <= APPROVAL_LIMITS.LEVEL_2_MAX) {
    return APPROVAL_LEVELS.LEVEL_2;
  } else if (amt <= APPROVAL_LIMITS.LEVEL_3_MAX) {
    return APPROVAL_LEVELS.LEVEL_3;
  } else {
    return APPROVAL_LEVELS.LEVEL_4;
  }
}

/**
 * Gets human-readable approval level designation & ceiling
 * @param {number} level 
 * @returns {string} Description
 */
export function getApprovalLevelDescription(level) {
  switch (level) {
    case 1:
      return 'Level 1 (Up to ₹50,000)';
    case 2:
      return 'Level 2 (Up to ₹2,00,000)';
    case 3:
      return 'Level 3 (Up to ₹10,00,000)';
    case 4:
      return 'Level 4 (Above ₹10,00,000 - Executive Authority)';
    default:
      return `Level ${level}`;
  }
}

/**
 * Validates whether a user with given role and approval level has authority to approve a PO.
 * ADMIN has system-wide approval authority.
 * APPROVER must strictly match the requiredLevel (Level 1 for Level 1, Level 2 for Level 2, Level 3 for Level 3, Level 4 for Level 4).
 * A higher level approver (e.g. Level 4) cannot approve lower level POs (e.g. Level 1).
 * Other roles (PROCUREMENT, FINANCE, AUDITOR, VENDOR) cannot approve POs.
 * 
 * @param {object} user User object with role and optional approvalLevel
 * @param {number} requiredLevel The required approval level for the PO
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function canApprovePO(user, requiredLevel) {
  if (!user) {
    return { allowed: false, reason: 'Authentication required.' };
  }

  // Admin has emergency override / system authority
  if (user.role === ROLES.ADMIN) {
    return { allowed: true };
  }

  // Only APPROVER role can approve purchase orders
  if (user.role !== ROLES.APPROVER) {
    return {
      allowed: false,
      reason: `Role '${user.role}' is not authorized to approve purchase orders. Approver credentials required.`,
    };
  }

  const userLevel = Number(user.approvalLevel) || 0;
  if (userLevel !== requiredLevel) {
    return {
      allowed: false,
      reason: `Approval Restricted: Your approval authority is Level ${userLevel}. This PO requires Level ${requiredLevel} approval. (Level ${requiredLevel} POs can only be approved by a Level ${requiredLevel} Approver).`,
    };
  }

  return { allowed: true };
}
