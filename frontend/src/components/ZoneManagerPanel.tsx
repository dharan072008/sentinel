import React from 'react';
import { 
  Layers, 
  Plus, 
  Trash2, 
  ShieldAlert, 
  MapPin, 
  Lock, 
  AlertOctagon 
} from 'lucide-react';
import { VirtualZone } from '../types';

interface ZoneManagerPanelProps {
  zones: VirtualZone[];
  onAddZoneClick: () => void;
  onDeleteZone: (zoneId: string) => void;
}

export const ZoneManagerPanel: React.FC<ZoneManagerPanelProps> = ({
  zones,
  onAddZoneClick,
  onDeleteZone
}) => {
  const getSensitivityBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 text-[9px] font-bold">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[9px] font-bold">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[9px]">MEDIUM</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[9px]">LOW</span>;
    }
  };

  return (
    <div className="flex flex-col bg-[#0b1326] border border-slate-800 rounded-xl p-4 shadow-xl font-mono text-xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-white uppercase tracking-wider">
            Virtual Zones & Perimeter Matrix ({zones.length})
          </h3>
        </div>
        <button
          onClick={onAddZoneClick}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-[10px] transition-all shadow"
        >
          <Plus className="w-3 h-3" />
          <span>Add Custom Zone</span>
        </button>
      </div>

      {/* Zones Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {zones.map(z => (
          <div 
            key={z.zone_id}
            className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/90 flex flex-col justify-between gap-1.5 relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: z.color || '#3b82f6' }} />
            
            <div className="flex items-center justify-between pl-1">
              <span className="font-bold text-slate-100 truncate max-w-[150px]">
                {z.name}
              </span>
              {getSensitivityBadge(z.sensitivity_level)}
            </div>

            <p className="text-[10px] text-slate-400 pl-1 leading-snug">
              {z.description || 'Virtual surveillance perimeter polygon'}
            </p>

            <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[9px] text-slate-500 pl-1">
              <span>TYPE: {z.zone_type}</span>
              <span>{z.polygon?.length || 0} vertices</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
