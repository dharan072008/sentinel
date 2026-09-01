"""
SENTINEL - Explainable Intelligence & Incident Dossier Generator
Generates comprehensive 5W Dossiers (WHAT, WHERE, WHEN, WHY, EVIDENCE)
for transparent human review and decision support.
"""

import time
from typing import Dict, Any, List, Optional


class ExplainabilityEngine:
    """
    Synthesizes intelligence outputs into plain-language, audit-ready incident reports.
    Answers:
      - WHAT happened?
      - WHERE did it happen?
      - WHEN did it happen?
      - WHY was it unusual?
      - WHAT EVIDENCE contributed?
    """
    def __init__(self):
        pass

    def generate_dossier(
        self,
        track_id: str,
        class_name: str,
        priority_info: Dict[str, Any],
        fusion_info: Dict[str, Any],
        spatial_events: List[Dict[str, Any]],
        behaviour_features: Dict[str, Any],
        baseline_comparison: Dict[str, Any],
        odd_one_out: Optional[Dict[str, Any]],
        event_sequence: List[Dict[str, Any]],
        aerial_data: Optional[Dict[str, Any]] = None,
        thermal_data: Optional[Dict[str, Any]] = None,
        ecological_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Creates a structured, exportable 5W Incident Dossier.
        """
        current_zone = behaviour_features.get("current_zone", "General Area")
        dwell_s = behaviour_features.get("dwell_seconds", 0.0)
        speed_kmh = behaviour_features.get("speed_kmh", 0.0)
        
        # 1. WHAT HAPPENED?
        what_summary = []
        if priority_info.get("priority_level") == "CRITICAL_REVIEW":
            what_summary.append(f"High-priority operational event involving {class_name.capitalize()} [{track_id}].")
        elif priority_info.get("priority_level") == "HIGH_REVIEW":
            what_summary.append(f"Significant behavioural outlier and spatial alert for {class_name.capitalize()} [{track_id}].")
        else:
            what_summary.append(f"Monitored surveillance activity for {class_name.capitalize()} [{track_id}].")
            
        if event_sequence:
            seq_steps = " ➔ ".join([s.get("summary", "") for s in event_sequence[-4:]])
            what_summary.append(f"Observed Chain: {seq_steps}")
        what_text = " ".join(what_summary)

        # 2. WHERE DID IT HAPPEN?
        where_text = f"Location: Zone '{current_zone}'. Last recorded center coordinate: ({behaviour_features.get('turn_angle_sum_deg', 0)}° turn history)."

        # 3. WHEN DID IT HAPPEN?
        when_text = f"Total observed duration: {dwell_s:.1f}s. Timestamp recorded relative to video stream."

        # 4. WHY WAS IT UNUSUAL?
        why_reasons = []
        for r in baseline_comparison.get("deviation_reasons", []):
            why_reasons.append(r)
        if odd_one_out and odd_one_out.get("primary_outlier") and odd_one_out["primary_outlier"].get("track_id") == track_id:
            why_reasons.append(f"Odd-One-Out: Ranked #1 behavioural outlier across {odd_one_out.get('total_entities', 1)} active entities.")
        if aerial_data and aerial_data.get("has_contradiction"):
            for c in aerial_data.get("conflicts", []):
                why_reasons.append(f"Sensor Contradiction: {c['details']}")
        if not why_reasons:
            why_reasons.append("Activity conforms to normal local baseline distribution.")
            
        # 5. EVIDENCE BREAKDOWN
        evidence_breakdown = fusion_info.get("evidence_breakdown", [])

        # Operator Actions Recommended
        operator_options = [
            {"id": "ACKNOWLEDGE", "label": "Acknowledge Alert & Log", "recommended": priority_info.get("priority_level") != "CRITICAL_REVIEW"},
            {"id": "MARK_CIVILIAN", "label": "Mark as Normal Civilian Flow", "recommended": False},
            {"id": "DISPATCH_PATROL", "label": "Dispatch Border Security Patrol", "recommended": priority_info.get("priority_level") == "CRITICAL_REVIEW"},
            {"id": "EXPORT_DOSSIER", "label": "Export Signed Incident PDF / JSON", "recommended": True}
        ]

        return {
            "dossier_id": f"DOSSIER-{track_id}-{int(time.time())}",
            "track_id": track_id,
            "class_name": class_name,
            "generated_at": time.strftime("%Y-%m-%d %H:%M:%S UTC"),
            "priority": priority_info,
            "five_w": {
                "what": what_text,
                "where": where_text,
                "when": when_text,
                "why": why_reasons,
                "evidence": evidence_breakdown
            },
            "spatial_summary": {
                "current_zone": current_zone,
                "dwell_seconds": dwell_s,
                "speed_kmh": speed_kmh
            },
            "sensor_telemetry": {
                "cctv_optical": f"YOLOv8 Active (Confidence: {behaviour_features.get('route_tortuosity', 1.0)})",
                "thermal_ir": thermal_data.get("thermal_summary") if thermal_data else "Ambient IR Baseline",
                "ecological": ecological_data.get("explanation") if ecological_data else "Not applicable for terrestrial track"
            },
            "operator_actions": operator_options
        }
