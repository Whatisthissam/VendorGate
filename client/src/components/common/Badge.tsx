import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const variants = {
    default: 'bg-slate-100 text-slate-800 border-slate-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    purple: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[11px] font-medium',
    md: 'px-2.5 py-1 text-xs font-medium',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded border tracking-wide uppercase font-mono ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export const VendorStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'Approved':
      return <Badge variant="success">Approved</Badge>;
    case 'Under Review':
      return <Badge variant="info">Under Review</Badge>;
    case 'Submitted':
      return <Badge variant="warning">Submitted</Badge>;
    case 'Correction Required':
      return <Badge variant="warning">Correction Needed</Badge>;
    case 'Rejected':
      return <Badge variant="danger">Rejected</Badge>;
    case 'Draft':
    default:
      return <Badge variant="neutral">Draft</Badge>;
  }
};

export const POStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'Approved':
      return <Badge variant="success">Approved</Badge>;
    case 'Acknowledged':
      return <Badge variant="success">Acknowledged</Badge>;
    case 'Pending Approval':
      return <Badge variant="warning">Pending Approval</Badge>;
    case 'Sent to Vendor':
      return <Badge variant="info">Sent to Vendor</Badge>;
    case 'Rejected':
      return <Badge variant="danger">Rejected</Badge>;
    case 'Vendor Rejected':
      return <Badge variant="danger">Vendor Rejected</Badge>;
    case 'Submitted':
      return <Badge variant="info">Submitted</Badge>;
    case 'Draft':
    default:
      return <Badge variant="neutral">Draft</Badge>;
  }
};

export const ApprovalLevelBadge: React.FC<{ level: number }> = ({ level }) => {
  const styles: Record<number, { variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple'; label: string }> = {
    1: { variant: 'neutral', label: 'Level 1 (≤ ₹50k)' },
    2: { variant: 'info', label: 'Level 2 (≤ ₹2L)' },
    3: { variant: 'warning', label: 'Level 3 (≤ ₹10L)' },
    4: { variant: 'purple', label: 'Level 4 (> ₹10L)' },
  };

  const config = styles[level] || { variant: 'neutral', label: `Level ${level}` };

  return <Badge variant={config.variant}>L{level} Approver</Badge>;
};

export const DocumentStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'Verified':
      return <Badge variant="success">Verified</Badge>;
    case 'Uploaded':
      return <Badge variant="info">Uploaded</Badge>;
    case 'Rejected':
      return <Badge variant="danger">Rejected</Badge>;
    case 'Pending':
    default:
      return <Badge variant="neutral">Pending</Badge>;
  }
};
