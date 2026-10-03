import React from 'react';
import { Modal } from './Modal';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';

interface DemoScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoScenarioModal: React.FC<DemoScenarioModalProps> = ({ isOpen, onClose }) => {
  const { demoUsers, switchUser } = useAuth();
  const navigate = useNavigate();

  const handleQuickJump = (roleName: string, path: string) => {
    const targetUser = demoUsers.find(u => {
      if (roleName === 'APPROVER_L2') return u.role === 'APPROVER' && u.approvalLevel === 2;
      if (roleName === 'APPROVER_L3') return u.role === 'APPROVER' && u.approvalLevel === 3;
      if (roleName === 'VENDOR') return u.role === 'VENDOR' && u.vendorId === 'VEND-001';
      return u.role === roleName;
    });

    if (targetUser) {
      switchUser(targetUser);
    }
    navigate(path);
    onClose();
  };

  const steps = [
    {
      step: '1-6',
      title: 'Procurement: Vendor Verification (11 Documents)',
      role: 'PROCUREMENT',
      path: '/vendors/VEND-003',
      description: 'Review Suncrest Lifesciences (8/11 verified). Demonstrate verifying or requesting correction on regulatory drug licenses.',
      actionLabel: 'Jump: Procurement & Suncrest Vendor',
    },
    {
      step: '7-10',
      title: 'Procurement: Create ₹5,00,000 Purchase Order',
      role: 'PROCUREMENT',
      path: '/purchase-orders/new',
      description: 'Enter Astra Meditech, Qty: 1000, Price: ₹500. Watch system auto-calculate ₹5,00,000 and enforce Level 3 approval routing.',
      actionLabel: 'Jump: New PO Form',
    },
    {
      step: '11-14',
      title: 'Approval Bypass Test: Level 2 Approver Blocked',
      role: 'APPROVER_L2',
      path: '/purchase-orders/PO-2026-1024',
      description: 'Login as Vikram Malhotra (Level 2, max ₹2,00,000). Try to approve the ₹5,00,000 PO. System restricts approval & logs incident!',
      actionLabel: 'Jump: Level 2 Approver & PO-1024',
      isSecurityGate: true,
    },
    {
      step: '15-16',
      title: 'Valid Authorization: Level 3 Approver Signs Off',
      role: 'APPROVER_L3',
      path: '/purchase-orders/PO-2026-1024',
      description: 'Login as Deepak Singhania (VP, Level 3). Approve the ₹5,00,000 PO with comments. Status changes to Approved.',
      actionLabel: 'Jump: Level 3 Approver & PO-1024',
    },
    {
      step: '17-19',
      title: 'Vendor Acknowledgement: Astra Meditech Portal',
      role: 'VENDOR',
      path: '/purchase-orders',
      description: 'Login as Rohan Mehta (Astra Meditech). View assigned PO and click "Acknowledge PO" to confirm delivery schedule.',
      actionLabel: 'Jump: Vendor Portal View',
    },
    {
      step: '20-21',
      title: 'Auditor: Tamper-Proof Audit Trail Verification',
      role: 'AUDITOR',
      path: '/audit',
      description: 'Login as Kavita Nair (Auditor). Inspect complete immutable timestamped trail of creation, blocked attempt, approval, and acceptance.',
      actionLabel: 'Jump: Compliance Audit Trail',
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="College Presentation Demo Guide"
      subtitle="Follow this 21-step workflow to showcase VendorGate's core business & security rules"
      maxWidth="2xl"
    >
      <div className="space-y-4">
        <div className="p-3.5 bg-slate-900 text-white rounded-lg text-xs leading-relaxed flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white">Academic Defense Highlight:</span>
            <p className="text-slate-300 mt-0.5">
              VendorGate resolves the pharmaceutical distributor’s primary compliance failure (34 historic unapproved POs) through automated boundary calculation and server-enforced approval gating.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {steps.map((item, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border transition-all ${
                item.isSecurityGate
                  ? 'border-rose-200 bg-rose-50/40 hover:bg-rose-50/70'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                      Steps {item.step}
                    </span>
                    <h4 className="text-sm font-semibold text-slate-900">{item.title}</h4>
                    {item.isSecurityGate && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded border border-rose-200">
                        <ShieldAlert className="w-3 h-3" /> Security Gate
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{item.description}</p>
                </div>

                <button
                  onClick={() => handleQuickJump(item.role, item.path)}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5 text-slate-600" />
                  <span>Launch Step</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
