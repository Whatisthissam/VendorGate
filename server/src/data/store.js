import { seedUsers } from './seedUsers.js';
import { seedVendors } from './seedVendors.js';
import { seedPurchaseOrders } from './seedPurchaseOrders.js';
import { seedAuditLogs } from './seedAuditLogs.js';
import { projectMetadata } from './projectMetadata.js';

// Deep clone utility for clean resets
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

class InDiskMemoryStore {
  constructor() {
    this.reset();
  }

  reset() {
    this.users = deepClone(seedUsers);
    this.vendors = deepClone(seedVendors);
    this.purchaseOrders = deepClone(seedPurchaseOrders);
    this.auditLogs = deepClone(seedAuditLogs);
    this.projectMetadata = deepClone(projectMetadata);
  }

  // Users
  getUsers() {
    return this.users;
  }

  getUserById(id) {
    return this.users.find(u => u.id === id);
  }

  // Vendors
  getVendors(filter = {}) {
    let result = [...this.vendors];
    if (filter.status && filter.status !== 'ALL') {
      result = result.filter(v => v.status.toLowerCase() === filter.status.toLowerCase());
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(v =>
        v.companyName.toLowerCase().includes(q) ||
        v.id.toLowerCase().includes(q) ||
        v.contactPerson.toLowerCase().includes(q) ||
        v.gstNumber.toLowerCase().includes(q) ||
        v.city.toLowerCase().includes(q)
      );
    }
    return result;
  }

  getVendorById(id) {
    return this.vendors.find(v => v.id === id);
  }

  createVendor(vendorData) {
    const nextNum = this.vendors.length + 1;
    const newId = `VEND-${String(nextNum).padStart(3, '0')}`;
    const newVendor = {
      ...vendorData,
      id: newId,
      registrationDate: new Date().toISOString(),
    };
    this.vendors.unshift(newVendor);
    return newVendor;
  }

  updateVendor(id, updates) {
    const index = this.vendors.findIndex(v => v.id === id);
    if (index === -1) return null;
    this.vendors[index] = { ...this.vendors[index], ...updates };
    return this.vendors[index];
  }

  // Purchase Orders
  getPurchaseOrders(filter = {}) {
    let result = [...this.purchaseOrders];
    if (filter.status && filter.status !== 'ALL') {
      result = result.filter(p => p.status.toLowerCase() === filter.status.toLowerCase());
    }
    if (filter.approvalLevel) {
      result = result.filter(p => p.requiredApprovalLevel === Number(filter.approvalLevel));
    }
    if (filter.vendorId) {
      result = result.filter(p => p.vendorId === filter.vendorId);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(p =>
        p.poNumber.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.vendorName.toLowerCase().includes(q) ||
        p.productService.toLowerCase().includes(q)
      );
    }
    return result;
  }

  getPurchaseOrderById(id) {
    return this.purchaseOrders.find(p => p.id === id || p.poNumber === id);
  }

  createPurchaseOrder(poData) {
    const nextNum = 1000 + this.purchaseOrders.length + 1;
    const poNumber = `PO-${nextNum}`;
    const id = `PO-2026-${nextNum}`;

    const newPO = {
      ...poData,
      id,
      poNumber,
      createdAt: new Date().toISOString(),
      approvalHistory: poData.approvalHistory || [],
    };
    this.purchaseOrders.unshift(newPO);
    return newPO;
  }

  updatePurchaseOrder(id, updates) {
    const index = this.purchaseOrders.findIndex(p => p.id === id || p.poNumber === id);
    if (index === -1) return null;
    this.purchaseOrders[index] = { ...this.purchaseOrders[index], ...updates };
    return this.purchaseOrders[index];
  }

  // Audit Logs
  getAuditLogs(filter = {}) {
    let result = [...this.auditLogs];
    if (filter.entityType && filter.entityType !== 'ALL') {
      result = result.filter(l => l.entityType === filter.entityType);
    }
    if (filter.userRole && filter.userRole !== 'ALL') {
      result = result.filter(l => l.userRole === filter.userRole);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(l =>
        l.description.toLowerCase().includes(q) ||
        l.userName.toLowerCase().includes(q) ||
        l.entityId.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q)
      );
    }
    // Sort descending by timestamp
    return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  addAuditLog({ userName, userRole, action, entityType, entityId, description }) {
    const nextId = `AUD-${9000 + this.auditLogs.length + 1}`;
    const logEntry = {
      id: nextId,
      timestamp: new Date().toISOString(),
      userName: userName || 'System User',
      userRole: userRole || 'SYSTEM',
      action,
      entityType,
      entityId,
      description,
    };
    this.auditLogs.unshift(logEntry);
    return logEntry;
  }

  // Project Metadata
  getProjectMetadata() {
    return this.projectMetadata;
  }
}

export const store = new InDiskMemoryStore();
