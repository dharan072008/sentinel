"""
SENTINEL - Priority & Threat-Scoring Engine
Maps composite fused evidence into operational review priority levels:
LOW_REVIEW, MEDIUM_REVIEW, HIGH_REVIEW, CRITICAL_REVIEW.
Emphasis: This represents operational analyst triage priority, not automatic guilt or criminal intent.
"""

from typing import Dict, Any


class PriorityEngine:
    """
    Computes human operator triage priority.
    """
    def __init__(self):
        pass

    def compute_priority(self, fusion_result: Dict[str, Any], class_name: str) -> Dict[str, Any]:
        score = fusion_result.get("composite_evidence_score", 0.0)
        has_incursion = fusion_result.get("has_spatial_incursion", False)
        has_contradiction = fusion_result.get("has_sensor_contradiction", False)
        has_object_sequence = fusion_result.get("has_object_sequence", False)

        if score >= 0.70 or (has_incursion and has_object_sequence):
            priority_level = "CRITICAL_REVIEW"
            color = "#EF4444"
            badge = "CRITICAL (Immediate Attention)"
            triage_action = "Dispatch Patrol & Direct CCTV PTZ"
        elif score >= 0.45 or has_incursion or has_contradiction:
            priority_level = "HIGH_REVIEW"
            color = "#F97316"
            badge = "HIGH (Operator Review)"
            triage_action = "Investigate Supporting Sensor Telemetry"
        elif score >= 0.25:
            priority_level = "MEDIUM_REVIEW"
            color = "#FBBF24"
            badge = "MEDIUM (Monitor)"
            triage_action = "Maintain Automated Tracking Log"
        else:
            priority_level = "LOW_REVIEW"
            color = "#10B981"
            badge = "LOW (Baseline Activity)"
            triage_action = "Routine Civilian Flow"

        return {
            "priority_level": priority_level,
            "priority_score": score,
            "badge_label": badge,
            "color_hex": color,
            "recommended_triage_action": triage_action
        }
