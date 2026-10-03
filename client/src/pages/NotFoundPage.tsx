import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mx-auto border border-rose-200">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">404 - Page Not Found</h1>
        <p className="text-xs text-slate-500">
          The requested compliance or requisition resource does not exist or has been relocated.
        </p>
        <div className="pt-2">
          <Link to="/dashboard" className="btn-primary text-xs">
            <Home className="w-3.5 h-3.5" />
            <span>Return to Operations Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
