import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { SlidersHorizontal, CheckCircle, AlertCircle } from 'lucide-react';
import { BaselineComparison } from '../types';

interface BaselineComparisonChartProps {
  baselineSummary: BaselineComparison[];
  selectedTrackId: string | null;
}

export const BaselineComparisonChart: React.FC<BaselineComparisonChartProps> = ({
  baselineSummary,
  selectedTrackId
}) => {
  const activeRecord = baselineSummary.find(b => b.track_id === selectedTrackId) || baselineSummary[0];

  if (!activeRecord) {
    return (
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl text-center font-mono text-xs text-slate-500">
        No baseline comparison records available. Run surveillance video analysis to generate baseline metrics.
      </div>
    );
  }

  // Bar chart comparing expected vs observed
  const chartData = [
    {
      metric: 'Speed (km/h)',
      Expected: activeRecord.expected_mean_speed,
      Observed: activeRecord.observed_speed
    },
    {
      metric: 'Dwell (s)',
      Expected: activeRecord.max_normal_dwell,
      Observed: activeRecord.observed_dwell
    }
  ];

  return (
    <div className="flex flex-col bg-[#0b1326] border border-slate-800 rounded-xl p-4 shadow-xl font-mono text-xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-white uppercase tracking-wider">
            Expected vs Observed Baseline // {activeRecord.track_id}
          </h3>
        </div>
        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
          activeRecord.deviation_level === 'HIGH' 
            ? 'bg-red-950 text-red-300 border border-red-800' 
            : activeRecord.deviation_level === 'MEDIUM'
            ? 'bg-amber-950 text-amber-300 border border-amber-800'
            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
        }`}>
          DEVIATION: {activeRecord.deviation_level}
        </span>
      </div>

      {/* Comparison Metrics Chart */}
      <div className="h-44 w-full bg-slate-950/60 rounded-lg p-2 border border-slate-800/80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
            <XAxis dataKey="metric" stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#06b6d4', fontSize: '11px' }}
              itemStyle={{ color: '#e2e8f0' }}
            />
            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
            <Bar dataKey="Expected" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Observed" fill="#f43f5e" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Deviation Reasons */}
      <div className="p-2.5 bg-slate-950/80 rounded border border-slate-800 text-[11px] text-slate-300 space-y-1">
        <div className="text-[10px] text-slate-500 uppercase font-semibold">Deviation Explanations:</div>
        {activeRecord.deviation_reasons.length > 0 ? (
          <ul className="list-disc list-inside space-y-0.5 text-slate-300">
            {activeRecord.deviation_reasons.map((r, idx) => (
              <li key={idx}>{r}</li>
            ))}
          </ul>
        ) : (
          <div className="text-emerald-400 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Parameters strictly conform to local zone baseline expectations.</span>
          </div>
        )}
      </div>
    </div>
  );
};
