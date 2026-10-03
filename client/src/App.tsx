import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { MainLayout } from './layouts/MainLayout';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { VendorsPage } from './pages/VendorsPage';
import { VendorDetailPage } from './pages/VendorDetailPage';
import { VendorRegisterPage } from './pages/VendorRegisterPage';
import { DocumentVerificationPage } from './pages/DocumentVerificationPage';
import { PurchaseOrdersPage } from './pages/PurchaseOrdersPage';
import { CreatePOPage } from './pages/CreatePOPage';
import { PODetailPage } from './pages/PODetailPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { AuditTrailPage } from './pages/AuditTrailPage';
import { ReportsPage } from './pages/ReportsPage';
import { ProjectOverviewPage } from './pages/ProjectOverviewPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Protected Route Wrapper for Simulated Auth
const ProtectedLayout: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-mono">Initializing VendorGate Session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <MainLayout />;
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Login & Registration (FR-01) - Root opens Login first */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<div className="min-h-screen bg-slate-50 p-6 sm:p-12"><VendorRegisterPage /></div>} />

            {/* Protected Portal Application Routes */}
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/vendors" element={<VendorsPage />} />
              <Route path="/vendors/new" element={<VendorRegisterPage />} />
              <Route path="/vendors/:id" element={<VendorDetailPage />} />
              <Route path="/documents" element={<DocumentVerificationPage />} />
              <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
              <Route path="/purchase-orders/new" element={<CreatePOPage />} />
              <Route path="/purchase-orders/:id" element={<PODetailPage />} />
              <Route path="/approvals" element={<ApprovalsPage />} />
              <Route path="/audit" element={<AuditTrailPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/project-overview" element={<ProjectOverviewPage />} />
            </Route>

            {/* 404 Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
