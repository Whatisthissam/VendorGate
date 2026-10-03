import { User } from '../types';

export const APPROVAL_LIMITS = {
  LEVEL_1_MAX: 50000,
  LEVEL_2_MAX: 200000,
  LEVEL_3_MAX: 1000000,
};

export function calculatePOAmount(quantity: number, unitPrice: number): number {
  const qty = Number(quantity) || 0;
  const price = Number(unitPrice) || 0;
  return Math.round(qty * price * 100) / 100;
}

/**
 * Determines required approval level from PO amount
 * Boundary rules:
 * Level 1: amount <= ₹50,000
 * Level 2: amount > ₹50,000 and <= ₹2,00,000
 * Level 3: amount > ₹2,00,000 and <= ₹10,00,000
 * Level 4: amount > ₹10,00,000
 */
export function determineApprovalLevel(amount: number): number {
  const amt = Number(amount);
  if (isNaN(amt) || amt <= 0) return 1;

  if (amt <= APPROVAL_LIMITS.LEVEL_1_MAX) {
    return 1;
  } else if (amt <= APPROVAL_LIMITS.LEVEL_2_MAX) {
    return 2;
  } else if (amt <= APPROVAL_LIMITS.LEVEL_3_MAX) {
    return 3;
  } else {
    return 4;
  }
}

export function getApprovalLevelDescription(level: number): string {
  switch (level) {
    case 1:
      return 'Level 1 (Up to ₹50,000)';
    case 2:
      return 'Level 2 (₹50,001 - ₹2,00,000)';
    case 3:
      return 'Level 3 (₹2,00,001 - ₹10,00,000)';
    case 4:
      return 'Level 4 (Above ₹10,00,000 - Executive Authority)';
    default:
      return `Level ${level}`;
  }
}

/**
 * Checks if a user has sufficient authority to approve a PO.
 * Exact tier rule: Level 1 PO can only be approved by Level 1 approver,
 * Level 2 PO can only be approved by Level 2 approver,
 * Level 3 PO can only be approved by Level 3 approver,
 * Level 4 PO can only be approved by Level 4 approver.
 */
export function canApprovePO(user: User | null, requiredLevel: number): { allowed: boolean; reason?: string } {
  if (!user) {
    return { allowed: false, reason: 'Authentication required.' };
  }

  if (user.role === 'ADMIN') {
    return { allowed: true };
  }

  if (user.role !== 'APPROVER') {
    return {
      allowed: false,
      reason: `Your current role '${user.role}' does not possess purchase order approval authority.`,
    };
  }

  const userLevel = Number(user.approvalLevel) || 0;
  if (userLevel !== requiredLevel) {
    return {
      allowed: false,
      reason: `Approval Restricted: You are assigned to Level ${userLevel} approvals. This PO requires dedicated Level ${requiredLevel} approval authority.`,
    };
  }

  return { allowed: true };
}
