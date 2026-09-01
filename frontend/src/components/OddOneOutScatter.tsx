import React from 'react';
import { 
  Users, 
  AlertTriangle, 
  Target, 
  TrendingUp, 
  ShieldCheck 
} from 'lucide-react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { OddOneOutResult } from '../types';

interface OddOneOutScatterProps {
  oddOneOut: OddOneOutResult | null;
  selectedTrackId: string | null;
  onSelectTrack: (trackId: string) => void;
}

export const OddOneOutScatter: React.FC<OddOneOutScatterProps> = ({
  oddOneOut,
  selectedTrackId,
  onSelectTrack
}) => {
  if (!oddOneOut || oddOneOut.total_entities === 0) {
    return (
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl text-center font-mono text-xs text-slate-500">
        Run video processing to compute population-level anomaly distributions and odd-one-out ranking.
      </div>
    );
  }

  const { total_entities, normal_count, moderate_count, significant_outlier_count, ranked_entities, primary_outlier } = oddOneOut;

  // Chart data: X = index/rank, Y = Anomaly Score (0-1), Z = Z-Score
  const scatterData = ranked_entities.map((item, idx) => ({
    x: idx + 1,
    y: item.score,
    z: item.z_score,
    track_id: item.track_id,
    zone: item.zone,
    classification: item.classification
  }));

  return (
    <div className="flex flex-col bg-[#0b1326] border border-slate-800 rounded-xl p-4 shadow-xl font-mono text-xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-white uppercase tracking-wider">
            Odd-One-Out Population Intelligence
          </h3>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
            {normal_count} Baseline
          </span>
          <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
            {moderate_count} Moderate
          </span>
          <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 font-bold">
            {significant_outlier_count} Outlier
          </span>
        </div>
      </div>

      {/* Primary Outlier Highlight Card */}
      {primary_outlier ? (
        <div className="p-3 bg-red-950/40 border border-red-500/60 rounded-lg flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-red-200">
                Primary Outlier: Entity {primary_outlier.track_id}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-900 text-red-100 font-bold">
                SCORE: {primary_outlier.score.toFixed(2)} (+{primary_outlier.z_score}σ)
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
              {primary_outlier.explanation}
            </p>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-emerald-950/30 border border-emerald-600/40 rounded-lg flex items-center gap-2 text-emerald-300">
          <ShieldCheck className="w-4 h-4" />
          <span>All {total_entities} entities currently conform within normal baseline bounds.</span>
        </div>
      )}

      {/* Population Distribution Scatter Chart */}
      <div className="h-44 w-full bg-slate-950/60 rounded-lg p-2 border border-slate-800/80">
        <div className="text-[10px] text-slate-400 mb-1 flex justify-between">
          <span>POPULATION ANOMALY DISTRIBUTION (ANOMALY SCORE vs RANK)</span>
          <span className="text-cyan-400">Click node to inspect</span>
        </div>
        <ResponsiveContainer width="100%" height="88%">
          <ScatterChart margin={{ top: 10, right: 10, bottom: 5, left: -20 }}>
            <XAxis 
              type="number" 
              dataKey="x" 
              name="Rank" 
              stroke="#64748b" 
              tick={{ fontSize: 10, fill: '#94a3b8' }} 
              domain={[0, Math.max(10, scatterData.length + 1)]}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="Anomaly Score" 
              stroke="#64748b" 
              tick={{ fontSize: 10, fill: '#94a3b8' }} 
              domain={[0, 1.0]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900 p-2 rounded border border-cyan-500 font-mono text-[11px] shadow-xl">
                      <div className="font-bold text-white">{data.track_id} ({data.zone})</div>
                      <div className="text-cyan-400">Score: {data.y} (Z: +{data.z}σ)</div>
                      <div className="text-slate-400">{data.classification}</div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter 
              data={scatterData} 
              onClick={(node: any) => onSelectTrack(node?.track_id || node?.payload?.track_id || '')}
              cursor="pointer"
            >
              {scatterData.map((entry, index) => {
                let color = '#10b981'; // Green conformant
                if (entry.classification === 'SIGNIFICANT_OUTLIER') color = '#ef4444';
                else if (entry.classification === 'MODERATE_DEVIATION') color = '#f59e0b';
                if (entry.track_id === selectedTrackId) color = '#06b6d4';
                return <Cell key={`cell-${index}`} fill={color} />;
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
