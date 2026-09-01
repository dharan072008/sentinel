import React from 'react';
import { 
  ShieldAlert, 
  Radar, 
  Upload, 
  Play, 
  RefreshCw, 
  Cpu, 
  Eye, 
  Flame, 
  Radio, 
  MapPin, 
  Sun, 
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { PresetScenario } from '../types';

interface TacticalHeaderProps {
  scenarios: PresetScenario[];
  selectedScenarioId: string;
  onSelectScenario: (id: string) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRunAnalysis: () => void;
  isAnalyzing: boolean;
  region: string;
  setRegion: (r: string) => void;
  season: string;
  setSeason: (s: string) => void;
  timeOfDay: string;
  setTimeOfDay: (t: string) => void;
  habitat: string;
  setHabitat: (h: string) => void;
  systemStatus: string;
  threatLevel: string;
}

export const TacticalHeader: React.FC<TacticalHeaderProps> = ({
  scenarios,
  selectedScenarioId,
  onSelectScenario,
  onFileUpload,
  onRunAnalysis,
  isAnalyzing,
  region,
  setRegion,
  season,
  setSeason,
  timeOfDay,
  setTimeOfDay,
  habitat,
  setHabitat,
  systemStatus,
  threatLevel
}) => {
  return (
    <header className="w-full bg-[#0b1329] border-b border-cyan-900/40 px-5 py-3 flex flex-col lg:flex-row items-center justify-between gap-4 select-none shadow-xl">
      {/* Brand & System Title */}
      <div className="flex items-center gap-3.5">
        <div className="relative flex items-center justify-center w-11 h-11 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.35)]">
          <ShieldAlert className="w-6 h-6 text-cyan-400 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-950 animate-ping"></span>
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black tracking-widest text-white uppercase font-mono">
              SENTINEL<span className="text-cyan-400">_INTEL</span>
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 tracking-wider">
              BUILD WITH BHARAT v1.0
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono tracking-tight flex items-center gap-2">
            <span>CONTEXT-AWARE SURVEILLANCE INTELLIGENCE</span>
            <span className="text-cyan-500/50">•</span>
            <span className="text-emerald-400">AI SENSOR FUSION ACTIVE</span>
          </p>
        </div>
      </div>

      {/* Sensor Health Status Badges */}
      <div className="hidden xl:flex items-center gap-2 text-xs font-mono">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900/80 border border-slate-800 text-slate-300">
          <Eye className="w-3.5 h-3.5 text-cyan-400" />
          <span>CCTV: <strong className="text-emerald-400">REAL</strong></span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900/80 border border-slate-800 text-slate-300" title="Simulated Sensor Module">
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>LWIR IR: <strong className="text-amber-400">SIMULATED</strong></span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900/80 border border-slate-800 text-slate-300" title="Simulated Micro-Doppler Radar">
          <Radar className="w-3.5 h-3.5 text-blue-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>RADAR: <strong className="text-blue-400">SIMULATED</strong></span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900/80 border border-slate-800 text-slate-300">
          <Cpu className="w-3.5 h-3.5 text-purple-400" />
          <span>YOLOv8 + KALMAN: <strong className="text-emerald-400">ACTIVE</strong></span>
        </div>
      </div>

      {/* Controls & Context Modifiers */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Scenario Presets */}

        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/70 rounded-md px-2.5 py-1.5">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Input Source:</span>
          <select 
            value={selectedScenarioId}
            onChange={(e) => onSelectScenario(e.target.value)}
            className="bg-transparent text-xs text-cyan-300 font-medium focus:outline-none cursor-pointer max-w-[220px] truncate"
          >
            <option value="live_webcam" className="bg-slate-900 text-red-400 font-bold">
              🔴 Live Laptop Webcam (Simulation)
            </option>
            <optgroup label="Preset CCTV Scenarios" className="bg-slate-900 text-slate-300">
              {scenarios.map(s => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                  {s.title}
                </option>
              ))}
            </optgroup>
            <option value="custom" className="bg-slate-900 text-cyan-300 font-bold">
              📁 Custom Uploaded CCTV File
            </option>
          </select>
        </div>

        {/* Live Camera Quick Button */}
        <button
          onClick={() => onSelectScenario(selectedScenarioId === 'live_webcam' ? 'border_incursion' : 'live_webcam')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs font-bold transition-all ${
            selectedScenarioId === 'live_webcam'
              ? 'bg-red-600/90 text-white shadow-[0_0_12px_rgba(239,68,68,0.6)] border border-red-400 animate-pulse'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
          title="Toggle Laptop Webcam Live Surveillance"
        >
          <span className={`w-2 h-2 rounded-full ${selectedScenarioId === 'live_webcam' ? 'bg-white' : 'bg-red-500'}`}></span>
          <span>{selectedScenarioId === 'live_webcam' ? 'LIVE WEBCAM ACTIVE' : 'LIVE WEBCAM'}</span>
        </button>

        {/* Context Selector: Region & Season */}
        <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/70 rounded-md px-2 py-1.5">
          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
          <select 
            value={region} 
            onChange={(e) => setRegion(e.target.value)}
            className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="Punjab_Sector" className="bg-slate-900">Punjab Sector</option>
            <option value="Thar_Desert_Sector" className="bg-slate-900">Thar Desert Sector</option>
            <option value="Ladakh_Himalayan_Sector" className="bg-slate-900">Ladakh Himalayan</option>
            <option value="Rann_of_Kutch" className="bg-slate-900">Rann of Kutch</option>
            <option value="North_East_Sector" className="bg-slate-900">North East Sector</option>
          </select>
        </div>

        <div className="hidden md:flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/70 rounded-md px-2 py-1.5">
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          <select 
            value={season} 
            onChange={(e) => setSeason(e.target.value)}
            className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="Winter" className="bg-slate-900">Winter</option>
            <option value="Summer" className="bg-slate-900">Summer</option>
            <option value="Monsoon" className="bg-slate-900">Monsoon</option>
            <option value="Autumn" className="bg-slate-900">Autumn</option>
          </select>
        </div>

        {/* Video Upload Button */}
        <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-mono text-slate-200 cursor-pointer transition-colors shadow-sm">
          <Upload className="w-3.5 h-3.5 text-cyan-400" />
          <span>Upload CCTV</span>
          <input 
            type="file" 
            accept="video/mp4,video/avi,video/mov,video/mkv" 
            onChange={onFileUpload} 
            className="hidden" 
          />
        </label>

        {/* Run Analysis Trigger Button */}
        {selectedScenarioId !== 'live_webcam' && (
          <button
            onClick={onRunAnalysis}
            disabled={isAnalyzing}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-md ${
              isAnalyzing 
                ? 'bg-cyan-900/70 text-cyan-300 border border-cyan-500/50 cursor-wait' 
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border border-cyan-400/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.5)]'
            }`}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Process Video</span>
              </>
            )}
          </button>
        )}
      </div>
    </header>
  );
};

