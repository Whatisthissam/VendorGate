import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Vendor } from '../types';
import { useToast } from '../context/ToastContext';
import {
  calculatePOAmount,
  determineApprovalLevel,
  getApprovalLevelDescription,
} from '../utils/approvalRules';
import { formatCurrency } from '../utils/formatters';
import {
  FileText,
  Building2,
  Calendar,
  Layers,
  ArrowLeft,
  Send,
  Save,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export const CreatePOPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { success, error } = useToast();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [vendorId, setVendorId] = useState(searchParams.get('vendorId') || '');
  const [productService, setProductService] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState<number | string>(1000);
  const [unitPrice, setUnitPrice] = useState<number | string>(500);
  const [requiredDate, setRequiredDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');

  // Real-time calculation
  const totalAmount = calculatePOAmount(Number(quantity) || 0, Number(unitPrice) || 0);
  const calculatedLevel = determineApprovalLevel(totalAmount);

  useEffect(() => {
    async function fetchVendors() {
      try {
        const res = await api.getVendors();
        if (res.success && res.data) {
          setVendors(res.data);
          if (!vendorId && res.data.length > 0) {
            setVendorId(res.data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load vendors for PO creation:', err);
      }
    }
    fetchVendors();
  }, []);

  // Quick Preset Helper for the College Presentation Demo!
  const applyDemoPreset = (presetType: string) => {
    // Pick vendor if available
    if (vendors.length > 0 && !vendorId) {
      setVendorId(vendors[0].id);
    }

    const randomPharmaProducts = [
      { name: 'Surgical Gauze Swabs 10x10cm (Sterile)', desc: '100% sterile cotton absorbent surgical swabs', qty: 1000, price: 35, notes: 'Routine surgical consumable replenishment.' },
      { name: 'Bulk Paracetamol IP Powder (Drums)', desc: 'Active pharmaceutical ingredient API drum packing', qty: 100, price: 1500, notes: 'Raw material batch for oral solid dosage production.' },
      { name: 'Ceftriaxone Sodium 1g Injection Vials', desc: 'USP sterile dry powder vials for injection with WFI', qty: 10000, price: 75, notes: 'Critical hospital supply emergency inventory lot.' },
      { name: 'Rotavirus & Polio Oral Vaccine Consignment', desc: 'WHO-prequalified cold-chain 2°C - 8°C biological shipment', qty: 1000, price: 1500, notes: 'Cold-chain audited shipment under executive signoff.' },
    ];

    switch (presetType) {
      case 'random': {
        const item = randomPharmaProducts[Math.floor(Math.random() * randomPharmaProducts.length)];
        if (vendors.length > 0) {
          const randomVendor = vendors[Math.floor(Math.random() * vendors.length)];
          setVendorId(randomVendor.id);
        }
        setProductService(item.name);
        setDescription(item.desc);
        setQuantity(item.qty);
        setUnitPrice(item.price);
        setNotes(item.notes);
        success('Auto-Filled PO', `Loaded: ${item.name} (₹${(item.qty * item.price).toLocaleString('en-IN')})`);
        break;
      }
      case 'level1':
        setProductService('Surgical Gauze Swabs 10x10cm (Sterile)');
        setDescription('100% sterile cotton absorbent surgical swabs');
        setQuantity(1000);
        setUnitPrice(35); // ₹35,000 -> Level 1 (<= ₹50,000)
        setNotes('Tier 1 Purchase: ₹35,000 for Level 1 Amit Patel authorization.');
        success('Loaded Level 1 PO', 'Amount: ₹35,000 (Requires Level 1 Approval)');
        break;
      case 'level2':
        setProductService('Bulk Paracetamol IP Powder (Drums)');
        setDescription('Active pharmaceutical ingredient API drum packing');
        setQuantity(100);
        setUnitPrice(1500); // ₹1,50,000 -> Level 2 (₹50k - ₹200k)
        setNotes('Tier 2 Purchase: ₹1,50,000 for Level 2 Vikram Malhotra authorization.');
        success('Loaded Level 2 PO', 'Amount: ₹1,50,000 (Requires Level 2 Approval)');
        break;
      case 'level3':
        setProductService('Ceftriaxone Sodium 1g Injection Vials');
        setDescription('USP sterile dry powder vials for injection with WFI');
        setQuantity(10000);
        setUnitPrice(75); // ₹7,50,000 -> Level 3 (₹200k - ₹1000k)
        setNotes('Tier 3 Purchase: ₹7,50,000 for Level 3 Deepak Singhania authorization.');
        success('Loaded Level 3 PO', 'Amount: ₹7,50,000 (Requires Level 3 Approval)');
        break;
      case 'level4':
        setProductService('Rotavirus & Polio Oral Vaccine Consignment');
        setDescription('WHO-prequalified cold-chain 2°C - 8°C biological shipment');
        setQuantity(1000);
        setUnitPrice(1500); // ₹15,00,000 -> Level 4 (> ₹1000k)
        setNotes('Tier 4 Purchase: ₹15,00,000 for Level 4 Executive Ananya Deshmukh authorization.');
        success('Loaded Level 4 PO', 'Amount: ₹15,00,000 (Requires Level 4 Approval)');
        break;
      case 'boundary-50k-1':
        // ₹50,001 -> Level 2 (+₹1 above Level 1 ceiling)
        setProductService('Paracetamol IP Micro-fine Powder (Drum)');
        setDescription('Bulk pharmaceutical API ingredient drum packaging');
        setQuantity(100.002);
        setUnitPrice(500);
        setNotes('Boundary test: ₹50,001 strictly routes to Level 2.');
        success('Loaded Boundary PO', 'Amount: ₹50,001 (+₹1 above L1 ceiling → Level 2)');
        break;
      case 'boundary-200k-1':
        // ₹2,00,001 -> Level 3 (+₹1 above Level 2 ceiling)
        setProductService('Ceftriaxone 1g Injectable Vials');
        setDescription('USP broad spectrum antibiotic injection vials');
        setQuantity(2857.157);
        setUnitPrice(70);
        setNotes('Boundary test: ₹2,00,001 strictly routes to Level 3.');
        success('Loaded Boundary PO', 'Amount: ₹2,00,001 (+₹1 above L2 ceiling → Level 3)');
        break;
      case 'boundary-1000k-1':
        // ₹10,00,001 -> Level 4 Executive (+₹1 above Level 3 ceiling)
        setProductService('Size 00 Gelatin Capsules Bulk Lot');
        setDescription('Controlled warehouse delivery of bulk capsule shells');
        setQuantity(10000.01);
        setUnitPrice(100);
        setNotes('Boundary test: ₹10,00,001 strictly routes to Executive Level 4.');
        success('Loaded Boundary PO', 'Amount: ₹10,00,001 (+₹1 above L3 ceiling → Level 4)');
        break;
    }
  };

  const handleSubmit = async (isDraft: boolean) => {
    if (!vendorId) {
      error('Validation Error', 'Please select a vendor.');
      return;
    }
    if (!productService.trim()) {
      error('Validation Error', 'Product/Service name is required.');
      return;
    }
    if (totalAmount <= 0) {
      error('Invalid PO Amount', 'Quantity and Unit Price must result in an amount greater than ₹0.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.createPurchaseOrder({
        vendorId,
        productService,
        description,
        quantity: Number(quantity),
        unitPrice: Number(unitPrice),
        requiredDate,
        notes,
        isDraft,
      });

      if (res.success && res.data) {
        success(
          isDraft ? 'PO Draft Saved' : 'PO Submitted for Authorization',
          `Created ${res.data.poNumber} for ${formatCurrency(totalAmount)}. Assigned to ${getApprovalLevelDescription(calculatedLevel)}.`
        );
        navigate(`/purchase-orders/${res.data.id}`);
      }
    } catch (err: any) {
      error('Creation Error', err.message || 'Purchase order could not be created.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/purchase-orders"
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Create Purchase Order & Calculate Authorization
            </h1>
            <p className="text-xs text-slate-500">
              System calculates total value and binds strict managerial approval tier
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
            <span>Submit Requisition</span>
          </button>
        </div>
      </div>

      {/* College Presentation Quick-Fill Bar */}
      <div className="card-base p-3.5 bg-slate-900 border border-slate-800 text-white flex flex-col space-y-2.5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2 text-xs">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-semibold text-white">Viva Fast-Fill Presets:</span>
            <span className="text-[11px] text-slate-400 font-normal">Click to populate valid PO details for immediate testing</span>
          </div>
          <button
            type="button"
            onClick={() => applyDemoPreset('random')}
            className="px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>🎲 Random Valid PO</span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Tier Presets:</span>
          <button
            type="button"
            onClick={() => applyDemoPreset('level1')}
            className="px-2.5 py-1 text-[11px] font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-sky-300 rounded border border-slate-700 transition-colors"
          >
            Level 1 (₹35k - Amit)
          </button>
          <button
            type="button"
            onClick={() => applyDemoPreset('level2')}
            className="px-2.5 py-1 text-[11px] font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded border border-slate-700 transition-colors"
          >
            Level 2 (₹1.5L - Vikram)
          </button>
          <button
            type="button"
            onClick={() => applyDemoPreset('level3')}
            className="px-2.5 py-1 text-[11px] font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 rounded border border-slate-700 transition-colors"
          >
            Level 3 (₹7.5L - Deepak)
          </button>
          <button
            type="button"
            onClick={() => applyDemoPreset('level4')}
            className="px-2.5 py-1 text-[11px] font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-purple-300 rounded border border-slate-700 transition-colors"
          >
            Level 4 (₹15L - Ananya)
          </button>

          <span className="text-slate-600">|</span>

          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Ceiling Boundaries:</span>
          <button
            type="button"
            onClick={() => applyDemoPreset('boundary-50k-1')}
            className="px-2 py-0.5 text-[10px] font-mono bg-slate-850 hover:bg-slate-750 text-slate-300 rounded border border-slate-750 transition-colors"
          >
            ₹50,001 (L2)
          </button>
          <button
            type="button"
            onClick={() => applyDemoPreset('boundary-200k-1')}
            className="px-2 py-0.5 text-[10px] font-mono bg-slate-850 hover:bg-slate-750 text-slate-300 rounded border border-slate-750 transition-colors"
          >
            ₹2,00,001 (L3)
          </button>
          <button
            type="button"
            onClick={() => applyDemoPreset('boundary-1000k-1')}
            className="px-2 py-0.5 text-[10px] font-mono bg-slate-850 hover:bg-slate-750 text-slate-300 rounded border border-slate-750 transition-colors"
          >
            ₹10,00,001 (L4)
          </button>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="card-base p-6 space-y-6">
        {/* Section 1: Vendor Selection */}
        <div>
          <label className="label-base">Target Vendor Partner *</label>
          <div className="relative">
            <select
              value={vendorId}
              onChange={e => setVendorId(e.target.value)}
              className="input-base pr-8 font-medium"
              required
            >
              <option value="">-- Choose Approved Vendor --</option>
              {vendors.map(v => (
                <option key={v.id} value={v.id}>
                  {v.companyName} ({v.id}) — {v.category} [{v.status}]
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section 2: Requisition Item Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label-base">Product / Service Description *</label>
            <input
              type="text"
              value={productService}
              onChange={e => setProductService(e.target.value)}
              placeholder="e.g. Multi-Lumen Central Venous Catheter Kits"
              className="input-base"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="label-base">Detailed Technical Specification / Batch Requirements</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Packaging standards, certificate of analysis requirements, temperature controls..."
              className="input-base"
            />
          </div>

          {/* Quantity & Unit Price */}
          <div>
            <label className="label-base">Quantity (Units) *</label>
            <input
              type="number"
              step="any"
              min="1"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              className="input-base font-mono"
              required
            />
          </div>

          <div>
            <label className="label-base">Unit Price (₹ INR) *</label>
            <input
              type="number"
              step="any"
              min="0.01"
              value={unitPrice}
              onChange={e => setUnitPrice(e.target.value)}
              className="input-base font-mono"
              required
            />
          </div>
        </div>

        {/* LIVE REAL-TIME CALCULATION & APPROVAL ROUTING PANEL */}
        <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Automated Financial Calculation & Policy Gating</span>
            <span className="font-mono text-slate-400">Total = Qty × Unit Price</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <span className="text-xs text-slate-500 font-medium">Calculated Total Value</span>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {formatCurrency(totalAmount)}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                {quantity} units @ ₹{unitPrice} each
              </p>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <span className="text-xs text-slate-500 font-medium">
                Mandatory Approval Routing Tier
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-bold font-mono text-indigo-700">
                  Level {calculatedLevel} Approval
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
                {getApprovalLevelDescription(calculatedLevel)}
              </p>
            </div>
          </div>

          {/* Real-time Business Rule Explanation */}
          <div className="text-xs text-slate-600 bg-white p-2.5 rounded border border-slate-200/80 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800">Organizational Rule Enforced:</span>
              <span className="ml-1">
                {calculatedLevel === 1 && 'Amounts up to ₹50,000 require Level 1 managerial approval.'}
                {calculatedLevel === 2 && 'Amounts between ₹50,001 and ₹2,00,000 require Level 2 approval.'}
                {calculatedLevel === 3 && 'Amounts between ₹2,00,001 and ₹10,00,000 require Level 3 VP approval.'}
                {calculatedLevel === 4 && 'Amounts exceeding ₹10,00,000 require Executive CFO (Level 4) sign-off.'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Delivery Terms & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label-base">Required Delivery Date</label>
            <input
              type="date"
              value={requiredDate}
              onChange={e => setRequiredDate(e.target.value)}
              className="input-base font-mono"
            />
          </div>

          <div>
            <label className="label-base">Special Logistics / Quality Instructions</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Standard cold-chain transit 2-8°C with data logger"
              className="input-base"
            />
          </div>
        </div>

        {/* Footer Submit */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Link to="/purchase-orders" className="btn-secondary text-xs">
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
            <span>Submit Requisition for Level {calculatedLevel} Approval</span>
          </button>
        </div>
      </div>
    </div>
  );
};
