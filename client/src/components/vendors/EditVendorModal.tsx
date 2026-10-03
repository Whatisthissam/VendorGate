import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Vendor } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Building2, User, Landmark, Save, AlertCircle, Sparkles } from 'lucide-react';

interface EditVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor;
  onSuccess: (updated: Vendor) => void;
}

export const EditVendorModal: React.FC<EditVendorModalProps> = ({
  isOpen,
  onClose,
  vendor,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    companyName: vendor.companyName,
    category: vendor.category,
    contactPerson: vendor.contactPerson,
    email: vendor.email,
    phone: vendor.phone,
    address: vendor.address,
    city: vendor.city,
    state: vendor.state,
    pincode: vendor.pincode,
    bankName: vendor.bankName || '',
    accountNumber: vendor.accountNumber || '',
    ifscCode: vendor.ifscCode || '',
    notes: vendor.notes || '',
    status: vendor.status,
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const isStaff = user?.role === 'ADMIN' || user?.role === 'PROCUREMENT';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!formData.companyName.trim()) errs.companyName = 'Company Name cannot be empty.';
    if (!formData.contactPerson.trim()) errs.contactPerson = 'Contact Person is required.';
    if (!formData.email.trim()) errs.email = 'Email Address is required.';

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      error('Validation Error', 'Please complete all required fields.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.updateVendor(vendor.id, formData);
      if (res.success && res.data) {
        success('Vendor Profile Updated', `Information for '${formData.companyName}' has been saved.`);
        onSuccess(res.data);
      }
    } catch (err: any) {
      error('Update Failed', err.message || 'Could not update vendor details.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickUpdate = () => {
    const samplePhones = ['+91 98200 99881', '+91 94401 88772', '+91 98450 11223', '+91 99999 55443'];
    const randomPhone = samplePhones[Math.floor(Math.random() * samplePhones.length)];
    setFormData(prev => ({
      ...prev,
      phone: randomPhone,
      notes: `Updated procurement direct dispatch desk. Verified compliance audit on ${new Date().toLocaleDateString('en-IN')}.`,
    }));
    success('Sample Changes Loaded', 'Updated phone number & procurement notes. Click Save Changes to persist.');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Manage Vendor Information: ${vendor.companyName}`}
      subtitle={`Vendor ID: ${vendor.id} • Registered ${vendor.category}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Viva Quick-Update Bar */}
        <div className="flex items-center justify-between p-2.5 bg-slate-900 text-white rounded-lg border border-slate-800 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-[11px]">Viva Quick Demo:</span>
          </div>
          <button
            type="button"
            onClick={handleQuickUpdate}
            className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors flex items-center gap-1 shadow-sm"
          >
            <Sparkles className="w-3 h-3" />
            <span>⚡ Auto-Fill Sample Changes</span>
          </button>
        </div>

        {/* Company & Category */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-200 pb-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-700" />
            <span>Company Details</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label-base">Company Name *</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className={`input-base ${fieldErrors.companyName ? 'border-rose-500' : ''}`}
                required
              />
            </div>

            <div>
              <label className="label-base">Category</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="input-base"
              />
            </div>

            {isStaff && (
              <div className="sm:col-span-2">
                <label className="label-base">Registration Status (Administrative)</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="input-base"
                >
                  <option value="Draft">Draft</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Correction Required">Correction Required</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Contact Coordinates */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-200 pb-1.5">
            <User className="w-3.5 h-3.5 text-slate-700" />
            <span>Contact & Address</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label-base">Contact Person *</label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                className={`input-base ${fieldErrors.contactPerson ? 'border-rose-500' : ''}`}
                required
              />
            </div>

            <div>
              <label className="label-base">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`input-base font-mono ${fieldErrors.email ? 'border-rose-500' : ''}`}
                required
              />
            </div>

            <div>
              <label className="label-base">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input-base font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="label-base">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="input-base"
              />
            </div>

            <div>
              <label className="label-base">City / State / PIN</label>
              <div className="grid grid-cols-3 gap-1">
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleChange}
                  className="input-base px-1.5"
                />
                <input
                  type="text"
                  name="state"
                  placeholder="State"
                  value={formData.state}
                  onChange={handleChange}
                  className="input-base px-1.5"
                />
                <input
                  type="text"
                  name="pincode"
                  placeholder="PIN"
                  value={formData.pincode}
                  onChange={handleChange}
                  className="input-base px-1.5 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Banking Settlement */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-200 pb-1.5">
            <Landmark className="w-3.5 h-3.5 text-slate-700" />
            <span>Banking Details</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label-base">Bank Name</label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                className="input-base"
              />
            </div>

            <div>
              <label className="label-base">Account Number</label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                className="input-base font-mono"
              />
            </div>

            <div>
              <label className="label-base">IFSC Code</label>
              <input
                type="text"
                name="ifscCode"
                value={formData.ifscCode}
                onChange={handleChange}
                className="input-base font-mono uppercase"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn-secondary text-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary text-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{loading ? 'Saving Changes...' : 'Save Updated Information'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
