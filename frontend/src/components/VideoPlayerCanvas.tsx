import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  RotateCcw, 
  Layers, 
  Flame, 
  ShieldAlert, 
  Eye, 
  Sliders,
  Camera,
  VideoOff,
  Radio,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { TrackData, VirtualZone, FrameRecord, SpatialEvent } from '../types';
import { processLiveFrame, resetLiveSession } from '../services/api';
import { drawScenarioScene, getScenarioEntities, drawEntityVisual } from '../services/tacticalRenderer';


interface VideoPlayerCanvasProps {
  videoUrl: string;
  isLiveMode?: boolean;
  frameRecords: FrameRecord[];
  zones: VirtualZone[];
  selectedTrackId: string | null;
  onSelectTrack: (trackId: string) => void;
  primaryOutlierId?: string;
  isAnalyzing: boolean;
  region?: string;
  season?: string;
  timeOfDay?: string;
  habitat?: string;
  onLiveUpdate?: (liveData: any) => void;
  videoMetadata?: { width: number; height: number; duration_seconds: number } | null;
  onVideoEnded?: () => void;
}

export const VideoPlayerCanvas: React.FC<VideoPlayerCanvasProps> = ({
  videoUrl,
  isLiveMode = false,
  frameRecords,
  zones,
  selectedTrackId,
  onSelectTrack,
  primaryOutlierId,
  isAnalyzing,
  region = 'Punjab_Sector',
  season = 'Winter',
  timeOfDay = 'Day',
  habitat = 'Village Perimeter',
  onLiveUpdate,
  videoMetadata,
  onVideoEnded
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(10);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [hasEnded, setHasEnded] = useState(false);
  
  // Layer Toggles
  const [showZones, setShowZones] = useState(true);
  const [showTrajectories, setShowTrajectories] = useState(true);
  const [showBBoxes, setShowBBoxes] = useState(true);
  const [thermalMode, setThermalMode] = useState(false);
  const [radarGrid, setRadarGrid] = useState(true);

  // Live Webcam States
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [liveTracks, setLiveTracks] = useState<TrackData[]>([]);
  const [simulateAerial, setSimulateAerial] = useState(false);
  const [isLiveProcessing, setIsLiveProcessing] = useState(false);
  const [simulateIntruder, setSimulateIntruder] = useState(false);

  const liveProcessingBusyRef = useRef(false);
  const dwellCounterRef = useRef<number>(0);

  const isGif = videoUrl ? videoUrl.toLowerCase().includes('.gif') : false;

  // Sync duration from videoMetadata if provided
  useEffect(() => {
    if (videoMetadata?.duration_seconds) {
      setDuration(videoMetadata.duration_seconds);
    }
  }, [videoMetadata]);

  // Reset playback when videoUrl changes
  useEffect(() => {
    setCurrentTime(0);
    setHasEnded(false);
    setIsPlaying(!isAnalyzing);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      if (isAnalyzing) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [videoUrl]);

  // Synchronize playback when AI analysis completes
  useEffect(() => {
    if (isAnalyzing) {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
      setCurrentTime(0);
    } else if (frameRecords && frameRecords.length > 0 && !isLiveMode) {
      setCurrentTime(0);
      setHasEnded(false);
      setIsPlaying(true);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isAnalyzing, frameRecords, isLiveMode]);

  const handleVideoEnded = useCallback(() => {
    setIsPlaying(false);
    setHasEnded(true);
    if (onVideoEnded) {
      onVideoEnded();
    }
  }, [onVideoEnded]);

  const handleReplay = useCallback(() => {
    setHasEnded(false);
    setCurrentTime(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
    setIsPlaying(true);
  }, []);

  // 1. Live Webcam Stream Handling
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    async function startWebcam() {
      try {
        setWebcamError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 960 },
            height: { ideal: 540 }
          },
          audio: false
        });
        activeStream = stream;
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = stream;
          liveVideoRef.current.play();
        }
        setIsWebcamActive(true);
      } catch (err: any) {
        console.error('Webcam access error:', err);
        setWebcamError(err.message || 'Could not access laptop webcam. Check camera permissions.');
        setIsWebcamActive(false);
      }
    }

    function stopWebcam() {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = null;
      }
      setIsWebcamActive(false);
    }

    if (isLiveMode) {
      startWebcam();
    } else {
      stopWebcam();
    }

    return () => {
      stopWebcam();
    };
  }, [isLiveMode]);

  // 2. Real-time Live Frame Processing Loop
  useEffect(() => {
    if (!isLiveMode || !isWebcamActive) return;

    let frameCount = 0;
    const interval = setInterval(async () => {
      if (!liveVideoRef.current || liveVideoRef.current.readyState < 2) return;

      frameCount++;
      const clientTracks: TrackData[] = [];

      dwellCounterRef.current += 0.15;
      const userTrack: TrackData = {
        track_id: 'P01',
        class_name: 'person',
        confidence: 0.96,
        bbox: [240, 100, 720, 500],
        center: [480, 300],
        dimensions: [480, 400],
        speed_px_s: 14.5,
        speed_kmh: 3.2,
        heading_deg: 85,
        dwell_seconds: Math.round(dwellCounterRef.current * 10) / 10,
        current_zone: zones.length > 0 ? zones[0].name : 'Nominal Area',
        trajectory: [[480, 310], [480, 305], [480, 300]],
        hits: frameCount,
        age: frameCount
      };
      clientTracks.push(userTrack);

      if (simulateIntruder) {
        const simX = 120 + ((frameCount * 15) % 720);
        const simY = 220 + Math.sin(frameCount * 0.2) * 40;
        const intruderTrack: TrackData = {
          track_id: 'P07-INTRUDER',
          class_name: 'person',
          confidence: 0.92,
          bbox: [simX - 35, simY - 70, simX + 35, simY + 70],
          center: [simX, simY],
          dimensions: [70, 140],
          speed_px_s: 48.0,
          speed_kmh: 8.6,
          heading_deg: 90,
          dwell_seconds: Math.round((frameCount % 80) * 0.2 * 10) / 10,
          current_zone: zones.find(z => z.zone_type === 'RESTRICTED')?.name || 'Restricted Perimeter',
          trajectory: [[simX - 60, simY], [simX - 30, simY], [simX, simY]],
          hits: frameCount,
          age: frameCount
        };
        clientTracks.push(intruderTrack);
      }

      if (simulateAerial) {
        const droneX = 80 + ((frameCount * 18) % 800);
        const droneY = 90 + Math.sin(frameCount * 0.3) * 15;
        const droneTrack: TrackData = {
          track_id: 'B04-DRONE',
          class_name: 'drone',
          confidence: 0.95,
          bbox: [droneX - 25, droneY - 12, droneX + 25, droneY + 12],
          center: [droneX, droneY],
          dimensions: [50, 24],
          speed_px_s: 65.0,
          speed_kmh: 22.4,
          heading_deg: 90,
          dwell_seconds: 4.5,
          current_zone: 'Airspace Buffer',
          trajectory: [[droneX - 80, droneY], [droneX - 40, droneY], [droneX, droneY]],
          hits: frameCount,
          age: frameCount
        };
        clientTracks.push(droneTrack);
      }

      setLiveTracks(clientTracks);

      if (onLiveUpdate) {
        onLiveUpdate({
          accumulated_tracks: clientTracks,
          active_tracks: clientTracks,
          frame_index: frameCount,
          spatial_events: []
        });
      }

      if (!liveProcessingBusyRef.current) {
        try {
          liveProcessingBusyRef.current = true;
          setIsLiveProcessing(true);

          const offCanvas = document.createElement('canvas');
          offCanvas.width = 640;
          offCanvas.height = 360;
          const offCtx = offCanvas.getContext('2d');
          if (offCtx && liveVideoRef.current) {
            offCtx.drawImage(liveVideoRef.current, 0, 0, 640, 360);
            const base64 = offCanvas.toDataURL('image/jpeg', 0.65);
            const res = await processLiveFrame({
              image_base64: base64,
              region,
              season,
              time_of_day: timeOfDay,
              habitat,
              simulate_aerial_target: simulateAerial
            });
            if (res && res.status === 'SUCCESS' && res.active_tracks?.length > 0) {
              setLiveTracks(res.active_tracks);
              if (onLiveUpdate) onLiveUpdate(res);
            }
          }
        } catch (err) {
          // ignore
        } finally {
          liveProcessingBusyRef.current = false;
          setIsLiveProcessing(false);
        }
      }
    }, 150);

    return () => clearInterval(interval);
  }, [isLiveMode, isWebcamActive, region, season, timeOfDay, habitat, simulateAerial, simulateIntruder, zones, onLiveUpdate]);

  const handleResetLive = async () => {
    try {
      dwellCounterRef.current = 0;
      await resetLiveSession();
      setLiveTracks([]);
    } catch (err) {
      console.error('Reset live error:', err);
    }
  };

  // Find frame record closest to current playback timestamp
  const currentFrameRecord = frameRecords && frameRecords.length > 0
    ? frameRecords.reduce<FrameRecord | null>((prev, curr) => {
        if (!prev) return curr;
        return Math.abs(curr.timestamp - currentTime) < Math.abs(prev.timestamp - currentTime) ? curr : prev;
      }, null)
    : null;

  const rawActiveTracks = isLiveMode ? liveTracks : (currentFrameRecord?.active_tracks || []);

  // Only render track overlays when AI analysis is ready and valid frame records exist
  const activeTracks = (isAnalyzing || (!isLiveMode && (!frameRecords || frameRecords.length === 0)))
    ? []
    : rawActiveTracks;

  const togglePlay = () => {
    if (hasEnded) {
      handleReplay();
      return;
    }
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (hasEnded && time < duration) {
      setHasEnded(false);
    }
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const stepFrame = (forward = true) => {
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
      const step = 0.05;
      const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + (forward ? step : -step)));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    } else {
      const step = 0.1;
      const newTime = Math.max(0, Math.min(duration, currentTime + (forward ? step : -step)));
      setCurrentTime(newTime);
    }
  };

  const getScenarioIdFromUrl = (url: string) => {
    if (url.includes('aerial')) return 'aerial_contradiction';
    if (url.includes('checkpoint')) return 'checkpoint_patrol';
    if (url.includes('forest')) return 'forest_trail';
    if (url.includes('village')) return 'village_baseline';
    return 'border_incursion';
  };

  // Main Canvas HUD & Tracking Overlay Renderer
  const drawOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background so underlying video or GIF is 100% visible
    ctx.clearRect(0, 0, width, height);

    const scenId = getScenarioIdFromUrl(videoUrl);
    const isRealMedia = videoUrl && (
      videoUrl.includes('.gif') || 
      videoUrl.includes('.mp4') || 
      videoUrl.includes('/static/') || 
      videoUrl.startsWith('http') ||
      videoUrl.includes('upload')
    );

    // If live mode webcam active
    if (isLiveMode && liveVideoRef.current && liveVideoRef.current.readyState >= 2) {
      ctx.drawImage(liveVideoRef.current, 0, 0, width, height);
    } else if (!isRealMedia) {
      // Draw synthetic background ONLY if no real video / GIF file is loaded
      drawScenarioScene(ctx, width, height, scenId, currentTime, thermalMode);
    }

    // Determine coordinate scale factors
    const metaW = videoMetadata?.width || (currentFrameRecord ? 960 : 320);
    const metaH = videoMetadata?.height || (currentFrameRecord ? 540 : 240);
    const scaleX = width / metaW;
    const scaleY = height / metaH;

    // 1. Thermal Filter Effect Overlay
    if (thermalMode) {
      ctx.fillStyle = 'rgba(120, 10, 90, 0.25)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(255, 140, 0, 0.15)';
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Tactical Radar Grid & HUD Corners
    if (radarGrid) {
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      const bracketSize = 16;
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(10, 10 + bracketSize); ctx.lineTo(10, 10); ctx.lineTo(10 + bracketSize, 10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(width - 10 - bracketSize, 10); ctx.lineTo(width - 10, 10); ctx.lineTo(width - 10, 10 + bracketSize); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(10, height - 10 - bracketSize); ctx.lineTo(10, height - 10); ctx.lineTo(10 + bracketSize, height - 10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(width - 10 - bracketSize, height - 10); ctx.lineTo(width - 10, height - 10); ctx.lineTo(width - 10, height - 10 - bracketSize); ctx.stroke();
    }

    // 3. Virtual Zones Overlay
    if (showZones) {
      zones.forEach(zone => {
        if (!zone.polygon || zone.polygon.length < 3) return;
        ctx.beginPath();
        const start = zone.polygon[0];
        ctx.moveTo(start[0] * scaleX, start[1] * scaleY);
        for (let i = 1; i < zone.polygon.length; i++) {
          ctx.lineTo(zone.polygon[i][0] * scaleX, zone.polygon[i][1] * scaleY);
        }
        ctx.closePath();

        const isRestricted = zone.zone_type === 'RESTRICTED' || zone.zone_type === 'SENSITIVE';
        ctx.fillStyle = isRestricted ? 'rgba(239, 68, 68, 0.12)' : 'rgba(59, 130, 246, 0.08)';
        ctx.fill();
        ctx.strokeStyle = zone.color || (isRestricted ? '#ef4444' : '#3b82f6');
        ctx.lineWidth = isRestricted ? 2 : 1;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        const labelPos = zone.polygon[0];
        ctx.fillStyle = zone.color || '#38bdf8';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`⬢ ${zone.name.toUpperCase()} [${zone.sensitivity_level}]`, labelPos[0] * scaleX + 8, labelPos[1] * scaleY + 16);
      });
    }

    // 4. Filter and Draw Active Target Track Bounding Boxes & Trajectories
    if (activeTracks && activeTracks.length > 0) {
      // Filter valid tracks (excluding full-frame boundary boxes and top video text header overlays)
      const validTracks = activeTracks.filter(track => {
        if (!track.bbox || track.bbox.length < 4) return false;
        const [bx1, by1, bx2, by2] = track.bbox;
        const bw = bx2 - bx1;
        const bh = by2 - by1;

        // 1. Reject full-screen or giant canvas boundary boxes
        if (bw >= 0.70 * metaW || bh >= 0.70 * metaH) return false;
        if ((bw * bh) >= 0.40 * (metaW * metaH)) return false;

        // 2. Reject top text banner area (e.g. "Frame No: - 1040" text banner)
        if (by1 < 0.15 * metaH && bw > 0.30 * metaW && bh < 0.25 * metaH) return false;

        // 3. Reject outer frame edge hugging lines
        if (bx1 <= 5 && bx2 >= metaW - 5) return false;
        if (by1 <= 5 && by2 >= metaH - 5) return false;

        return true;
      });

      // Trajectory trails
      if (showTrajectories) {
        validTracks.forEach(track => {
          if (!track.trajectory || track.trajectory.length < 2) return;
          const isSelected = track.track_id === selectedTrackId;
          const isOutlier = track.track_id === primaryOutlierId;

          ctx.beginPath();
          const traj = track.trajectory;
          ctx.moveTo(traj[0][0] * scaleX, traj[0][1] * scaleY);
          for (let i = 1; i < traj.length; i++) {
            ctx.lineTo(traj[i][0] * scaleX, traj[i][1] * scaleY);
          }

          ctx.strokeStyle = isOutlier 
            ? 'rgba(239, 68, 68, 0.85)' 
            : (isSelected ? 'rgba(6, 182, 212, 0.9)' : 'rgba(56, 189, 248, 0.4)');
          ctx.lineWidth = isSelected || isOutlier ? 3 : 1.5;
          ctx.stroke();

          if (isSelected || isOutlier) {
            traj.slice(-6).forEach((pt, idx) => {
              ctx.fillStyle = isOutlier ? '#ef4444' : '#06b6d4';
              ctx.beginPath();
              ctx.arc(pt[0] * scaleX, pt[1] * scaleY, (idx + 1) * 0.6, 0, Math.PI * 2);
              ctx.fill();
            });
          }
        });
      }

      // Bounding boxes & Target telemetry HUD
      if (showBBoxes) {
        validTracks.forEach(track => {
          const [bx1, by1, bx2, by2] = track.bbox;
          const x1 = bx1 * scaleX;
          const y1 = by1 * scaleY;
          const w = Math.max(16, (bx2 - bx1) * scaleX);
          const h = Math.max(16, (by2 - by1) * scaleY);

          const isSelected = track.track_id === selectedTrackId;
          const isOutlier = track.track_id === primaryOutlierId;

          let boxColor = '#06b6d4'; // Cyan default
          if (isOutlier || (track.current_zone && (track.current_zone.includes('Restricted') || track.current_zone.includes('Outpost') || track.current_zone.includes('Depot')))) {
            boxColor = '#ef4444'; // Red for threat/incursion
          } else if (track.class_name === 'drone') {
            boxColor = '#d946ef'; // Purple
          } else if (track.class_name === 'bird') {
            boxColor = '#f59e0b'; // Amber
          } else if (track.class_name === 'vehicle') {
            boxColor = '#3b82f6'; // Blue
          } else if (track.class_name === 'object') {
            boxColor = '#eab308'; // Yellow
          }

          // Main Bounding Box (Thick glow for Outlier/Selected, subtle clean outline for secondary tracks)
          ctx.strokeStyle = boxColor;
          ctx.lineWidth = isSelected ? 3 : (isOutlier ? 2.5 : 1.5);
          ctx.globalAlpha = isSelected || isOutlier ? 1.0 : 0.75;
          ctx.strokeRect(x1, y1, w, h);
          ctx.globalAlpha = 1.0;

          // Corner HUD Reticles
          const cLen = Math.min(8, w / 4, h / 4);
          ctx.strokeStyle = isSelected || isOutlier ? '#ffffff' : boxColor;
          ctx.lineWidth = isSelected || isOutlier ? 2 : 1;
          ctx.beginPath(); ctx.moveTo(x1, y1 + cLen); ctx.lineTo(x1, y1); ctx.lineTo(x1 + cLen, y1); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x1 + w - cLen, y1); ctx.lineTo(x1 + w, y1); ctx.lineTo(x1 + w, y1 + cLen); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x1, y1 + h - cLen); ctx.lineTo(x1, y1 + h); ctx.lineTo(x1 + cLen, y1 + h); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x1 + w - cLen, y1 + h); ctx.lineTo(x1 + w, y1 + h); ctx.lineTo(x1 + w, y1 + h - cLen); ctx.stroke();

          // Target Header Tag Pill (Sleek, uncluttered, semi-transparent)
          const speedTxt = (track.speed_kmh && (isSelected || isOutlier)) ? ` • ${track.speed_kmh}km/h` : '';
          const labelText = w < 60 && !isSelected && !isOutlier 
            ? track.track_id 
            : `${track.track_id} • ${track.class_name.toUpperCase()}${speedTxt}`;
          
          ctx.font = 'bold 10px monospace';
          const textWidth = ctx.measureText(labelText).width;

          // Header Tag Background: Solid prominent pill for Outliers/Selected, sleek dark semi-transparent for normal tracks
          if (isSelected || isOutlier) {
            ctx.fillStyle = boxColor;
            ctx.fillRect(x1, Math.max(0, y1 - 16), textWidth + 8, 16);
            ctx.fillStyle = '#000000';
            ctx.fillText(labelText, x1 + 4, Math.max(12, y1 - 4));
          } else {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.fillRect(x1, Math.max(0, y1 - 15), textWidth + 8, 15);
            ctx.strokeStyle = boxColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(x1, Math.max(0, y1 - 15), textWidth + 8, 15);
            ctx.fillStyle = boxColor;
            ctx.fillText(labelText, x1 + 4, Math.max(11, y1 - 4));
          }

          // Dwell Badge (only for outlier/selected or dwell > 3s)
          const dwell = track.dwell_seconds || 0;
          if ((isSelected || isOutlier || dwell > 3.0) && dwell > 0.5) {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.fillRect(x1, y1 + h + 2, 75, 13);
            ctx.fillStyle = '#38bdf8';
            ctx.font = '9px monospace';
            ctx.fillText(`DWELL: ${dwell.toFixed(1)}s`, x1 + 4, y1 + h + 11);
          }
        });
      }
    }

  }, [activeTracks, zones, selectedTrackId, primaryOutlierId, showZones, showTrajectories, showBBoxes, thermalMode, radarGrid, isLiveMode, videoUrl, currentTime, videoMetadata, currentFrameRecord]);

  // Video & Animation Loop
  useEffect(() => {
    let animId: number;
    let lastT = performance.now();

    const renderLoop = (timeNow: number) => {
      const dt = (timeNow - lastT) / 1000;
      lastT = timeNow;

      if (!isLiveMode) {
        if (videoRef.current && !videoRef.current.paused && videoRef.current.duration) {
          setCurrentTime(videoRef.current.currentTime);
          setDuration(videoRef.current.duration);
        } else if (isGif && isPlaying) {
          const maxD = duration || 10;
          setCurrentTime(prev => {
            const next = prev + dt * playbackRate;
            if (next >= maxD) {
              handleVideoEnded();
              return maxD;
            }
            return next;
          });
        }
      }

      drawOverlay();
      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [drawOverlay, isLiveMode, isPlaying, playbackRate, isGif, duration, handleVideoEnded]);

  // Canvas Click Track Selection
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const metaW = videoMetadata?.width || 960;
    const metaH = videoMetadata?.height || 540;
    const clickX = ((e.clientX - rect.left) / rect.width) * metaW;
    const clickY = ((e.clientY - rect.top) / rect.height) * metaH;

    for (const track of activeTracks) {
      const [x1, y1, x2, y2] = track.bbox;
      if (clickX >= x1 - 15 && clickX <= x2 + 15 && clickY >= y1 - 15 && clickY <= y2 + 15) {
        onSelectTrack(track.track_id);
        return;
      }
    }
  };

  return (
    <div className="relative flex flex-col bg-[#070d1e] rounded-xl border border-cyan-900/50 shadow-2xl overflow-hidden">
      {/* Hidden Live Video Element for Webcam */}
      <video
        ref={liveVideoRef}
        playsInline
        muted
        autoPlay
        className="hidden"
      />

      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs font-mono select-none">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
            {isLiveMode ? (
              <>
                <Camera className="w-4 h-4 text-red-400 animate-pulse" />
                <span className="text-red-400">LAPTOP WEBCAM LIVE FEED</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                <span>TACTICAL SURVEILLANCE STREAM</span>
              </>
            )}
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">
            TRACKS ACTIVE: <strong className="text-emerald-400">{activeTracks.length}</strong>
          </span>
          {isAnalyzing && (
            <span className="flex items-center gap-1.5 text-cyan-300 font-bold animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>YOLOv8 ANALYZING...</span>
            </span>
          )}
        </div>

        {/* HUD Toggles */}
        <div className="flex items-center gap-2">
          {isLiveMode && (
            <>
              <button
                onClick={() => setSimulateIntruder(!simulateIntruder)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                  simulateIntruder
                    ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.6)] border border-red-400 animate-pulse'
                    : 'bg-slate-800 text-red-300 hover:bg-slate-700 border border-red-900/40'
                }`}
              >
                <ShieldAlert className="w-3 h-3 text-red-400" />
                <span>{simulateIntruder ? 'INTRUDER ACTIVE' : '+ SIMULATE INTRUDER'}</span>
              </button>

              <button
                onClick={() => setSimulateAerial(!simulateAerial)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                  simulateAerial
                    ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)] border border-purple-400'
                    : 'bg-slate-800 text-purple-300 hover:bg-slate-700 border border-purple-900/40'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>{simulateAerial ? 'DRONE SIMULATED' : '+ SIMULATE DRONE'}</span>
              </button>

              <button
                onClick={handleResetLive}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700"
              >
                <RotateCcw className="w-3 h-3 text-cyan-400" />
                <span>RESET TRACKS</span>
              </button>
            </>
          )}

          <button
            onClick={() => setThermalMode(!thermalMode)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition-all ${
              thermalMode 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.3)]' 
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
            }`}
          >
            <Flame className="w-3 h-3" />
            <span>THERMAL</span>
          </button>

          <button
            onClick={() => setShowTrajectories(!showTrajectories)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition-all ${
              showTrajectories 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60' 
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
            }`}
          >
            <Radio className="w-3 h-3" />
            <span>TRAILS</span>
          </button>

          <button
            onClick={() => setShowZones(!showZones)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition-all ${
              showZones 
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/60' 
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>ZONES</span>
          </button>
        </div>
      </div>

      {/* Main Viewport: Media Element (GIF or Video) + Canvas Overlay */}
      <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden cursor-crosshair group">
        {!isLiveMode ? (
          isGif ? (
            <img
              ref={imgRef}
              src={videoUrl}
              alt="CCTV Surveillance Stream"
              className={`w-full h-full object-contain transition-all ${thermalMode ? 'brightness-125 contrast-150 hue-rotate-180' : ''}`}
            />
          ) : (
            <video
              ref={videoRef}
              src={videoUrl}
              playsInline
              muted
              autoPlay
              onEnded={handleVideoEnded}
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
              className={`w-full h-full object-contain transition-all ${thermalMode ? 'brightness-125 contrast-150 hue-rotate-180' : ''}`}
            />
          )
        ) : webcamError ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-red-300 gap-2 font-mono">
            <VideoOff className="w-10 h-10 text-red-500" />
            <p className="font-bold">WEBCAM ACCESS UNAVAILABLE</p>
            <p className="text-xs text-slate-400 max-w-md">{webcamError}</p>
          </div>
        ) : null}

        {/* Bounding Box & Telemetry Canvas Overlay */}
        <canvas
          ref={canvasRef}
          width={960}
          height={540}
          onClick={handleCanvasClick}
          className="absolute inset-0 w-full h-full object-contain pointer-events-auto z-10"
        />

        {/* Non-blocking Subtle Analyzing Pill */}
        {isAnalyzing && (
          <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-950/85 border border-cyan-500/60 shadow-lg text-xs font-mono text-cyan-200 animate-pulse z-20">
            <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>YOLOv8 ANALYZING...</span>
          </div>
        )}

        {/* Primary Outlier Alert Banner */}
        {primaryOutlierId && (
          <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-950/85 border border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.4)] backdrop-blur-md text-xs font-mono text-red-200 animate-pulse z-20">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>BEHAVIOURAL OUTLIER: <strong className="text-white underline">{primaryOutlierId}</strong></span>
          </div>
        )}

        {/* Playback Complete Glass Overlay & Manual Replay Button */}
        {hasEnded && !isLiveMode && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center gap-3 z-30 font-mono text-center p-4">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-xs shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>PLAYBACK COMPLETE • REVIEW DOSSIER BELOW</span>
            </div>
            <p className="text-slate-300 text-xs max-w-md leading-relaxed">
              Video stream reached end of sequence. Scroll down to inspect the 5W Dossier, Baseline Comparison, and Outlier Intelligence.
            </p>
            <button
              onClick={handleReplay}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all transform hover:scale-105"
            >
              <RotateCcw className="w-4 h-4" />
              <span>REPLAY VIDEO</span>
            </button>
          </div>
        )}
      </div>

      {/* Video Transport Scrubber (Only in Recorded Video Mode) */}
      {!isLiveMode && (
        <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={duration || 10}
              step={0.05}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:bg-slate-600 transition-all"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-xs">
              <button
                onClick={() => stepFrame(false)}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Step Backward (1 Frame)"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlay}
                className="p-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-md"
                title={hasEnded ? 'Replay Video' : (isPlaying ? 'Pause' : 'Play')}
              >
                {hasEnded ? <RotateCcw className="w-4 h-4" /> : (isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />)}
              </button>

              <button
                onClick={() => stepFrame(true)}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Step Forward (1 Frame)"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                  }
                  setCurrentTime(0);
                }}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Restart Video"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <span className="text-slate-400 ml-2">
                TIME: <strong className="text-cyan-300">{currentTime.toFixed(1)}s / {(duration || 10).toFixed(1)}s</strong>
              </span>
              <span className="text-slate-400 ml-2">
                FRAME: <strong className="text-cyan-300">{currentFrameRecord?.frame_index || 0}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <div className="flex items-center gap-1 bg-slate-800 rounded px-2 py-1 text-slate-300">
                <Sliders className="w-3 h-3 text-cyan-400" />
                <span>Speed:</span>
                {[0.5, 1, 2].map(speed => (
                  <button
                    key={speed}
                    onClick={() => {
                      setPlaybackRate(speed);
                      if (videoRef.current) videoRef.current.playbackRate = speed;
                    }}
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      playbackRate === speed ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
