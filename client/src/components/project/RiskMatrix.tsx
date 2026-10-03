import React from 'react';
import { RiskItem } from '../../types';
import { AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';

interface RiskMatrixProps {
  risks: RiskItem[];
}

export const RiskMatrix: React.FC<RiskMatrixProps> = ({ risks }) => {
  return (
    <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm">
      <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span>Project Risk Register & Exposure Analysis</span>
          <span className="text-xs font-mono font-normal text-slate-500">
            (Exposure = Probability × Impact)
          </span>
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Proactive risk treatment strategies addressing regulatory, operational, and organizational bottlenecks
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-4">Risk ID</th>
              <th className="py-2.5 px-4">Identified Risk</th>
              <th className="py-2.5 px-4 text-center">Probability (P)</th>
              <th className="py-2.5 px-4 text-center">Impact (I)</th>
              <th className="py-2.5 px-4 text-center">Risk Exposure (P×I)</th>
              <th className="py-2.5 px-4">Mitigation Strategy</th>
              <th className="py-2.5 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {risks.map(risk => {
              // High exposure indicator
              const isHigh = risk.exposure >= 3.0;

              return (
                <tr key={risk.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-600">
                    {risk.id}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900">
                    {risk.title}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-700">
                    {risk.probability}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-700">
                    {risk.impact} / 10
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded font-mono font-bold ${
                        isHigh
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {risk.exposure.toFixed(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-sm">
                    {risk.mitigation}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      {risk.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
