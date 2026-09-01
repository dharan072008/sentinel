import React from 'react';
import { 
  Compass, 
  Clock, 
  Activity, 
  MapPin, 
  CornerDownRight, 
  ShieldCheck, 
  AlertTriangle,
  Move,
  Users
} from 'lucide-react';
import { TrackData, BehaviourFeatures } from '../types';

interface TrackDetailCardProps {
  track: TrackData | null;
  behaviour?: BehaviourFeatures;
}

export const TrackDetailCard: React.FC<TrackDetailCardProps> = ({ track, behaviour }) => {
  if (!track) {
    return (
      <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl text-center font-mono text-xs text-slate-500">
        Select an active entity on the radar map or track registry to view detailed kinematics and spatial trajectory.
      </div>
    );
  }

  const isRestricted = track.current_zone.includes('Restricted') || track.current_zone.includes('Outpost');

  return (
    <div className="flex flex-col bg-[#0b1326] border border-cyan-900/50 rounded-xl overflow-hidden shadow-xl font-mono text-xs">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h2 className="font-bold text-white tracking-wider">
            TRACK TELEMETRY // {track.track_id}
          </h2>
        </div>
        <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 uppercase font-bold text-[10px]">
          {track.class_name}
        </span>
      </div>

      <div className="p-4 space-y-3">
        {/* Core Kinematics Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="p-2 bg-slate-950/60 rounded border border-slate-800">
            <div className="text-[10px] text-slate-500">EST. SPEED</div>
            <div className="text-base font-bold text-cyan-400 mt-0.5">
              {track.speed_kmh} <span className="text-[10px] text-slate-400">km/h</span>
            </div>
          </div>

          <div className="p-2 bg-slate-950/60 rounded border border-slate-800">
            <div className="text-[10px] text-slate-500">DWELL TIME</div>
            <div className="text-base font-bold text-emerald-400 mt-0.5">
              {track.dwell_seconds.toFixed(1)} <span className="text-[10px] text-slate-400">sec</span>
            </div>
          </div>

          <div className="p-2 bg-slate-950/60 rounded border border-slate-800">
            <div className="text-[10px] text-slate-500">HEADING DEG</div>
            <div className="text-base font-bold text-amber-400 mt-0.5">
              {track.heading_deg.toFixed(0)}°
            </div>
          </div>

          <div className="p-2 bg-slate-950/60 rounded border border-slate-800">
            <div className="text-[10px] text-slate-500">CONFIDENCE</div>
            <div className="text-base font-bold text-purple-400 mt-0.5">
              {(track.confidence * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Spatial Zone & State */}
        <div className="p-2.5 bg-slate-950/80 rounded border border-slate-800 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              CURRENT ZONE:
            </span>
            <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
              isRestricted ? 'bg-red-950 text-red-300 border border-red-500/50' : 'bg-slate-900 text-slate-200'
            }`}>
              {track.current_zone}
            </span>
          </div>

          {behaviour && (
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5 text-amber-400" />
                OBSERVED STATE:
              </span>
              <span className="text-amber-300 font-semibold">
                {behaviour.movement_state}
              </span>
            </div>
          )}
        </div>

        {/* Route Tortuosity & Curvature Analysis */}
        {behaviour && (
          <div className="p-2.5 bg-slate-950/40 rounded border border-slate-800/70 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-500">Route Tortuosity:</span>{' '}
              <strong className="text-slate-200">{behaviour.route_tortuosity}x</strong>{' '}
              <span className="text-[10px] text-slate-500">(1.0 = Straight)</span>
            </div>
            <div>
              <span className="text-slate-500">Turn Angle Sum:</span>{' '}
              <strong className="text-slate-200">{behaviour.turn_angle_sum_deg}°</strong>
            </div>
          </div>
        )}

        {/* Trajectory Points Mini Visualizer */}
        <div className="p-2 bg-slate-950/80 rounded border border-slate-800">
          <div className="text-[10px] text-slate-400 mb-1 flex items-center justify-between">
            <span>TRAJECTORY VECTOR LOG ({track.trajectory.length} pts):</span>
            <span className="text-cyan-400 text-[9px]">CENTER: [{track.center[0]}, {track.center[1]}]</span>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {track.trajectory.slice(-8).map((pt, idx) => (
              <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[9px] text-slate-300 whitespace-nowrap">
                ({pt[0]}, {pt[1]})
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
