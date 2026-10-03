const API_BASE_URL = '/api';

function getAuthHeaders(): HeadersInit {
  const storedUser = localStorage.getItem('vendorgate_active_user');
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      return {
        'x-user-id': user.id,
        'x-user-role': user.role,
      };
    } catch {
      // Fallback
    }
  }
  return {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    const error: any = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth & Demo
  getDemoUsers: () => request<{ success: boolean; data: any[] }>('/auth/demo-users'),
  loginDemoUser: (userId: string) =>
    request<{ success: boolean; data: any; message: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
  resetDemoData: () => request<{ success: boolean; message: string }>('/admin/reset', { method: 'POST' }),

  // Dashboard & Reports
  getDashboardStats: () => request<{ success: boolean; data: any }>('/dashboard/stats'),
  getReportMetrics: () => request<{ success: boolean; data: any }>('/dashboard/reports'),

  // Vendors
  getVendors: (params: { status?: string; search?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'ALL') query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    return request<{ success: boolean; data: any[]; count: number }>(`/vendors?${query.toString()}`);
  },
  getVendorById: (id: string) => request<{ success: boolean; data: any }>(`/vendors/${id}`),
  createVendor: (vendorData: any) =>
    request<{ success: boolean; data: any; message: string }>('/vendors', {
      method: 'POST',
      body: JSON.stringify(vendorData),
    }),
  updateVendor: (id: string, updates: any) =>
    request<{ success: boolean; data: any; message: string }>(`/vendors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  // Documents
  getVendorDocuments: (vendorId: string) =>
    request<{ success: boolean; data: any }>(`/vendors/${vendorId}/documents`),
  verifyDocument: (vendorId: string, documentId: string, status: string, remarks?: string) =>
    request<{ success: boolean; data: any; message: string }>(`/vendors/${vendorId}/documents/${documentId}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ status, remarks }),
    }),
  uploadDocument: (vendorId: string, documentId: string, fileName?: string) =>
    request<{ success: boolean; data: any; message: string }>(`/vendors/${vendorId}/documents/${documentId}/upload`, {
      method: 'POST',
      body: JSON.stringify({ fileName }),
    }),

  // Purchase Orders
  getPurchaseOrders: (params: { status?: string; approvalLevel?: string; vendorId?: string; search?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'ALL') query.set('status', params.status);
    if (params.approvalLevel && params.approvalLevel !== 'ALL') query.set('approvalLevel', params.approvalLevel);
    if (params.vendorId) query.set('vendorId', params.vendorId);
    if (params.search) query.set('search', params.search);
    return request<{ success: boolean; data: any[]; count: number }>(`/purchase-orders?${query.toString()}`);
  },
  getPurchaseOrderById: (id: string) => request<{ success: boolean; data: any }>(`/purchase-orders/${id}`),
  createPurchaseOrder: (poData: any) =>
    request<{ success: boolean; data: any; message: string }>('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(poData),
    }),
  submitPurchaseOrder: (id: string) =>
    request<{ success: boolean; data: any; message: string }>(`/purchase-orders/${id}/submit`, {
      method: 'POST',
    }),
  approvePurchaseOrder: (id: string, comments?: string) =>
    request<{ success: boolean; data: any; message: string }>(`/purchase-orders/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comments }),
    }),
  rejectPurchaseOrder: (id: string, comments?: string) =>
    request<{ success: boolean; data: any; message: string }>(`/purchase-orders/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ comments }),
    }),
  sendPOToVendor: (id: string) =>
    request<{ success: boolean; data: any; message: string }>(`/purchase-orders/${id}/send-to-vendor`, {
      method: 'POST',
    }),
  acknowledgePurchaseOrder: (id: string, action: 'ACKNOWLEDGE' | 'REJECT', comments?: string) =>
    request<{ success: boolean; data: any; message: string }>(`/purchase-orders/${id}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ action, comments }),
    }),

  // Audit Logs
  getAuditLogs: (params: { entityType?: string; userRole?: string; search?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.entityType && params.entityType !== 'ALL') query.set('entityType', params.entityType);
    if (params.userRole && params.userRole !== 'ALL') query.set('userRole', params.userRole);
    if (params.search) query.set('search', params.search);
    return request<{ success: boolean; data: any[]; count: number }>(`/audit-logs?${query.toString()}`);
  },

  // Project Management Metadata
  getProjectOverview: () => request<{ success: boolean; data: any }>('/project/overview'),
};
