import React, { useRef, useEffect } from 'react';
import { 
  Camera, 
  ShieldAlert, 
  Play, 
  Flame, 
  Eye, 
  Radar, 
  Radio, 
  CheckCircle2, 
  AlertTriangle,
  Layers,
  ChevronRight
} from 'lucide-react';
import { PresetScenario } from '../types';
import { drawScenarioScene, getScenarioEntities, drawEntityVisual } from '../services/tacticalRenderer';

interface CCTVFeedSidebarProps {
  scenarios: PresetScenario[];
  selectedScenarioId: string;
  onSelectScenario: (id: string) => void;
  isAnalyzing: boolean;
}

const MiniCCTVThumbnail: React.FC<{ scenarioId: string }> = ({ scenarioId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;
    let t = Math.random() * 5;
    const render = () => {
      t += 0.035;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);
          drawScenarioScene(ctx, w, h, scenarioId, t, false);
          const entities = getScenarioEntities(scenarioId, t, w, h);
          entities.forEach(ent => {
            drawEntityVisual(ctx, ent, false, false);
          });
        }
      }
      animId = requestAnimationFrame(render);
    };
    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [scenarioId]);

  return <canvas ref={canvasRef} width={280} height={110} className="w-full h-full object-cover" />;
};

interface FeedItem {
  id: string;
  camCode: string;
  title: string;
  location: string;
  sensor: string;
  threatLevel: string;
  outlier: string;
  eventSnippet: string;
  badgeColor: string;
  videoUrl?: string;
  isCctvFootage?: boolean;
}

export const CCTVFeedSidebar: React.FC<CCTVFeedSidebarProps> = ({
  scenarios,
  selectedScenarioId,
  onSelectScenario,
  isAnalyzing
}) => {
  const defaultPresetFeeds: FeedItem[] = [
    {
      id: 'border_incursion',
      camCode: 'CAM-01',
      title: 'Border Sector 4 — Perimeter Fence',
      location: 'Punjab Border Sector',
      sensor: 'CCTV Optical (Real)',
      threatLevel: 'CRITICAL',
      outlier: 'Person P07',
      eventSnippet: 'Road deviation ➔ Fence breach ➔ Unattended baggage drop',
      badgeColor: 'border-red-500/60 bg-red-950/60 text-red-300'
    },
    {
      id: 'aerial_contradiction',
      camCode: 'CAM-02',
      title: 'Aerial Sector 7 — Airspace Radar',
      location: 'Thar Desert Airspace',
      sensor: 'LWIR Thermal + Doppler Radar',
      threatLevel: 'HIGH',
      outlier: 'Target B04 (Stealth Drone)',
      eventSnippet: 'Avian silhouette with 68°C motor heat & 3400 RPM radar harmonics',
      badgeColor: 'border-purple-500/60 bg-purple-950/60 text-purple-300'
    },
    {
      id: 'checkpoint_patrol',
      camCode: 'CAM-03',
      title: 'Night Checkpost — Depot Perimeter',
      location: 'Coastal Rann Outpost',
      sensor: 'IR Night Vision + Radar',
      threatLevel: 'CRITICAL',
      outlier: 'Intruder P09',
      eventSnippet: 'Gate inspection diversion ➔ Unauthorized fuel depot infiltration',
      badgeColor: 'border-amber-500/60 bg-amber-950/60 text-amber-300'
    },
    {
      id: 'forest_trail',
      camCode: 'CAM-04',
      title: 'Forest Trail — High-Velocity Breach',
      location: 'North-East Forest Border',
      sensor: 'Optical CCTV + Acoustic',
      threatLevel: 'HIGH',
      outlier: 'Intruder P14',
      eventSnippet: 'Wildlife grazing baseline vs 3.2x high-velocity crossing sprint',
      badgeColor: 'border-orange-500/60 bg-orange-950/60 text-orange-300'
    },
    {
      id: 'village_baseline',
      camCode: 'CAM-05',
      title: 'Civilian Village — Nominal Flow',
      location: 'Village Transit Corridor',
      sensor: 'CCTV Optical',
      threatLevel: 'NOMINAL',
      outlier: 'None (Nominal Base)',
      eventSnippet: 'Standard pedestrian transit along road; all tracks conform to baseline',
      badgeColor: 'border-emerald-500/60 bg-emerald-950/60 text-emerald-300'
    }
  ];

  // Map backend scenarios dynamically if available
  const feeds: FeedItem[] = (scenarios && scenarios.length > 0)
    ? scenarios.map((scen, idx) => {
        const presetMatch = defaultPresetFeeds.find(p => p.id === scen.id);
        const threatLevel = scen.expected_threat_level.replace('_REVIEW', '');
        const badgeColor = threatLevel === 'CRITICAL' 
          ? 'border-red-500/60 bg-red-950/60 text-red-300'
          : threatLevel === 'HIGH'
          ? 'border-orange-500/60 bg-orange-950/60 text-orange-300'
          : 'border-emerald-500/60 bg-emerald-950/60 text-emerald-300';

        return {
          id: scen.id,
          camCode: `CAM-${String(idx + 1).padStart(2, '0')}`,
          title: scen.title,
          location: scen.region || 'Surveillance Zone',
          sensor: scen.is_cctv_footage ? 'YOLOv8 Real CCTV Footage' : (presetMatch?.sensor || 'CCTV Optical'),
          threatLevel: threatLevel,
          outlier: scen.outlier_target || 'Auto-Detected',
          eventSnippet: scen.description,
          badgeColor: presetMatch?.badgeColor || badgeColor,
          videoUrl: scen.video_url,
          isCctvFootage: !!scen.is_cctv_footage
        };
      })
    : defaultPresetFeeds;

  return (
    <div className="flex flex-col bg-[#0b1329] border border-cyan-900/40 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border-b border-cyan-900/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-100">
            TACTICAL CCTV MATRIX
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span>{feeds.length} FEEDS ACTIVE</span>
        </span>
      </div>

      {/* CCTV Feeds List */}
      <div className="p-3 flex flex-col gap-2.5 max-h-[560px] overflow-y-auto custom-scrollbar">
        {feeds.map((feed) => {
          const isSelected = selectedScenarioId === feed.id;

          return (
            <div
              key={feed.id}
              onClick={() => onSelectScenario(feed.id)}
              className={`group relative flex flex-col gap-2 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/40'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-600 hover:bg-slate-800/70'
              }`}
            >
              {/* Top Row: Cam Code & Live Indicator */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isSelected ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-slate-800 text-cyan-300'
                  }`}>
                    {feed.camCode}
                  </span>
                  <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                    {feed.title}
                  </span>
                </div>

                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${feed.badgeColor}`}>
                  {feed.threatLevel}
                </span>
              </div>

              {/* Animated Live Mini Canvas / Video Preview */}
              <div className="relative w-full h-24 bg-black rounded overflow-hidden border border-slate-800/80 group-hover:border-cyan-500/40 transition-colors">
                {feed.isCctvFootage && feed.videoUrl ? (
                  feed.videoUrl.endsWith('.gif') ? (
                    <img src={feed.videoUrl} alt={feed.title} className="w-full h-full object-cover" />
                  ) : (
                    <video src={feed.videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                  )
                ) : (
                  <MiniCCTVThumbnail scenarioId={feed.id} />
                )}
                
                {/* Overlay Badge */}
                <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-sm text-[9px] font-mono text-slate-300 border border-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                  <span>LIVE REC</span>
                </div>

                <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-cyan-300">
                  {feed.location}
                </div>
              </div>

              {/* Behavior & Outlier Summary */}
              <div className="flex flex-col gap-1 text-[11px] font-mono">
                <div className="flex items-center justify-between text-slate-400">
                  <span>OUTLIER: <strong className="text-amber-300">{feed.outlier}</strong></span>
                  <span className="text-[10px] text-slate-500">{feed.sensor}</span>
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed bg-slate-950/60 p-1.5 rounded border border-slate-800/60">
                  {feed.eventSnippet}
                </p>
              </div>

              {/* Action Button */}
              <button
                disabled={isAnalyzing}
                className={`w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 rounded font-mono text-xs font-bold uppercase tracking-wider transition-all ${
                  isSelected
                    ? 'bg-cyan-500 text-black shadow-md'
                    : 'bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 border border-slate-700'
                }`}
              >
                <Play className="w-3 h-3 fill-current" />
                <span>{isSelected ? 'FEED ACTIVE • RUNNING AI' : 'SWITCH TO THIS FEED'}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
