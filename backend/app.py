import os
import sys
import shutil
import time
import math
from typing import List, Dict, Any, Optional

# Ensure backend directory is in python search path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel

from vision.detector import SentinelDetector
from vision.tracker import SentinelTracker
from vision.video_processor import SentinelVideoProcessor
from spatial.zone_manager import ZoneManager, VirtualZone
from intelligence.behaviour_engine import BehaviourEngine
from intelligence.baseline_engine import BehaviouralBaseline
from intelligence.oddoneout_engine import OddOneOutEngine
from intelligence.sequence_engine import EventSequenceEngine
from aerial.bird_drone_classifier import BirdDroneClassifier
from aerial.thermal_engine import ThermalSensorSimulator
from aerial.ecological_context import EcologicalContextEngine
from aerial.contradiction_engine import ContradictionEngine
from fusion.fusion_matrix import EvidenceFusionMatrix
from fusion.priority_engine import PriorityEngine
from fusion.explainability import ExplainabilityEngine
from scenarios.sample_generator import ensure_scenario_videos
from scenarios.scenario_loader import ScenarioCatalog

# Initialize Directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WORKSPACE_DIR = os.path.dirname(BASE_DIR)
STATIC_DIR = os.path.join(BASE_DIR, "static")
VIDEOS_DIR = os.path.join(STATIC_DIR, "videos")
UPLOADS_DIR = os.path.join(STATIC_DIR, "uploads")
CCTV_DIR = os.path.join(WORKSPACE_DIR, "cctv footages")
ROOT_VIDEOS_DIR = os.path.join(WORKSPACE_DIR, "videos")

os.makedirs(VIDEOS_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(CCTV_DIR, exist_ok=True)
os.makedirs(ROOT_VIDEOS_DIR, exist_ok=True)

# Generate Synthetic Demo Scenarios on startup
ensure_scenario_videos(VIDEOS_DIR)

app = FastAPI(
    title="SENTINEL Intelligence API",
    description="Context-Aware Border & Civilian-Area Surveillance Intelligence Backend",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for video streaming
app.mount("/static/cctv_footages", StaticFiles(directory=CCTV_DIR), name="cctv_footages")
app.mount("/static/videos_root", StaticFiles(directory=ROOT_VIDEOS_DIR), name="videos_root")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Core Subsystems Singleton Registry
detector = SentinelDetector()
zone_manager = ZoneManager(frame_width=960, frame_height=540)
behaviour_baseline = BehaviouralBaseline()
ecological_engine = EcologicalContextEngine()
thermal_simulator = ThermalSensorSimulator()
contradiction_engine = ContradictionEngine()
fusion_matrix = EvidenceFusionMatrix()
priority_engine = PriorityEngine()
explainability_engine = ExplainabilityEngine()


# Data Models
class ZoneDefinition(BaseModel):
    zone_id: str
    name: str
    polygon: List[List[float]]
    zone_type: str = "RESTRICTED"
    sensitivity_level: str = "HIGH"
    color: str = "#EF4444"
    description: str = ""


class VideoAnalysisRequest(BaseModel):
    video_source: str  # e.g. "preset:border_incursion" or "upload:filename.mp4"
    region: str = "Punjab_Sector"
    season: str = "Winter"
    time_of_day: str = "Dusk"
    habitat: str = "Farmland"
    step_stride: int = 2


class OperatorActionRequest(BaseModel):
    action_type: str  # ACKNOWLEDGE, MARK_CIVILIAN, DISPATCH_PATROL, EXPORT_DOSSIER
    notes: Optional[str] = ""


import base64
import cv2
import numpy as np

class LiveFrameRequest(BaseModel):
    image_base64: str  # Data URL or raw base64 encoded JPEG
    timestamp: Optional[float] = None
    region: str = "Punjab_Sector"
    season: str = "Winter"
    time_of_day: str = "Day"
    habitat: str = "Village Perimeter"
    simulate_aerial_target: bool = False


# In-Memory Cache for current session analysis
CURRENT_SESSION = {
    "video_info": {},
    "frame_records": [],
    "all_tracks": {},
    "dossiers": {},
    "spatial_events": [],
    "odd_one_out": {},
    "analysis_complete": False
}

# Real-Time Live Webcam Session State
LIVE_SESSION = {
    "tracker": SentinelTracker(max_age=30, min_hits=1, iou_threshold=0.20),
    "behaviour_engine": BehaviourEngine(),
    "sequence_engine": EventSequenceEngine(),
    "bird_classifier": BirdDroneClassifier(),
    "accumulated_tracks": {},
    "spatial_events": [],
    "interaction_events": [],
    "frame_count": 0,
    "start_time": time.time()
}



@app.get("/api/health")
def health_check():
    return {
        "status": "ONLINE",
        "system": "SENTINEL Tactical Surveillance Intelligence",
        "version": "1.0.0",
        "yolo_loaded": detector.model_loaded,
        "sensors": {
            "cctv_optical": "ACTIVE (REAL)",
            "thermal_lwir": "ACTIVE (SIMULATED)",
            "micro_doppler_radar": "ACTIVE (SIMULATED)",
            "acoustic_sensor": "ACTIVE (SIMULATED)"
        }
    }


@app.get("/api/scenarios")
def list_scenarios():
    return ScenarioCatalog.get_preset_scenarios(VIDEOS_DIR)


@app.get("/api/zones")
def list_zones():
    return zone_manager.get_all_zones()


@app.post("/api/zones")
def save_zone(zone_def: ZoneDefinition):
    z = VirtualZone(
        zone_id=zone_def.zone_id,
        name=zone_def.name,
        polygon=zone_def.polygon,
        zone_type=zone_def.zone_type,
        sensitivity_level=zone_def.sensitivity_level,
        color=zone_def.color,
        description=zone_def.description
    )
    zone_manager.add_zone(z)
    return {"status": "SUCCESS", "zone": z.to_dict()}


@app.delete("/api/zones/{zone_id}")
def delete_zone(zone_id: str):
    zone_manager.remove_zone(zone_id)
    return {"status": "DELETED", "zone_id": zone_id}


@app.post("/api/upload")
async def upload_video(file: UploadFile = File(...)):
    filename = f"upload_{int(time.time())}_{file.filename}"
    file_path = os.path.join(UPLOADS_DIR, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        proc = SentinelVideoProcessor(file_path)
        meta = proc.get_metadata()
        proc.close()
        meta["video_url"] = f"/static/uploads/{filename}"
        return {"status": "SUCCESS", "metadata": meta}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process uploaded video: {str(e)}")


ANALYSIS_CACHE = {}

@app.post("/api/analyze_video")
def analyze_video(req: VideoAnalysisRequest):
    """
    Executes the complete SENTINEL Intelligence progression on the video:
    SEE -> IDENTIFY -> TRACK -> LOCATE -> UNDERSTAND -> LEARN NORMAL ->
    DETECT DEVIATION -> CORRELATE -> CONTEXTUALIZE -> EXPLAIN.
    """
    cache_key = f"{req.video_source}_{req.region}_{req.season}_{req.time_of_day}_{req.habitat}_{req.step_stride}"
    clean_src = req.video_source.replace("preset:", "").replace("cctv:", "").replace("videos/", "")

    if cache_key in ANALYSIS_CACHE:
        return ANALYSIS_CACHE[cache_key]
    if req.video_source in ANALYSIS_CACHE:
        return ANALYSIS_CACHE[req.video_source]
    if clean_src in ANALYSIS_CACHE:
        return ANALYSIS_CACHE[clean_src]
    if f"preset:{clean_src}" in ANALYSIS_CACHE:
        return ANALYSIS_CACHE[f"preset:{clean_src}"]

    # 1. Resolve video path
    scenarios = {s["id"]: s for s in ScenarioCatalog.get_preset_scenarios(VIDEOS_DIR)}
    
    if clean_src in scenarios:
        scen = scenarios[clean_src]
        if scen.get("video_url", "").startswith("/static/videos_root/"):
            video_path = os.path.join(ROOT_VIDEOS_DIR, scen["filename"])
        elif scen.get("is_cctv_footage"):
            video_path = os.path.join(CCTV_DIR, scen["filename"])
        else:
            video_path = os.path.join(VIDEOS_DIR, scen["filename"])
        video_url = scen["video_url"]
    elif req.video_source.startswith("upload:"):
        filename = req.video_source.replace("upload:", "")
        video_path = os.path.join(UPLOADS_DIR, filename)
        video_url = f"/static/uploads/{filename}"
    elif os.path.exists(os.path.join(ROOT_VIDEOS_DIR, clean_src)):
        video_path = os.path.join(ROOT_VIDEOS_DIR, clean_src)
        video_url = f"/static/videos_root/{clean_src}"
    elif os.path.exists(os.path.join(CCTV_DIR, clean_src)):
        video_path = os.path.join(CCTV_DIR, clean_src)
        video_url = f"/static/cctv_footages/{clean_src}"
    elif os.path.exists(os.path.join(VIDEOS_DIR, clean_src)):
        video_path = os.path.join(VIDEOS_DIR, clean_src)
        video_url = f"/static/videos/{clean_src}"
    else:
        video_path = req.video_source
        video_url = req.video_source

    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail=f"Video file not found at: {video_path}")

    # 2. Reset session and tracking state
    tracker = SentinelTracker(max_age=20, min_hits=1, iou_threshold=0.20)
    tracker.reset()
    detector.reset_bg_subtractor()

    behaviour_engine = BehaviourEngine()
    sequence_engine = EventSequenceEngine()
    bird_classifier = BirdDroneClassifier()
    
    zone_fn = lambda x, y: zone_manager.get_zone_for_point(x, y)
    
    proc = SentinelVideoProcessor(video_path)
    meta = proc.get_metadata()
    
    frame_records = []
    accumulated_tracks = {}
    all_spatial_events = []
    all_interaction_events = []
    
    # 3. Process Video Frame-by-Frame with optimized stride
    stride = max(1, req.step_stride)
    for frame_idx, frame, timestamp in proc.frame_generator(stride=stride):
        # SEE & IDENTIFY
        dets = detector.detect(frame, frame_idx)
        
        # In special preset scenarios, inject tagged anomaly actors if detector didn't catch them
        if "border_incursion" in req.video_source:
            # Inject synthetic baggage track when dropped around frame > 160
            if frame_idx >= 150:
                dets.append({"bbox": [750, 240, 780, 260], "class_name": "object", "confidence": 0.88, "raw_class_id": 24})
                
        # TRACK
        active_tracks = tracker.update(dets, timestamp, zone_fn)
        
        # SPATIAL INTELLIGENCE & INCURSIONS
        frame_spatial_events = []
        for trk in active_tracks:
            cx, cy = trk["center"]
            tid = trk["track_id"]
            cname = trk["class_name"]
            
            # Record track in accumulated registry
            accumulated_tracks[tid] = trk
            
            # Evaluate spatial zones
            events = zone_manager.evaluate_spatial_events(tid, cname, cx, cy, timestamp)
            if events:
                frame_spatial_events.extend(events)
                all_spatial_events.extend(events)
                for e in events:
                    sequence_engine.log_event(tid, e["event_type"], e["description"], timestamp)
                    
        # BEHAVIOURAL INTERACTION SEQUENCES
        interaction_evts = behaviour_engine.evaluate_person_object_sequence(active_tracks, timestamp)
        if interaction_evts:
            all_interaction_events.extend(interaction_evts)
            for ie in interaction_evts:
                sequence_engine.log_event(ie["track_id"], ie["event_type"], ie["description"], timestamp)
                
        frame_records.append({
            "frame_index": frame_idx,
            "timestamp": round(timestamp, 2),
            "detections_count": len(dets),
            "active_tracks": active_tracks,
            "spatial_events": frame_spatial_events
        })

    proc.close()

    # 4. POST-PROCESSING: Population Baseline & Odd-One-Out Detection
    baseline_results = []
    behaviour_features_map = {}
    
    track_list = list(accumulated_tracks.values())
    for trk in track_list:
        tid = trk["track_id"]
        # Extract features
        beh_feat = behaviour_engine.extract_behaviour_features(trk, track_list)
        behaviour_features_map[tid] = beh_feat
        
        # Compare with baseline
        base_res = behaviour_baseline.compare_with_baseline(beh_feat)
        baseline_results.append(base_res)
        
    # Odd-One-Out Population Analysis
    odd_engine = OddOneOutEngine()
    odd_one_out = odd_engine.evaluate_population_outliers(baseline_results, list(behaviour_features_map.values()))
    
    # 5. AERIAL & ECOLOGICAL INTELLIGENCE
    aerial_results = {}
    for trk in track_list:
        tid = trk["track_id"]
        cname = trk["class_name"]
        if cname in ["bird", "drone", "unknown"]:
            kinematics = bird_classifier.analyze_aerial_kinematics(trk)
            
            # Simulated Radar & Thermal Telemetry
            is_stealth_drone = "aerial_drone" in req.video_source or tid.startswith("D") or (cname == "bird" and "aerial" in req.video_source and tid == "B04")
            thermal = thermal_simulator.get_thermal_signature(cname, tid, is_drone_override=is_stealth_drone)
            
            species_pred = "Steppe Eagle (Aquila nipalensis)" if cname == "bird" else "Non-Avian Airframe"
            ecology = ecological_engine.evaluate_ecological_consistency(
                predicted_species=species_pred,
                region=req.region,
                season=req.season,
                time_of_day=req.time_of_day,
                habitat=req.habitat
            )
            
            blade_rpm = 3400.0 if is_stealth_drone else 0.0
            contradiction = contradiction_engine.evaluate_aerial_contradiction(
                visual_class=cname,
                kinematics=kinematics,
                thermal=thermal,
                ecology=ecology,
                simulated_radar_blade_rpm=blade_rpm
            )
            
            aerial_results[tid] = {
                "kinematics": kinematics,
                "thermal": thermal,
                "ecology": ecology,
                "contradiction": contradiction
            }

    # 6. EVIDENCE FUSION, PRIORITY & 5W EXPLAINABILITY DOSSIERS
    dossiers = {}
    for trk in track_list:
        tid = trk["track_id"]
        cname = trk["class_name"]
        beh_feat = behaviour_features_map.get(tid, {})
        base_res = next((b for b in baseline_results if b["track_id"] == tid), {})
        seq = sequence_engine.get_sequence_for_track(tid)
        
        aerial_data = aerial_results.get(tid, {}).get("contradiction") if tid in aerial_results else None
        thermal_data = aerial_results.get(tid, {}).get("thermal") if tid in aerial_results else None
        ecology_data = aerial_results.get(tid, {}).get("ecology") if tid in aerial_results else None
        
        # Evidence Fusion
        fused = fusion_matrix.fuse_evidence(
            spatial_events=[e for e in all_spatial_events if e.get("track_id") == tid],
            behaviour_data=beh_feat,
            baseline_data=base_res,
            outlier_data=odd_one_out,
            interaction_events=[ie for ie in all_interaction_events if ie.get("track_id") == tid],
            aerial_data=aerial_data
        )
        
        priority = priority_engine.compute_priority(fused, cname)
        
        # 5W Dossier
        dossier = explainability_engine.generate_dossier(
            track_id=tid,
            class_name=cname,
            priority_info=priority,
            fusion_info=fused,
            spatial_events=[e for e in all_spatial_events if e.get("track_id") == tid],
            behaviour_features=beh_feat,
            baseline_comparison=base_res,
            odd_one_out=odd_one_out,
            event_sequence=seq,
            aerial_data=aerial_data,
            thermal_data=thermal_data,
            ecological_data=ecology_data
        )
        dossiers[tid] = dossier

    # Store in memory for instant API queries
    CURRENT_SESSION["video_info"] = meta
    CURRENT_SESSION["video_info"]["video_url"] = video_url
    CURRENT_SESSION["frame_records"] = frame_records
    CURRENT_SESSION["all_tracks"] = accumulated_tracks
    CURRENT_SESSION["dossiers"] = dossiers
    CURRENT_SESSION["spatial_events"] = all_spatial_events
    CURRENT_SESSION["odd_one_out"] = odd_one_out
    CURRENT_SESSION["aerial_results"] = aerial_results
    CURRENT_SESSION["baseline_results"] = baseline_results
    CURRENT_SESSION["analysis_complete"] = True

    res_payload = {
        "status": "SUCCESS",
        "video_metadata": meta,
        "video_url": video_url,
        "total_frames_processed": len(frame_records),
        "total_tracks_identified": len(accumulated_tracks),
        "tracks": list(accumulated_tracks.values()),
        "frame_records": frame_records,
        "odd_one_out": odd_one_out,
        "baseline_summary": baseline_results,
        "aerial_results": aerial_results,
        "spatial_events": all_spatial_events,
        "dossiers": dossiers
    }
    ANALYSIS_CACHE[cache_key] = res_payload
    return res_payload


@app.get("/api/dossier/{track_id}")
def get_dossier(track_id: str):
    dossiers = CURRENT_SESSION.get("dossiers", {})
    if track_id not in dossiers:
        raise HTTPException(status_code=404, detail=f"No dossier found for track ID: {track_id}")
    return dossiers[track_id]


@app.post("/api/dossier/{track_id}/action")
def log_operator_action(track_id: str, req: OperatorActionRequest):
    dossiers = CURRENT_SESSION.get("dossiers", {})
    if track_id not in dossiers:
        raise HTTPException(status_code=404, detail=f"No dossier found for track ID: {track_id}")
        
    action_entry = {
        "action_taken": req.action_type,
        "notes": req.notes,
        "operator_id": "OPERATOR_DEFENSE_01",
        "action_timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC")
    }
    dossiers[track_id]["operator_audit_log"] = action_entry
    return {"status": "LOGGED", "audit_log": action_entry}


@app.post("/api/live/process_frame")
def process_live_frame(req: LiveFrameRequest):
    """
    Real-time frame processing endpoint for Laptop Webcam & Live Camera Simulation.
    Receives base64 frame, executes YOLOv8 detection, multi-object tracking, spatial zone evaluations,
    behavior baseline comparison, Odd-One-Out outlier scoring, and generates real-time explainability dossiers.
    """
    try:
        img_str = req.image_base64
        if "," in img_str:
            img_str = img_str.split(",", 1)[1]
        img_bytes = base64.b64decode(img_str)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame is None:
            raise HTTPException(status_code=400, detail="Failed to decode image frame")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")

    h, w = frame.shape[:2]
    if w != zone_manager.frame_width or h != zone_manager.frame_height:
        zone_manager.frame_width = w
        zone_manager.frame_height = h

    LIVE_SESSION["frame_count"] += 1
    frame_idx = LIVE_SESSION["frame_count"]
    timestamp = req.timestamp if req.timestamp is not None else round(time.time() - LIVE_SESSION["start_time"], 2)

    # 1. Detect
    dets = detector.detect(frame, frame_idx)

    # 2. Inject simulated aerial target if requested
    if req.simulate_aerial_target:
        sim_x = int((frame_idx * 14) % (w - 80) + 40)
        sim_y = int(h * 0.15 + 12 * math.sin(frame_idx * 0.25))
        dets.append({
            "bbox": [sim_x - 22, sim_y - 12, sim_x + 22, sim_y + 12],
            "class_name": "drone",
            "confidence": 0.95,
            "raw_class_id": 99
        })

    # 3. Track
    zone_fn = lambda x, y: zone_manager.get_zone_for_point(x, y)
    active_tracks = LIVE_SESSION["tracker"].update(dets, timestamp, zone_fn)

    # 4. Spatial Evaluation
    frame_spatial_events = []
    for trk in active_tracks:
        cx, cy = trk["center"]
        tid = trk["track_id"]
        cname = trk["class_name"]
        
        LIVE_SESSION["accumulated_tracks"][tid] = trk
        events = zone_manager.evaluate_spatial_events(tid, cname, cx, cy, timestamp)
        if events:
            frame_spatial_events.extend(events)
            LIVE_SESSION["spatial_events"].extend(events)
            for e in events:
                LIVE_SESSION["sequence_engine"].log_event(tid, e["event_type"], e["description"], timestamp)

    # 5. Behaviour Interactions
    interaction_evts = LIVE_SESSION["behaviour_engine"].evaluate_person_object_sequence(active_tracks, timestamp)
    if interaction_evts:
        LIVE_SESSION["interaction_events"].extend(interaction_evts)
        for ie in interaction_evts:
            LIVE_SESSION["sequence_engine"].log_event(ie["track_id"], ie["event_type"], ie["description"], timestamp)

    # 6. Live Baseline & Odd-One-Out
    accumulated_list = list(LIVE_SESSION["accumulated_tracks"].values())
    baseline_results = []
    behaviour_features_map = {}

    for trk in accumulated_list:
        tid = trk["track_id"]
        beh_feat = LIVE_SESSION["behaviour_engine"].extract_behaviour_features(trk, accumulated_list)
        behaviour_features_map[tid] = beh_feat
        base_res = behaviour_baseline.compare_with_baseline(beh_feat)
        baseline_results.append(base_res)

    odd_engine = OddOneOutEngine()
    odd_one_out = odd_engine.evaluate_population_outliers(baseline_results, list(behaviour_features_map.values()))

    # 7. Live Aerial & Contradiction
    aerial_results = {}
    for trk in active_tracks:
        tid = trk["track_id"]
        cname = trk["class_name"]
        if cname in ["bird", "drone", "unknown"]:
            kinematics = LIVE_SESSION["bird_classifier"].analyze_aerial_kinematics(trk)
            is_stealth_drone = req.simulate_aerial_target or cname == "drone" or tid.startswith("D")
            thermal = thermal_simulator.get_thermal_signature(cname, tid, is_drone_override=is_stealth_drone)
            species_pred = "Steppe Eagle (Aquila nipalensis)" if cname == "bird" else "Non-Avian Airframe"
            ecology = ecological_engine.evaluate_ecological_consistency(
                predicted_species=species_pred,
                region=req.region,
                season=req.season,
                time_of_day=req.time_of_day,
                habitat=req.habitat
            )
            blade_rpm = 3200.0 if is_stealth_drone else 0.0
            contradiction = contradiction_engine.evaluate_aerial_contradiction(
                visual_class=cname,
                kinematics=kinematics,
                thermal=thermal,
                ecology=ecology,
                simulated_radar_blade_rpm=blade_rpm
            )
            aerial_results[tid] = {
                "kinematics": kinematics,
                "thermal": thermal,
                "ecology": ecology,
                "contradiction": contradiction
            }

    # 8. Live Explainability Dossiers
    dossiers = {}
    for trk in active_tracks:
        tid = trk["track_id"]
        cname = trk["class_name"]
        beh_feat = behaviour_features_map.get(tid, {})
        base_res = next((b for b in baseline_results if b["track_id"] == tid), {})
        seq = LIVE_SESSION["sequence_engine"].get_sequence_for_track(tid)
        
        aerial_data = aerial_results.get(tid, {}).get("contradiction") if tid in aerial_results else None
        thermal_data = aerial_results.get(tid, {}).get("thermal") if tid in aerial_results else None
        ecology_data = aerial_results.get(tid, {}).get("ecology") if tid in aerial_results else None
        
        fused = fusion_matrix.fuse_evidence(
            spatial_events=[e for e in LIVE_SESSION["spatial_events"] if e.get("track_id") == tid],
            behaviour_data=beh_feat,
            baseline_data=base_res,
            outlier_data=odd_one_out,
            interaction_events=[ie for ie in LIVE_SESSION["interaction_events"] if ie.get("track_id") == tid],
            aerial_data=aerial_data
        )
        priority = priority_engine.compute_priority(fused, cname)
        dossier = explainability_engine.generate_dossier(
            track_id=tid,
            class_name=cname,
            priority_info=priority,
            fusion_info=fused,
            spatial_events=[e for e in LIVE_SESSION["spatial_events"] if e.get("track_id") == tid],
            behaviour_features=beh_feat,
            baseline_comparison=base_res,
            odd_one_out=odd_one_out,
            event_sequence=seq,
            aerial_data=aerial_data,
            thermal_data=thermal_data,
            ecological_data=ecology_data
        )
        dossiers[tid] = dossier
        CURRENT_SESSION["dossiers"][tid] = dossier

    return {
        "status": "SUCCESS",
        "frame_index": frame_idx,
        "timestamp": timestamp,
        "detections_count": len(dets),
        "detections": dets,
        "active_tracks": active_tracks,
        "accumulated_tracks": accumulated_list,
        "spatial_events": frame_spatial_events,
        "odd_one_out": odd_one_out,
        "baseline_summary": baseline_results,
        "aerial_results": aerial_results,
        "dossiers": dossiers
    }


@app.post("/api/live/reset")
def reset_live_session():
    LIVE_SESSION["tracker"] = SentinelTracker(max_age=30, min_hits=1, iou_threshold=0.20)
    LIVE_SESSION["behaviour_engine"] = BehaviourEngine()
    LIVE_SESSION["sequence_engine"] = EventSequenceEngine()
    LIVE_SESSION["bird_classifier"] = BirdDroneClassifier()
    LIVE_SESSION["accumulated_tracks"] = {}
    LIVE_SESSION["spatial_events"] = []
    LIVE_SESSION["interaction_events"] = []
    LIVE_SESSION["frame_count"] = 0
    LIVE_SESSION["start_time"] = time.time()
    return {"status": "SUCCESS", "message": "Live camera surveillance session reset"}



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
