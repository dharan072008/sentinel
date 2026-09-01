import React, { useState } from 'react';
import { X, Layers, Plus, Check } from 'lucide-react';
import { VirtualZone } from '../types';

interface ZoneDrawingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveZone: (zone: VirtualZone) => void;
}

export const ZoneDrawingModal: React.FC<ZoneDrawingModalProps> = ({
  isOpen,
  onClose,
  onSaveZone
}) => {
  const [name, setName] = useState('');
  const [zoneType, setZoneType] = useState<'RESTRICTED' | 'VILLAGE' | 'ROAD' | 'BUFFER' | 'SENSITIVE'>('RESTRICTED');
  const [sensitivity, setSensitivity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [color, setColor] = useState('#ef4444');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Default polygon box coordinates (scaled to 960x540)
    const newZone: VirtualZone = {
      zone_id: `ZONE_${Date.now()}`,
      name,
      polygon: [
        [500, 100],
        [800, 100],
        [800, 400],
        [500, 400]
      ],
      zone_type: zoneType,
      sensitivity_level: sensitivity,
      color,
      description
    };

    onSaveZone(newZone);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 font-mono">
      <div className="w-full max-w-md bg-[#0b1326] border border-cyan-900/80 rounded-xl overflow-hidden shadow-2xl">
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-white text-sm uppercase">Add Virtual Perimeter Zone</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Zone Name</label>
            <input
              type="text"
              placeholder="e.g. North Gate Restricted Area"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-400 block mb-1">Zone Type</label>
              <select
                value={zoneType}
                onChange={(e) => setZoneType(e.target.value as any)}
                className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="RESTRICTED">RESTRICTED</option>
                <option value="SENSITIVE">SENSITIVE</option>
                <option value="BUFFER">BUFFER</option>
                <option value="ROAD">ROAD</option>
                <option value="VILLAGE">VILLAGE</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Sensitivity</label>
              <select
                value={sensitivity}
                onChange={(e) => setSensitivity(e.target.value as any)}
                className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Overlay Color</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-8 bg-slate-950 border border-slate-700 rounded cursor-pointer"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Description / Protocol</label>
            <textarea
              placeholder="e.g. Zero tolerance perimeter for unauthorized civilian entry"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-cyan-500 h-16"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Create Zone</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
