import React from 'react';
import { 
  Bird, 
  Radio, 
  Flame, 
  Globe, 
  AlertTriangle, 
  CheckCircle2, 
  Compass, 
  Activity,
  Zap,
  HelpCircle
} from 'lucide-react';
import { AerialTelemetry } from '../types';

interface AerialEcologicalMatrixProps {
  aerialData: AerialTelemetry | null;
  trackId: string;
}

export const AerialEcologicalMatrix: React.FC<AerialEcologicalMatrixProps> = ({
  aerialData,
  trackId
}) => {
  if (!aerialData) {
    return (
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl text-center font-mono text-xs text-slate-500">
        No aerial telemetry available for terrestrial track {trackId}. Select an aerial object (B01, B04, D02) to evaluate bird vs drone intelligence.
      </div>
    );
  }

  const { kinematics, thermal, ecology, contradiction } = aerialData;

  return (
    <div className="flex flex-col bg-[#0b1326] border border-cyan-900/50 rounded-xl p-4 shadow-xl font-mono text-xs space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Bird className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-white uppercase tracking-wider">
            Aerial & Ecological Intelligence // {trackId}
          </h3>
        </div>
        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
          contradiction.has_contradiction 
            ? 'bg-rose-950 text-rose-300 border border-rose-600 animate-pulse' 
            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
        }`}>
          {contradiction.final_assessment}
        </span>
      </div>

      {/* Contradiction / Ambiguity Banner if present */}
      {contradiction.has_contradiction && (
        <div className="p-3 bg-rose-950/40 border border-rose-500/60 rounded-lg space-y-1.5">
          <div className="flex items-center gap-2 text-rose-300 font-bold">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>SENSOR CONTRADICTION & AMBIGUITY ALERT</span>
          </div>
          <p className="text-[11px] text-rose-200 leading-relaxed">
            {contradiction.recommendation}
          </p>
          <div className="pt-1 text-[10px] text-rose-300/80 space-y-0.5 border-t border-rose-900/50">
            {contradiction.conflicts.map((c, i) => (
              <div key={i}>• {c.details}</div>
            ))}
          </div>
        </div>
      )}

      {/* 3-Column Intelligence Matrix: Kinematics, Thermal, Ecology */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 1. Kinematics Panel */}
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-cyan-400 font-bold text-[11px]">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              FLIGHT KINEMATICS
            </span>
            <span className="text-[9px] text-slate-500">{(kinematics.confidence * 100).toFixed(0)}% CONF</span>
          </div>
          <div className="space-y-1 text-slate-300">
            <div>Pattern: <strong className="text-white">{kinematics.flight_pattern}</strong></div>
            <div>Linearity Score: <strong className="text-cyan-300">{kinematics.path_linearity_score}</strong></div>
            <div>Flapping Oscillation: <strong className={kinematics.flapping_oscillation_detected ? "text-emerald-400" : "text-rose-400"}>{kinematics.flapping_oscillation_detected ? "YES" : "NO"}</strong></div>
          </div>
        </div>

        {/* 2. Thermal Telemetry Panel (Tagged Simulated) */}
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-amber-400 font-bold text-[11px]">
            <span className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5" />
              THERMAL IR <span className="text-[8px] px-1 rounded bg-amber-950 border border-amber-800 text-amber-300">SIMULATED</span>
            </span>
          </div>
          <div className="space-y-1 text-slate-300">
            <div>Peak Core: <strong className="text-amber-300">{thermal.peak_temperature_c}°C</strong> (ΔT: +{thermal.delta_t_c}°C)</div>
            <div>Type: <strong className="text-white">{thermal.thermal_type}</strong></div>
            <div className="text-[10px] text-slate-400 truncate">{thermal.thermal_summary}</div>
          </div>
        </div>

        {/* 3. Ecological & Seasonal Panel */}
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-purple-400 font-bold text-[11px]">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              ECOLOGICAL CONTEXT
            </span>
            <span className="text-[9px] text-slate-500">{(ecology.ecological_consistency_score * 100).toFixed(0)}% MATCH</span>
          </div>
          <div className="space-y-1 text-slate-300">
            <div className="truncate">Species: <strong className="text-white">{ecology.species_identified}</strong></div>
            <div>Verdict: <strong className={ecology.verdict === "ECOLOGICALLY_CONSISTENT" ? "text-emerald-400" : "text-amber-400"}>{ecology.verdict}</strong></div>
            <div className="text-[10px] text-slate-400 truncate">{ecology.explanation}</div>
          </div>
        </div>
      </div>

      {/* Simulated Micro-Doppler Radar HUD */}
      <div className="p-2.5 bg-slate-950/80 rounded border border-slate-800 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2 text-blue-300">
          <Radio className="w-3.5 h-3.5 text-blue-400" />
          <span>MICRO-DOPPLER RADAR [SIMULATED]: {contradiction.radar_sensor_status.radar_summary}</span>
        </div>
      </div>
    </div>
  );
};
