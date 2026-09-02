"""
SENTINEL - Preset Scenario Catalog
Provides metadata and context initialization for pre-packaged border scenarios.
"""

import os
from typing import Dict, Any, List


class ScenarioCatalog:
    """
    Catalog of ready-to-analyze surveillance scenarios with preset environmental contexts,
    plus dynamically discovered real CCTV footages.
    """
    @staticmethod
    def get_preset_scenarios(video_dir: str) -> List[Dict[str, Any]]:
        scenarios = [
            {
                "id": "border_incursion",
                "title": "Border Sector 4 — Infiltration & Baggage Drop",
                "filename": "border_sector_incursion.mp4",
                "video_url": "/static/videos/border_sector_incursion.mp4",
                "region": "Punjab_Sector",
                "season": "Winter",
                "time_of_day": "Dusk",
                "habitat": "Farmland / Border Fence",
                "description": "Person P07 deviates from standard road corridor, breaches Agricultural Buffer, lingers at Restricted Fence Line, and leaves an unattended object.",
                "expected_threat_level": "CRITICAL_REVIEW",
                "outlier_target": "P07"
            },
            {
                "id": "aerial_contradiction",
                "title": "Aerial Sector 7 — Camouflaged Drone / Bird Ambiguity",
                "filename": "aerial_drone_contradiction.mp4",
                "video_url": "/static/videos/aerial_drone_contradiction.mp4",
                "region": "Thar_Desert_Sector",
                "season": "Summer",
                "time_of_day": "Day",
                "habitat": "Scrubland / Airspace",
                "description": "Aerial target B04 resembles an avian silhouette visually, but exhibits 68°C motor thermal spots and high-frequency rotor micro-Doppler radar harmonics.",
                "expected_threat_level": "HIGH_REVIEW",
                "outlier_target": "B04"
            },
            {
                "id": "village_baseline",
                "title": "Civilian Village Sector — Baseline Nominal Flow",
                "filename": "village_baseline_traffic.mp4",
                "video_url": "/static/videos/village_baseline_traffic.mp4",
                "region": "Punjab_Sector",
                "season": "Winter",
                "time_of_day": "Day",
                "habitat": "Village Perimeter",
                "description": "Standard civilian pedestrian and vehicle flow along village transit roads. Low anomaly score across all population tracks.",
                "expected_threat_level": "LOW_REVIEW",
                "outlier_target": "None"
            },
            {
                "id": "checkpoint_patrol",
                "title": "Night Checkpoint Perimeter — Asset Depot Infiltration",
                "filename": "checkpoint_night_patrol.mp4",
                "video_url": "/static/videos/checkpoint_night_patrol.mp4",
                "region": "Rann_of_Kutch",
                "season": "Monsoon",
                "time_of_day": "Night",
                "habitat": "Coastal Marsh / Outpost",
                "description": "Intruder P09 bypasses vehicle inspection gate and approaches restricted fuel depot during night shift.",
                "expected_threat_level": "CRITICAL_REVIEW",
                "outlier_target": "P09"
            },
            {
                "id": "forest_trail",
                "title": "Dense Forest Trail — High-Velocity Perimeter Crossing",
                "filename": "forest_border_trail.mp4",
                "video_url": "/static/videos/forest_border_trail.mp4",
                "region": "North_East_Sector",
                "season": "Autumn",
                "time_of_day": "Dusk",
                "habitat": "Forest Border",
                "description": "Intruder P14 moves across restricted wildlife corridor at 3.2x normal civilian velocity.",
                "expected_threat_level": "HIGH_REVIEW",
                "outlier_target": "P14"
            }
        ]

        # Scan cctv footages and root videos directory dynamically
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        workspace_dir = os.path.dirname(backend_dir)
        cctv_dir = os.path.join(workspace_dir, "cctv footages")
        root_videos_dir = os.path.join(workspace_dir, "videos")

        already_added_filenames = {s["filename"] for s in scenarios}
        valid_exts = {".gif", ".mp4", ".avi", ".mov", ".mkv", ".webm"}

        for scan_dir, url_prefix, prefix_tag in [
            (cctv_dir, "/static/cctv_footages", "cctv_"),
            (root_videos_dir, "/static/videos_root", "video_")
        ]:
            if os.path.exists(scan_dir):
                for fname in sorted(os.listdir(scan_dir)):
                    if fname in already_added_filenames:
                        continue
                    ext = os.path.splitext(fname)[1].lower()
                    if ext in valid_exts:
                        already_added_filenames.add(fname)
                        base_name = os.path.splitext(fname)[0]
                        scenario_id = f"{prefix_tag}{base_name.lower().replace(' ', '_')}"
                        
                        threat = "CRITICAL_REVIEW" if any(w in base_name.lower() for w in ["burglary", "vandalism", "abuse", "arrest", "attack", "fight", "incursion"]) else "LOW_REVIEW"
                        
                        scenarios.append({
                            "id": scenario_id,
                            "title": f"Video Feed — {base_name.replace('_', ' ').title()}",
                            "filename": fname,
                            "video_url": f"{url_prefix}/{fname}",
                            "region": "Sector_Surveillance",
                            "season": "Winter",
                            "time_of_day": "Night" if "night" in base_name.lower() or threat == "CRITICAL_REVIEW" else "Day",
                            "habitat": "Surveillance Perimeter",
                            "description": f"Surveillance video feed ({fname}). Analyzed by pretrained YOLO object detector & persistent tracker with behavioral baseline evaluation.",
                            "expected_threat_level": threat,
                            "outlier_target": "Auto-Detected",
                            "is_cctv_footage": True
                        })

        return scenarios

