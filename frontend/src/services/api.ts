import {
  PresetScenario,
  VirtualZone,
  VideoAnalysisResponse,
  ExplainableDossier
} from '../types';

const API_BASE = '';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchScenarios(): Promise<PresetScenario[]> {
  const res = await fetch(`${API_BASE}/api/scenarios`);
  if (!res.ok) throw new Error('Failed to fetch preset scenarios');
  return res.json();
}

export async function fetchZones(): Promise<VirtualZone[]> {
  const res = await fetch(`${API_BASE}/api/zones`);
  if (!res.ok) throw new Error('Failed to fetch virtual zones');
  return res.json();
}

export async function saveZone(zone: VirtualZone): Promise<VirtualZone> {
  const res = await fetch(`${API_BASE}/api/zones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(zone)
  });
  if (!res.ok) throw new Error('Failed to save virtual zone');
  const data = await res.json();
  return data.zone;
}

export async function deleteZone(zoneId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/zones/${zoneId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete virtual zone');
}

export async function uploadVideo(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Failed to upload video');
  return res.json();
}

export async function analyzeVideo(
  videoSource: string,
  context: {
    region: string;
    season: string;
    time_of_day: string;
    habitat: string;
    step_stride?: number;
  }
): Promise<VideoAnalysisResponse> {
  const res = await fetch(`${API_BASE}/api/analyze_video`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      video_source: videoSource,
      ...context,
      step_stride: context.step_stride || 2
    })
  });
  if (!res.ok) throw new Error('Failed to analyze video');
  return res.json();
}

export async function fetchDossier(trackId: string): Promise<ExplainableDossier> {
  const res = await fetch(`${API_BASE}/api/dossier/${trackId}`);
  if (!res.ok) throw new Error(`Failed to fetch dossier for ${trackId}`);
  return res.json();
}

export async function logOperatorAction(
  trackId: string,
  actionType: string,
  notes?: string
) {
  const res = await fetch(`${API_BASE}/api/dossier/${trackId}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action_type: actionType, notes: notes || '' })
  });
  if (!res.ok) throw new Error('Failed to log operator action');
  return res.json();
}

export interface LiveFramePayload {
  image_base64: string;
  timestamp?: number;
  region: string;
  season: string;
  time_of_day: string;
  habitat: string;
  simulate_aerial_target?: boolean;
}

export async function processLiveFrame(payload: LiveFramePayload) {
  const res = await fetch(`${API_BASE}/api/live/process_frame`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to process live frame');
  return res.json();
}

export async function resetLiveSession() {
  const res = await fetch(`${API_BASE}/api/live/reset`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to reset live session');
  return res.json();
}

