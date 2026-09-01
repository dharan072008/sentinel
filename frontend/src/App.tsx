import React, { useState, useEffect } from 'react';
import { 
  fetchHealth, 
  fetchScenarios, 
  fetchZones, 
  saveZone, 
  deleteZone, 
  uploadVideo, 
  analyzeVideo, 
  fetchDossier 
} from './services/api';
import { 
  PresetScenario, 
  VirtualZone, 
  TrackData, 
  FrameRecord, 
  SpatialEvent, 
  OddOneOutResult, 
  BaselineComparison, 
  AerialTelemetry, 
  ExplainableDossier,
  VideoAnalysisResponse
} from './types';

import { TacticalHeader } from './components/TacticalHeader';
import { VideoPlayerCanvas } from './components/VideoPlayerCanvas';
import { TrackListRail } from './components/TrackListRail';
import { TrackDetailCard } from './components/TrackDetailCard';
import { ExplainableAlertDossier } from './components/ExplainableAlertDossier';
import { OddOneOutScatter } from './components/OddOneOutScatter';
import { BaselineComparisonChart } from './components/BaselineComparisonChart';
import { AerialEcologicalMatrix } from './components/AerialEcologicalMatrix';
import { ZoneManagerPanel } from './components/ZoneManagerPanel';
import { EventSequenceTimeline } from './components/EventSequenceTimeline';
import { ZoneDrawingModal } from './components/ZoneDrawingModal';
import { CCTVFeedSidebar } from './components/CCTVFeedSidebar';

import { 
  Target, 
  SlidersHorizontal, 
  Bird, 
  GitCommit, 
  Layers,
  AlertCircle,
  Camera
} from 'lucide-react';


export function App() {
  // Scenarios and Environment Context
  const [scenarios, setScenarios] = useState<PresetScenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('border_incursion');
  const [region, setRegion] = useState<string>('Punjab_Sector');
  const [season, setSeason] = useState<string>('Winter');
  const [timeOfDay, setTimeOfDay] = useState<string>('Dusk');
  const [habitat, setHabitat] = useState<string>('Farmland');

  // Video & Analysis State
  const [videoUrl, setVideoUrl] = useState<string>('/static/videos/border_sector_incursion.mp4');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [zones, setZones] = useState<VirtualZone[]>([]);
  const [tracks, setTracks] = useState<TrackData[]>([]);
  const [frameRecords, setFrameRecords] = useState<FrameRecord[]>([]);
  const [spatialEvents, setSpatialEvents] = useState<SpatialEvent[]>([]);
  const [oddOneOut, setOddOneOut] = useState<OddOneOutResult | null>(null);
  const [baselineSummary, setBaselineSummary] = useState<BaselineComparison[]>([]);
  const [aerialResults, setAerialResults] = useState<Record<string, AerialTelemetry>>({});
  const [dossiers, setDossiers] = useState<Record<string, ExplainableDossier>>({});
  
  // Selected entity for deep dive
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>('P07');
  const [isZoneModalOpen, setIsZoneModalOpen] = useState<boolean>(false);
  const [leftTab, setLeftTab] = useState<'CCTV_FEEDS' | 'TRACKS'>('CCTV_FEEDS');
  const [bottomTab, setBottomTab] = useState<'ODD_ONE_OUT' | 'BASELINE' | 'AERIAL' | 'TIMELINE' | 'ZONES'>('ODD_ONE_OUT');


  // Initial Load: Fetch Scenarios & Default Zones
  useEffect(() => {
    async function init() {
      try {
        const [scenariosData, zonesData] = await Promise.all([
          fetchScenarios(),
          fetchZones()
        ]);
        setScenarios(scenariosData);
        setZones(zonesData);

        // Auto-run initial preset analysis for seamless demo experience
        runAnalysis('preset:border_incursion');
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }
    init();
  }, []);

  // Handle Scenario Selection (Puts selected CCTV directly in the center)
  const handleSelectScenario = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    if (scenarioId === 'custom') return;

    if (scenarioId === 'live_webcam') {
      setVideoUrl('live:webcam');
      return;
    }

    const fallbacks: Record<string, any> = {
      border_incursion: {
        region: 'Punjab_Sector',
        season: 'Winter',
        time_of_day: 'Dusk',
        habitat: 'Farmland / Border Fence',
        video_url: '/static/videos/border_sector_incursion.mp4'
      },
      aerial_contradiction: {
        region: 'Thar_Desert_Sector',
        season: 'Summer',
        time_of_day: 'Day',
        habitat: 'Scrubland / Airspace',
        video_url: '/static/videos/aerial_drone_contradiction.mp4'
      },
      checkpoint_patrol: {
        region: 'Rann_of_Kutch',
        season: 'Monsoon',
        time_of_day: 'Night',
        habitat: 'Coastal Marsh / Outpost',
        video_url: '/static/videos/checkpoint_night_patrol.mp4'
      },
      forest_trail: {
        region: 'North_East_Sector',
        season: 'Autumn',
        time_of_day: 'Dusk',
        habitat: 'Forest Border',
        video_url: '/static/videos/forest_border_trail.mp4'
      },
      village_baseline: {
        region: 'Punjab_Sector',
        season: 'Winter',
        time_of_day: 'Day',
        habitat: 'Village Perimeter',
        video_url: '/static/videos/village_baseline_traffic.mp4'
      }
    };

    const found = scenarios.find(s => s.id === scenarioId) || fallbacks[scenarioId];
    if (found) {
      setRegion(found.region);
      setSeason(found.season);
      setTimeOfDay(found.time_of_day);
      setHabitat(found.habitat);
      setVideoUrl(found.video_url);
      runAnalysis(`preset:${scenarioId}`, {
        region: found.region,
        season: found.season,
        time_of_day: found.time_of_day,
        habitat: found.habitat
      });
    }
  };


  // Handle Video File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsAnalyzing(true);
      const res = await uploadVideo(file);
      setSelectedScenarioId('custom');
      setVideoUrl(res.metadata.video_url);
      
      // Execute analysis on uploaded video
      await runAnalysis(`upload:${res.metadata.filename}`);
    } catch (err) {
      console.error('File upload failed:', err);
      alert('Failed to upload video file.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Run End-to-End Surveillance Intelligence Pipeline
  const runAnalysis = async (source?: string, contextOverride?: any) => {
    try {
      setIsAnalyzing(true);
      const videoSource = source || (selectedScenarioId === 'custom' ? videoUrl : `preset:${selectedScenarioId}`);
      const ctx = contextOverride || { region, season, time_of_day: timeOfDay, habitat };

      const res: VideoAnalysisResponse = await analyzeVideo(videoSource, ctx);
      
      setVideoUrl(res.video_url);
      setTracks(res.tracks);
      setFrameRecords(res.frame_records);
      setSpatialEvents(res.spatial_events);
      setOddOneOut(res.odd_one_out);
      setBaselineSummary(res.baseline_summary);
      setAerialResults(res.aerial_results);
      setDossiers(res.dossiers);

      // Default select the primary outlier if found, else first track
      if (res.odd_one_out?.primary_outlier?.track_id) {
        setSelectedTrackId(res.odd_one_out.primary_outlier.track_id);
      } else if (res.tracks.length > 0) {
        setSelectedTrackId(res.tracks[0].track_id);
      }
    } catch (err) {
      console.error('Analysis pipeline error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveZone = async (zone: VirtualZone) => {
    try {
      const saved = await saveZone(zone);
      setZones(prev => [...prev.filter(z => z.zone_id !== saved.zone_id), saved]);
    } catch (err) {
      console.error('Save zone error:', err);
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    try {
      await deleteZone(zoneId);
      setZones(prev => prev.filter(z => z.zone_id !== zoneId));
    } catch (err) {
      console.error('Delete zone error:', err);
    }
  };

  const handleLiveUpdate = React.useCallback((liveData: any) => {
    if (liveData.accumulated_tracks && liveData.accumulated_tracks.length > 0) {
      setTracks(liveData.accumulated_tracks);
    }
    if (liveData.odd_one_out) {
      setOddOneOut(liveData.odd_one_out);
      if (!selectedTrackId && liveData.odd_one_out.primary_outlier?.track_id) {
        setSelectedTrackId(liveData.odd_one_out.primary_outlier.track_id);
      }
    }
    if (liveData.baseline_summary) {
      setBaselineSummary(liveData.baseline_summary);
    }
    if (liveData.aerial_results) {
      setAerialResults(liveData.aerial_results);
    }
    if (liveData.spatial_events && liveData.spatial_events.length > 0) {
      setSpatialEvents(prev => [...prev.slice(-30), ...liveData.spatial_events]);
    }
    if (liveData.dossiers) {
      setDossiers(prev => ({ ...prev, ...liveData.dossiers }));
    }
  }, [selectedTrackId]);

  const currentDossier = selectedTrackId ? dossiers[selectedTrackId] || null : null;
  const currentTrack = tracks.find(t => t.track_id === selectedTrackId) || null;
  const currentAerialData = selectedTrackId ? aerialResults[selectedTrackId] || null : null;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans select-none antialiased bg-grid-tactical">
      {/* 1. Tactical Command Header */}
      <TacticalHeader
        scenarios={scenarios}
        selectedScenarioId={selectedScenarioId}
        onSelectScenario={handleSelectScenario}
        onFileUpload={handleFileUpload}
        onRunAnalysis={() => runAnalysis()}
        isAnalyzing={isAnalyzing}
        region={region}
        setRegion={setRegion}
        season={season}
        setSeason={setSeason}
        timeOfDay={timeOfDay}
        setTimeOfDay={setTimeOfDay}
        habitat={habitat}
        setHabitat={setHabitat}
        systemStatus="ONLINE"
        threatLevel={currentDossier?.priority.priority_level || 'LOW_REVIEW'}
      />

      {/* 2. Main Command Center Grid */}
      <main className="flex-1 p-4 lg:p-5 grid grid-cols-1 xl:grid-cols-12 gap-4 max-w-[1800px] w-full mx-auto">
        {/* Left Column: Tactical CCTV Feeds & Track Registry (3 cols) */}
        <div className="xl:col-span-3 flex flex-col gap-3">
          {/* Sub-tab Navigation */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-lg text-xs font-mono">
            <button
              onClick={() => setLeftTab('CCTV_FEEDS')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded transition-all ${
                leftTab === 'CCTV_FEEDS'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>CCTV FEEDS (5)</span>
            </button>

            <button
              onClick={() => setLeftTab('TRACKS')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded transition-all ${
                leftTab === 'TRACKS'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>TRACKS ({tracks.length})</span>
            </button>
          </div>

          {leftTab === 'CCTV_FEEDS' ? (
            <CCTVFeedSidebar
              scenarios={scenarios}
              selectedScenarioId={selectedScenarioId}
              onSelectScenario={handleSelectScenario}
              isAnalyzing={isAnalyzing}
            />
          ) : (
            <>
              <TrackListRail
                tracks={tracks}
                selectedTrackId={selectedTrackId}
                onSelectTrack={(id) => setSelectedTrackId(id)}
                primaryOutlierId={oddOneOut?.primary_outlier?.track_id}
              />
              <TrackDetailCard
                track={currentTrack}
              />
            </>
          )}
        </div>


        {/* Center Column: Live Surveillance Canvas & Bottom Intelligence Drawer (6 cols) */}
        <div className="xl:col-span-6 flex flex-col gap-4">
          <VideoPlayerCanvas
            videoUrl={videoUrl}
            isLiveMode={selectedScenarioId === 'live_webcam'}
            frameRecords={frameRecords}
            zones={zones}
            selectedTrackId={selectedTrackId}
            onSelectTrack={(id) => setSelectedTrackId(id)}
            primaryOutlierId={oddOneOut?.primary_outlier?.track_id}
            isAnalyzing={isAnalyzing}
            region={region}
            season={season}
            timeOfDay={timeOfDay}
            habitat={habitat}
            onLiveUpdate={handleLiveUpdate}
          />


          {/* Bottom Multi-Engine Intelligence Tabs */}
          <div className="flex flex-col bg-[#0b1326] border border-cyan-900/40 rounded-xl overflow-hidden shadow-2xl">
            {/* Tab Navigation */}
            <div className="flex items-center gap-1 px-3 py-2 bg-slate-900 border-b border-slate-800 text-xs font-mono overflow-x-auto">
              <button
                onClick={() => setBottomTab('ODD_ONE_OUT')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all whitespace-nowrap ${
                  bottomTab === 'ODD_ONE_OUT'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>ODD-ONE-OUT RADAR</span>
              </button>

              <button
                onClick={() => setBottomTab('BASELINE')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all whitespace-nowrap ${
                  bottomTab === 'BASELINE'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>BASELINE COMPARISON</span>
              </button>

              <button
                onClick={() => setBottomTab('AERIAL')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all whitespace-nowrap ${
                  bottomTab === 'AERIAL'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Bird className="w-3.5 h-3.5" />
                <span>BIRD / DRONE MATRIX</span>
              </button>

              <button
                onClick={() => setBottomTab('TIMELINE')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all whitespace-nowrap ${
                  bottomTab === 'TIMELINE'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <GitCommit className="w-3.5 h-3.5" />
                <span>EVENT TIMELINE</span>
              </button>

              <button
                onClick={() => setBottomTab('ZONES')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all whitespace-nowrap ${
                  bottomTab === 'ZONES'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>PERIMETER ZONES</span>
              </button>
            </div>

            {/* Active Tab Panel */}
            <div className="p-1">
              {bottomTab === 'ODD_ONE_OUT' && (
                <OddOneOutScatter
                  oddOneOut={oddOneOut}
                  selectedTrackId={selectedTrackId}
                  onSelectTrack={(id) => setSelectedTrackId(id)}
                />
              )}

              {bottomTab === 'BASELINE' && (
                <BaselineComparisonChart
                  baselineSummary={baselineSummary}
                  selectedTrackId={selectedTrackId}
                />
              )}

              {bottomTab === 'AERIAL' && (
                <AerialEcologicalMatrix
                  aerialData={currentAerialData}
                  trackId={selectedTrackId || 'None'}
                />
              )}

              {bottomTab === 'TIMELINE' && (
                <EventSequenceTimeline
                  spatialEvents={spatialEvents}
                  selectedTrackId={selectedTrackId}
                />
              )}

              {bottomTab === 'ZONES' && (
                <ZoneManagerPanel
                  zones={zones}
                  onAddZoneClick={() => setIsZoneModalOpen(true)}
                  onDeleteZone={handleDeleteZone}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Explainable Incident Dossier & Operator Actions (3 cols) */}
        <div className="xl:col-span-3 flex flex-col gap-4">
          <ExplainableAlertDossier
            dossier={currentDossier}
            onActionComplete={() => {
              if (selectedTrackId) {
                fetchDossier(selectedTrackId).then(updated => {
                  setDossiers(prev => ({ ...prev, [selectedTrackId]: updated }));
                });
              }
            }}
          />
        </div>
      </main>

      {/* Zone Custom Creation Modal */}
      <ZoneDrawingModal
        isOpen={isZoneModalOpen}
        onClose={() => setIsZoneModalOpen(false)}
        onSaveZone={handleSaveZone}
      />
    </div>
  );
}

export default App;
