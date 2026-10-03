import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  Building2,
  FileCheck2,
  User,
  CreditCard,
  Landmark,
  ArrowLeft,
  CheckCircle2,
  Save,
  Send,
  FileUp,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const VendorRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Form State across 5 sections
  const [formData, setFormData] = useState({
    // Section 1: Company Information
    companyName: '',
    category: 'Pharmaceutical Formulations',
    address: '',
    city: '',
    state: '',
    pincode: '',

    // Section 2: Contact Information
    contactPerson: '',
    email: '',
    phone: '',

    // Section 3: Tax Information
    gstNumber: '',
    panNumber: '',

    // Section 4: Bank Information
    bankName: '',
    accountNumber: '',
    ifscCode: '',

    // Additional
    notes: '',
  });

  const categories = [
    'Pharmaceutical Formulations',
    'Active Pharmaceutical Ingredients (API)',
    'Biologics & Vaccines',
    'Surgical & Infusion Supplies',
    'Packaging Materials',
    'Diagnostic Kits & Reagents',
    'Cold Chain Equipment & Gases',
    'Cleanroom & PPE Supplies',
  ];

  const requiredDocuments = [
    { id: 'gst_certificate', name: 'GST Certificate (Form GST REG-06)' },
    { id: 'pan_card', name: 'Corporate PAN Card Copy' },
    { id: 'company_reg', name: 'Certificate of Incorporation / MCA Deed' },
    { id: 'bank_certificate', name: 'Bank Verification Letter & Cancelled Cheque' },
    { id: 'drug_license', name: 'Wholesale Drug Sales License (Form 20B/21B)' },
    { id: 'address_proof', name: 'Registered Business Premises Proof' },
    { id: 'msme_certificate', name: 'MSME / Udyam Enterprise Certificate' },
    { id: 'trade_license', name: 'Municipal Operating Trade License' },
    { id: 'quality_certificate', name: 'Quality GMP / WHO-GMP / ISO 9001:2015 Cert' },
    { id: 'tax_registration', name: 'Latest Income Tax Clearance Acknowledgement' },
    { id: 'auth_signatory', name: 'Authorized Signatory Proof / Board Resolution' },
  ];

  const DEMO_VENDORS = [
    {
      companyName: 'Zenith Lifesciences Pvt Ltd',
      category: 'Pharmaceutical Formulations',
      address: 'Plot 42, MIDC Industrial Area, Andheri East',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400093',
      contactPerson: 'Sanjay Deshpande',
      email: 'sanjay.d@zenithlife.in',
      phone: '+91 98200 55443',
      gstNumber: '27AAACZ1234K1Z2',
      panNumber: 'AAACZ1234K',
      bankName: 'HDFC Bank Ltd',
      accountNumber: '50200012345678',
      ifscCode: 'HDFC0000042',
      notes: 'WHO-GMP certified oral dosage & sterile injectable formulations supplier.',
    },
    {
      companyName: 'BioShield Vaccines & Serums LLP',
      category: 'Biologics & Vaccines',
      address: 'Genome Valley, Phase II, Turkapally',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500078',
      contactPerson: 'Dr. Radhika Reddy',
      email: 'r.reddy@bioshield.co.in',
      phone: '+91 94401 22889',
      gstNumber: '36AAACB9876M1Z5',
      panNumber: 'AAACB9876M',
      bankName: 'State Bank of India',
      accountNumber: '381920045612',
      ifscCode: 'SBIN0004051',
      notes: 'Cold-chain validated vaccine & biologic formulations distributor.',
    },
    {
      companyName: 'Torrent API Ingredients India',
      category: 'Active Pharmaceutical Ingredients (API)',
      address: 'GIDC Estate, Phase IV, Vatva',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '382445',
      contactPerson: 'Manish Trivedi',
      email: 'm.trivedi@torrentapi.com',
      phone: '+91 98251 77660',
      gstNumber: '24AAACT5566R1Z9',
      panNumber: 'AAACT5566R',
      bankName: 'ICICI Bank Ltd',
      accountNumber: '002405018923',
      ifscCode: 'ICIC0000024',
      notes: 'DMF-filed USP/IP grade Paracetamol, Metformin & Amoxicillin active raw materials.',
    },
    {
      companyName: 'MedSurge Surgical Devices Ltd',
      category: 'Surgical & Infusion Supplies',
      address: 'Electronic City, Phase 1, Hosur Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560100',
      contactPerson: 'Karthik Ramanathan',
      email: 'karthik@medsurgedevices.in',
      phone: '+91 98450 33411',
      gstNumber: '29AAACM4433D1Z1',
      panNumber: 'AAACM4433D',
      bankName: 'Axis Bank',
      accountNumber: '91402005432198',
      ifscCode: 'UTIB0000142',
      notes: 'ISO 13485 compliant sterile IV infusion sets, syringes and surgical consumables.',
    },
    {
      companyName: 'TheraPack Cleanroom Packaging',
      category: 'Packaging Materials',
      address: 'Bhosari Industrial Estate, Pimpri-Chinchwad',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411026',
      contactPerson: 'Anjali Kulkarni',
      email: 'a.kulkarni@therapack.in',
      phone: '+91 98901 88722',
      gstNumber: '27AAACT9988P1Z3',
      panNumber: 'AAACT9988P',
      bankName: 'Kotak Mahindra Bank',
      accountNumber: '881200349812',
      ifscCode: 'KKBK0000671',
      notes: 'Medical grade Alu-Alu blister foil, USP Type 1 glass vials and rubber stoppers.',
    },
  ];

  const handleAutoFill = (type: 'valid' | 'incomplete') => {
    if (type === 'valid') {
      const randomVendor = DEMO_VENDORS[Math.floor(Math.random() * DEMO_VENDORS.length)];
      setFormData(randomVendor);
      setFieldErrors({});
      success('Auto-Filled Valid Vendor', `Populated ${randomVendor.companyName} with full compliance details.`);
    } else {
      // Incomplete for validation test
      setFormData({
        companyName: 'Incomplete Test Pharma Inc',
        category: 'Pharmaceutical Formulations',
        address: 'Sample Pharma Park, Block C',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        contactPerson: '', // Missing
        email: '', // Missing
        phone: '', // Missing
        gstNumber: '', // Missing
        panNumber: '',
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        notes: 'Incomplete registration demo to demonstrate validation feedback.',
      });
      setFieldErrors({});
      error('Incomplete Data Loaded', 'Missing Contact, Email, Phone, and GSTIN. Click Submit to verify rejection.');
    }
  };

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

  const handleSubmit = async (isDraft: boolean) => {
    const errorsMap: Record<string, string> = {};

    if (!formData.companyName.trim()) {
      errorsMap.companyName = 'Company Legal Name is required.';
    }

    if (!isDraft) {
      if (!formData.contactPerson.trim()) {
        errorsMap.contactPerson = 'Contact Person is required.';
      }
      if (!formData.email.trim()) {
        errorsMap.email = 'Email Address is required.';
      } else if (!formData.email.includes('@') || !formData.email.includes('.')) {
        errorsMap.email = 'Please provide a valid email format (e.g. name@domain.com).';
      }
      if (!formData.phone.trim()) {
        errorsMap.phone = 'Contact Phone Number is required.';
      }
      if (!formData.gstNumber.trim()) {
        errorsMap.gstNumber = 'GSTIN Number is required (Form REG-06).';
      }
    }

    if (Object.keys(errorsMap).length > 0) {
      setFieldErrors(errorsMap);
      error(
        isDraft ? 'Incomplete Draft' : 'Incomplete Registration Rejected',
        'Required vendor information is missing. Please fix highlighted fields.'
      );
      return;
    }

    setFieldErrors({});

    try {
      setLoading(true);
      const res = await api.createVendor({
        ...formData,
        isDraft,
      });

      if (res.success && res.data) {
        success(
          isDraft ? 'Draft Saved' : 'Vendor Registered',
          `Vendor '${res.data.companyName}' (${res.data.id}) registration status is: ${res.data.status}.`
        );
        navigate(`/vendors/${res.data.id}`);
      }
    } catch (err: any) {
      error('Registration Failed', err.message || 'Vendor could not be created.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/vendors"
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Vendor Onboarding & Compliance Registration
            </h1>
            <p className="text-xs text-slate-500">
              Multi-section qualification form for pharmaceutical suppliers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={loading}
            className="btn-secondary text-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={loading}
            className="btn-primary text-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Registration</span>
          </button>
        </div>
      </div>

      {/* Viva / Evaluation Demo Quick Fill Toolbar */}
      <div className="card-base p-3.5 bg-slate-900 border border-slate-800 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2.5 text-xs">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-white">Viva Demo Fast-Fill:</span>
            <p className="text-[11px] text-slate-400">1-Click auto-populate valid or incomplete data to save time during viva</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleAutoFill('valid')}
            className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>🎲 Auto-Fill Valid Vendor</span>
          </button>
          <button
            type="button"
            onClick={() => handleAutoFill('incomplete')}
            className="px-3 py-1.5 text-xs font-semibold bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>⚠️ Fill Incomplete (Test Validation)</span>
          </button>
        </div>
      </div>

      {/* Validation Feedback Banner (FR-02) */}
      {Object.keys(fieldErrors).length > 0 && (
        <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-xl text-rose-900 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <span className="font-bold">Incomplete Vendor Registration Rejected:</span>
            <p className="text-rose-700 mt-0.5">
              Please enter the required information in the highlighted fields ({Object.values(fieldErrors).join(' • ')}) before submitting.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Section 1: Company Information */}
        <div className="card-base p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Building2 className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900">
              Section 1: Company Information
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-base">Company Legal Name *</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="e.g. Apex Biosolutions LLP"
                className={`input-base ${fieldErrors.companyName ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/20' : ''}`}
                required
              />
              {fieldErrors.companyName && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.companyName}</p>
              )}
            </div>

            <div>
              <label className="label-base">Supplier Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="input-base"
              >
                {categories.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="label-base">Registered Office Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Plot / Street / Industrial Area"
                className="input-base"
              />
            </div>

            <div>
              <label className="label-base">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. Mumbai"
                className="input-base"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label-base">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Maharashtra"
                  className="input-base"
                />
              </div>
              <div>
                <label className="label-base">PIN Code</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="400001"
                  className="input-base font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Contact Information */}
        <div className="card-base p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <User className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900">
              Section 2: Authorized Contact Person
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label-base">Contact Person Name *</label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                placeholder="e.g. Meera Rao"
                className={`input-base ${fieldErrors.contactPerson ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/20' : ''}`}
                required
              />
              {fieldErrors.contactPerson && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.contactPerson}</p>
              )}
            </div>

            <div>
              <label className="label-base">Official Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="m.rao@company.com"
                className={`input-base font-mono ${fieldErrors.email ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/20' : ''}`}
                required
              />
              {fieldErrors.email && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="label-base">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98450 12345"
                className={`input-base font-mono ${fieldErrors.phone ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/20' : ''}`}
              />
              {fieldErrors.phone && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.phone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Tax Information */}
        <div className="card-base p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <CreditCard className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900">
              Section 3: Statutory Tax Identification
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-base">GSTIN (Goods and Services Tax ID) *</label>
              <input
                type="text"
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleChange}
                placeholder="e.g. 27AABCA1234F1Z5"
                className={`input-base font-mono uppercase ${fieldErrors.gstNumber ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/20' : ''}`}
              />
              {fieldErrors.gstNumber ? (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.gstNumber}</p>
              ) : (
                <p className="text-[11px] text-slate-400 mt-1">15-digit alphanumeric GST identifier</p>
              )}
            </div>

            <div>
              <label className="label-base">PAN Number (Permanent Account Number)</label>
              <input
                type="text"
                name="panNumber"
                value={formData.panNumber}
                onChange={handleChange}
                placeholder="e.g. AABCA1234F"
                className="input-base font-mono uppercase"
              />
              <p className="text-[11px] text-slate-400 mt-1">10-digit entity PAN code</p>
            </div>
          </div>
        </div>

        {/* Section 4: Bank Information */}
        <div className="card-base p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Landmark className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900">
              Section 4: Bank Account & Settlement Details
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label-base">Bank Name</label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                placeholder="e.g. HDFC Bank Ltd"
                className="input-base"
              />
            </div>

            <div>
              <label className="label-base">Bank Account Number</label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                placeholder="50200012345678"
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
                placeholder="HDFC0000128"
                className="input-base font-mono uppercase"
              />
            </div>
          </div>
        </div>

        {/* Section 5: 11 Required Documents Preview */}
        <div className="card-base p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-bold text-slate-900">
                Section 5: Required Compliance Documents (11 Types)
              </h2>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              Pharma Regulatory Bundle
            </span>
          </div>

          <p className="text-xs text-slate-600">
            Upon submitting registration, all 11 document slots will be initiated for verification by the procurement quality team.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {requiredDocuments.map((doc, idx) => (
              <div
                key={doc.id}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-400 font-semibold w-4">
                    {idx + 1}.
                  </span>
                  <span className="font-medium text-slate-800">{doc.name}</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  Ready
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link to="/vendors" className="btn-secondary text-xs">
            Cancel
          </Link>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={loading}
            className="btn-secondary text-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={loading}
            className="btn-primary text-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Registration Dossier</span>
          </button>
        </div>
      </div>
    </div>
  );
};
