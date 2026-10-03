import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ProjectMetadata } from '../types';
import { GanttChart } from '../components/project/GanttChart';
import { RiskMatrix } from '../components/project/RiskMatrix';
import {
  KanbanSquare,
  Clock,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Activity,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';

export const ProjectOverviewPage: React.FC = () => {
  const { user } = useAuth();
  const [metadata, setMetadata] = useState<ProjectMetadata | null>(null);
  const [loading, setLoading] = useState(true);

  // Strictly restrict to ADMIN role
  if (user && user.role !== 'ADMIN') {
    return (
      <div className="card-base p-8 text-center max-w-lg mx-auto space-y-4 my-12">
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mx-auto border border-amber-200">
          <KanbanSquare className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Admin Section Restricted</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          The 59-Day CPM Project Management Overview and Academic SE Risk Register is restricted to the <strong>Administrator</strong> workspace.
        </p>
        <div className="pt-2">
          <Link to="/dashboard" className="btn-primary text-xs">
            Return to {user.role} Dashboard
          </Link>
        </div>
      </div>
    );
  }

  useEffect(() => {
    async function loadMetadata() {
      try {
        setLoading(true);
        const res = await api.getProjectOverview();
        if (res.success && res.data) {
          setMetadata(res.data);
        }
      } catch (err) {
        console.error('Failed to load project metadata:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMetadata();
  }, []);

  if (loading || !metadata) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-mono">Loading academic project management dossier...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Software Engineering & Project Management Dossier
            </h1>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-slate-900 text-white rounded">
              Academic Showcase
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            59-Day Critical Path Schedule, Risk Exposure Treatment, and Architectural Delivery Summary
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right text-xs">
            <span className="font-mono font-bold text-slate-900 text-sm">59 Working Days</span>
            <span className="block text-[11px] text-slate-500">Critical Path Duration</span>
          </div>
        </div>
      </div>

      {/* Project Brief Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-base p-4 space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Project Scope
          </span>
          <h3 className="text-sm font-bold text-slate-900">{metadata.projectTitle}</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {metadata.subtitle}. Enterprise portal serving a network of approximately 850 registered pharmaceutical suppliers.
          </p>
        </div>

        <div className="card-base p-4 space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Critical Path Method (CPM)
          </span>
          <h3 className="text-sm font-bold text-slate-900 font-mono">59 Working Days</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Zero float on Requirements, Approval Policy, PO Engine, Vendor Ack, Testing, and Onboarding Drive. Vendor Registration has 14 days total float.
          </p>
        </div>

        <div className="card-base p-4 space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Primary Governance Invariant
          </span>
          <h3 className="text-sm font-bold text-emerald-800">0 Bypass PO Approvals</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Elimination of 34 legacy manual approval bypasses by enforcing deterministic algorithmic boundaries on both client UI and server API layers.
          </p>
        </div>
      </div>

      {/* Critical Path Flowchart */}
      <div className="card-base p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-rose-700" />
            <span>Critical Path Method (CPM) Network Flow</span>
          </h2>
          <span className="text-xs font-mono font-semibold text-rose-700">
            Duration: 8 + 6 + 16 + 6 + 8 + 15 = 59 Days
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto py-3">
          {metadata.criticalPath.map((item, idx) => (
            <React.Fragment key={item.id}>
              <div className="p-3 rounded-lg bg-slate-900 text-white border border-slate-800 shrink-0 text-center min-w-[140px] shadow-sm">
                <span className="text-[10px] font-mono text-amber-400 block font-semibold">
                  {item.id} • {item.duration} Days
                </span>
                <span className="text-xs font-semibold text-white block mt-0.5">
                  {item.name}
                </span>
                <span className="text-[9px] uppercase tracking-wider font-mono text-rose-300 font-bold block mt-1">
                  [Critical Path]
                </span>
              </div>
              {idx < metadata.criticalPath.length - 1 && (
                <span className="text-slate-400 font-bold shrink-0 font-mono text-sm">
                  →
                </span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Gantt Timeline Chart */}
      <GanttChart tasks={metadata.tasks} totalDays={metadata.totalWorkingDays} />

      {/* Risk Register Table */}
      <RiskMatrix risks={metadata.riskRegister} />

      {/* Problem Statement & Legacy Audit Findings */}
      <div className="card-base p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h2 className="text-sm font-bold text-slate-900">
            Empirical Problem Statement & Motivation
          </h2>
          <span className="text-xs font-mono text-slate-500">Case Study Synthesis</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {metadata.problemStatement.map((prob, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-start gap-2.5 text-slate-700"
            >
              <span className="font-mono font-bold text-rose-700 shrink-0">0{idx + 1}.</span>
              <p className="leading-relaxed">{prob}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
