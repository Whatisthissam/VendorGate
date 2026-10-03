import React from 'react';
import { ProjectTask } from '../../types';
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

interface GanttChartProps {
  tasks: ProjectTask[];
  totalDays: number;
}

export const GanttChart: React.FC<GanttChartProps> = ({ tasks, totalDays }) => {
  // Day markers along the top axis
  const dayIntervals = [1, 10, 20, 30, 40, 50, 59];

  return (
    <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm">
      <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>Project Critical Path Method (CPM) Timeline</span>
            <span className="text-xs font-mono font-normal px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded">
              Critical Path = 59 Working Days
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Requirements → Approval Policy → PO Module → Vendor Ack → Testing → Onboarding Drive
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-rose-700" />
            <span className="font-semibold text-slate-700">Critical Path Task</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-slate-400" />
            <span className="text-slate-600">Non-Critical (Has Float)</span>
          </div>
        </div>
      </div>

      <div className="p-4 overflow-x-auto">
        <div className="min-w-[720px]">
          {/* Day Scale Header */}
          <div className="flex border-b border-slate-200 pb-2 mb-3 text-[11px] font-mono text-slate-500">
            <div className="w-64 shrink-0 font-sans font-semibold text-slate-700">
              Task & Deliverable
            </div>
            <div className="flex-1 relative h-5">
              {dayIntervals.map(day => (
                <div
                  key={day}
                  className="absolute text-center -translate-x-1/2"
                  style={{ left: `${((day - 1) / totalDays) * 100}%` }}
                >
                  Day {day}
                </div>
              ))}
            </div>
          </div>

          {/* Task Timeline Bars */}
          <div className="space-y-3.5">
            {tasks.map(task => {
              const leftPercent = ((task.startDay - 1) / totalDays) * 100;
              const widthPercent = (task.durationDays / totalDays) * 100;

              return (
                <div key={task.id} className="flex items-center text-xs group">
                  {/* Task details column */}
                  <div className="w-64 shrink-0 pr-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] font-semibold text-slate-500">
                        {task.id}
                      </span>
                      <span className={`font-semibold truncate ${task.isCritical ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>
                        {task.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                      <span>{task.durationDays} days</span>
                      <span>•</span>
                      <span className="truncate">{task.owner}</span>
                    </div>
                  </div>

                  {/* Gantt Bar Area */}
                  <div className="flex-1 relative h-7 bg-slate-50 rounded border border-slate-100 flex items-center">
                    {/* Day grid guide lines */}
                    {dayIntervals.map(day => (
                      <div
                        key={day}
                        className="absolute top-0 bottom-0 border-l border-slate-200/50"
                        style={{ left: `${((day - 1) / totalDays) * 100}%` }}
                      />
                    ))}

                    {/* Bar */}
                    <div
                      className={`absolute h-5 rounded px-2 flex items-center justify-between text-[11px] text-white font-mono font-medium shadow-sm transition-all group-hover:brightness-110 ${
                        task.isCritical
                          ? 'bg-rose-700 border border-rose-800'
                          : 'bg-slate-500 border border-slate-600'
                      }`}
                      style={{
                        left: `${leftPercent}%`,
                        width: `${Math.max(widthPercent, 5)}%`,
                      }}
                      title={`${task.name}: Days ${task.startDay} - ${task.endDay} (${task.durationDays} days)${task.slackDays ? ` [Slack: ${task.slackDays} days]` : ''}`}
                    >
                      <span className="truncate">{task.durationDays}d</span>
                      {task.isCritical ? (
                        <span className="hidden sm:inline text-[9px] uppercase tracking-wider bg-rose-900/60 px-1 rounded">
                          CP
                        </span>
                      ) : (
                        <span className="hidden sm:inline text-[9px] uppercase tracking-wider bg-slate-700/60 px-1 rounded">
                          Float
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dependency Legend */}
          <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">Sequence Logic:</span>
            <span>T2 & T3 start after T1 (Day 8)</span>
            <span>•</span>
            <span>T4 starts after T2 (Day 14)</span>
            <span>•</span>
            <span>T5 starts after T4 (Day 30)</span>
            <span>•</span>
            <span>T6 depends on Max(T3=22, T5=36) → Starts Day 37</span>
            <span>•</span>
            <span>T7 completes on Day 59</span>
          </div>
        </div>
      </div>
    </div>
  );
};
