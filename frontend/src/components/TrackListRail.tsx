import React, { useState } from 'react';
import { 
  Users, 
  User, 
  Search, 
  AlertCircle, 
  Radio, 
  Compass, 
  ShieldAlert,
  Car,
  Package,
  Bird,
  Layers
} from 'lucide-react';
import { TrackData } from '../types';

interface TrackListRailProps {
  tracks: TrackData[];
  selectedTrackId: string | null;
  onSelectTrack: (trackId: string) => void;
  primaryOutlierId?: string;
}

export const TrackListRail: React.FC<TrackListRailProps> = ({
  tracks,
  selectedTrackId,
  onSelectTrack,
  primaryOutlierId
}) => {
  const [filterClass, setFilterClass] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTracks = tracks.filter(track => {
    const matchesClass = filterClass === 'ALL' || track.class_name.toUpperCase() === filterClass;
    const matchesSearch = track.track_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          track.current_zone.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesSearch;
  });

  const getClassIcon = (className: string) => {
    switch (className.toLowerCase()) {
      case 'person': return <User className="w-3.5 h-3.5 text-cyan-400" />;
      case 'bird': return <Bird className="w-3.5 h-3.5 text-amber-400" />;
      case 'drone': return <Radio className="w-3.5 h-3.5 text-purple-400" />;
      case 'vehicle': return <Car className="w-3.5 h-3.5 text-blue-400" />;
      case 'object': return <Package className="w-3.5 h-3.5 text-yellow-400" />;
      default: return <Users className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0b1326] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold font-mono text-white tracking-wide uppercase">
            Track Registry ({tracks.length})
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
          PERSISTENT IDs
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 px-3 py-2 bg-slate-950/60 border-b border-slate-800 text-[11px] font-mono overflow-x-auto">
        {['ALL', 'PERSON', 'BIRD', 'DRONE', 'VEHICLE', 'OBJECT'].map(cls => (
          <button
            key={cls}
            onClick={() => setFilterClass(cls)}
            className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${
              filterClass === cls
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {cls}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="p-2 border-b border-slate-800">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5" />
          <input
            type="text"
            placeholder="Search Track ID or Zone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-slate-900 border border-slate-700/80 rounded text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Track List Items */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 max-h-[420px]">
        {filteredTracks.length === 0 ? (
          <div className="p-4 text-center text-xs font-mono text-slate-500">
            No entities matching filter criteria.
          </div>
        ) : (
          filteredTracks.map(track => {
            const isSelected = track.track_id === selectedTrackId;
            const isOutlier = track.track_id === primaryOutlierId;
            const isRestricted = track.current_zone.includes('Restricted') || track.current_zone.includes('Outpost');

            return (
              <div
                key={track.track_id}
                onClick={() => onSelectTrack(track.track_id)}
                className={`p-2.5 rounded-lg border cursor-pointer transition-all flex flex-col gap-1.5 ${
                  isSelected
                    ? 'bg-cyan-950/70 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                    : isOutlier
                    ? 'bg-red-950/40 border-red-500/60 hover:border-red-400'
                    : 'bg-slate-900/70 border-slate-800/90 hover:bg-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Track Item Top Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getClassIcon(track.class_name)}
                    <span className="font-mono font-bold text-xs text-white">
                      {track.track_id}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      ({track.class_name})
                    </span>
                  </div>

                  {/* Outlier / Incursion Badges */}
                  <div className="flex items-center gap-1">
                    {isOutlier && (
                      <span className="px-1.5 py-0.5 rounded bg-red-900/80 text-red-300 border border-red-500/50 text-[9px] font-mono font-bold animate-pulse">
                        ODD-ONE-OUT
                      </span>
                    )}
                    {isRestricted && !isOutlier && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-900/70 text-amber-300 border border-amber-500/50 text-[9px] font-mono">
                        INCURSION
                      </span>
                    )}
                  </div>
                </div>

                {/* Telemetry Row */}
                <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-slate-400 bg-slate-950/40 p-1.5 rounded border border-slate-800/60">
                  <div>
                    <span className="text-slate-500">SPEED:</span>{' '}
                    <strong className="text-slate-200">{track.speed_kmh} km/h</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">DWELL:</span>{' '}
                    <strong className="text-slate-200">{track.dwell_seconds.toFixed(0)}s</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">CONF:</span>{' '}
                    <strong className="text-slate-200">{(track.confidence * 100).toFixed(0)}%</strong>
                  </div>
                </div>

                {/* Zone Indicator */}
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-400 truncate max-w-[170px]">
                    📍 {track.current_zone}
                  </span>
                  <span className="text-cyan-400">
                    HDG: {track.heading_deg.toFixed(0)}°
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
