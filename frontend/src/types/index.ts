export type ObjectClass = 'person' | 'bird' | 'drone' | 'vehicle' | 'animal' | 'object' | 'unknown';

export interface VirtualZone {
  zone_id: string;
  name: string;
  polygon: [number, number][];
  zone_type: 'VILLAGE' | 'ROAD' | 'BUFFER' | 'RESTRICTED' | 'SENSITIVE';
  sensitivity_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  color: string;
  description: string;
}

export interface TrackData {
  track_id: string;
  class_name: ObjectClass;
  confidence: number;
  bbox: [number, number, number, number]; // [x1, y1, x2, y2]
  center: [number, number];
  dimensions: [number, number];
  speed_px_s: number;
  speed_kmh: number;
  heading_deg: number;
  dwell_seconds: number;
  current_zone: string;
  trajectory: [number, number][];
  hits: number;
  age: number;
  interaction_state?: string;
}

export interface SpatialEvent {
  event_type: 'ZONE_TRANSITION' | 'RESTRICTED_INCURSION' | 'BOUNDARY_PROXIMITY';
  track_id: string;
  class_name: string;
  from_zone?: string;
  to_zone?: string;
  zone_name?: string;
  timestamp: number;
  position: [number, number];
  severity: 'INFO' | 'HIGH' | 'CRITICAL';
  description: string;
}

export interface BehaviourFeatures {
  track_id: string;
  class_name: string;
  speed_kmh: number;
  dwell_seconds: number;
  current_zone: string;
  movement_state: string;
  route_tortuosity: number;
  turn_angle_sum_deg: number;
  is_stationary: boolean;
  nearby_persons_count: number;
  nearby_persons: string[];
  nearby_objects: { object_id: string; distance_px: number }[];
}

export interface BaselineComparison {
  track_id: string;
  zone: string;
  expected_mean_speed: number;
  observed_speed: number;
  max_normal_dwell: number;
  observed_dwell: number;
  speed_deviation_score: number;
  dwell_deviation_score: number;
  route_deviation_score: number;
  composite_deviation_score: number;
  deviation_level: 'LOW' | 'MEDIUM' | 'HIGH';
  deviation_reasons: string[];
}

export interface OddOneOutResult {
  total_entities: number;
  normal_count: number;
  moderate_count: number;
  significant_outlier_count: number;
  ranked_entities: {
    track_id: string;
    zone: string;
    score: number;
    z_score: number;
    classification: 'BASELINE_CONFORMANT' | 'MODERATE_DEVIATION' | 'SIGNIFICANT_OUTLIER';
    reasons: string[];
  }[];
  primary_outlier?: {
    track_id: string;
    zone: string;
    score: number;
    z_score: number;
    explanation: string;
    contributing_signals: string[];
  };
}

export interface AerialTelemetry {
  kinematics: {
    track_id: string;
    flight_pattern: string;
    flapping_oscillation_detected: boolean;
    path_linearity_score: number;
    velocity_variance: number;
    preliminary_aerial_type: string;
    confidence: number;
    kinematic_reasons: string[];
  };
  thermal: {
    sensor_label: string;
    is_simulated: boolean;
    thermal_type: string;
    peak_temperature_c: number;
    ambient_reference_c: number;
    delta_t_c: number;
    hotspot_regions: string[];
    sensor_confidence: number;
    thermal_summary: string;
  };
  ecology: {
    species_identified: string;
    wingspan: string;
    flight_style: string;
    species_confidence: number;
    region_match: boolean;
    season_match: boolean;
    time_match: boolean;
    habitat_match: boolean;
    ecological_consistency_score: number;
    verdict: string;
    contradiction_reasons: string[];
    explanation: string;
  };
  contradiction: {
    has_contradiction: boolean;
    conflict_count: number;
    conflicts: { source_a: string; source_b: string; details: string }[];
    final_assessment: string;
    overall_confidence: number;
    recommendation: string;
    radar_sensor_status: {
      sensor_label: string;
      simulated_blade_rpm: number;
      radar_summary: string;
    };
  };
}

export interface ExplainableDossier {
  dossier_id: string;
  track_id: string;
  class_name: string;
  generated_at: string;
  priority: {
    priority_level: 'LOW_REVIEW' | 'MEDIUM_REVIEW' | 'HIGH_REVIEW' | 'CRITICAL_REVIEW';
    priority_score: number;
    badge_label: string;
    color_hex: string;
    recommended_triage_action: string;
  };
  five_w: {
    what: string;
    where: string;
    when: string;
    why: string[];
    evidence: {
      channel: string;
      weight_pct: number;
      raw_score: number;
      weighted_contribution: number;
    }[];
  };
  spatial_summary: {
    current_zone: string;
    dwell_seconds: number;
    speed_kmh: number;
  };
  sensor_telemetry: {
    cctv_optical: string;
    thermal_ir: string;
    ecological: string;
  };
  operator_actions: {
    id: string;
    label: string;
    recommended: boolean;
  }[];
  operator_audit_log?: {
    action_taken: string;
    notes?: string;
    operator_id: string;
    action_timestamp: string;
  };
}

export interface PresetScenario {
  id: string;
  title: string;
  filename: string;
  video_url: string;
  region: string;
  season: string;
  time_of_day: string;
  habitat: string;
  description: string;
  expected_threat_level: string;
  outlier_target: string;
}

export interface FrameRecord {
  frame_index: number;
  timestamp: number;
  detections_count: number;
  active_tracks: TrackData[];
  spatial_events: SpatialEvent[];
}

export interface VideoAnalysisResponse {
  status: string;
  video_metadata: {
    filename: string;
    fps: number;
    total_frames: number;
    width: number;
    height: number;
    duration_seconds: number;
    video_url: string;
  };
  video_url: string;
  total_frames_processed: number;
  total_tracks_identified: number;
  tracks: TrackData[];
  frame_records: FrameRecord[];
  odd_one_out: OddOneOutResult;
  baseline_summary: BaselineComparison[];
  aerial_results: Record<string, AerialTelemetry>;
  spatial_events: SpatialEvent[];
  dossiers: Record<string, ExplainableDossier>;
}
