import React from 'react';
import { 
  GitCommit, 
  MapPin, 
  AlertTriangle, 
  CornerRightDown, 
  Clock, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { SpatialEvent } from '../types';

interface EventSequenceTimelineProps {
  spatialEvents: SpatialEvent[];
  selectedTrackId: string | null;
}

export const EventSequenceTimeline: React.FC<EventSequenceTimelineProps> = ({
  spatialEvents,
  selectedTrackId
}) => {
  const filteredEvents = selectedTrackId
    ? spatialEvents.filter(e => e.track_id === selectedTrackId)
    : spatialEvents;

  return (
    <div className="flex flex-col bg-[#0b1326] border border-slate-800 rounded-xl p-4 shadow-xl font-mono text-xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <GitCommit className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-white uppercase tracking-wider">
            Chronological Event Sequence {selectedTrackId ? `// ${selectedTrackId}` : `(${filteredEvents.length} Events)`}
          </h3>
        </div>
        <span className="text-[10px] text-slate-400">
          CHRONOLOGICAL AUDIT CHAIN
        </span>
      </div>

      {/* Timeline Steps */}
      <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
        {filteredEvents.length === 0 ? (
          <div className="p-4 text-center text-slate-500">
            No sequence events logged yet.
          </div>
        ) : (
          filteredEvents.map((evt, idx) => {
            const isCritical = evt.severity === 'CRITICAL';
            const isHigh = evt.severity === 'HIGH';

            return (
              <div 
                key={idx}
                className={`p-2.5 rounded-lg border flex items-start gap-2.5 transition-all ${
                  isCritical 
                    ? 'bg-red-950/40 border-red-500/60 text-red-200' 
                    : isHigh
                    ? 'bg-amber-950/30 border-amber-500/50 text-amber-200'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                <div className="mt-0.5">
                  {isCritical ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 animate-pulse" />
                  ) : (
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  )}
                </div>

                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-[11px]">
                      STEP {idx + 1}: {evt.event_type.replace('_', ' ')} [{evt.track_id}]
                    </span>
                    <span className="text-[10px] text-slate-400">
                      T+{evt.timestamp}s
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-300">
                    {evt.description}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
