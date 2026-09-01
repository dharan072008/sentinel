"""
SENTINEL - Multi-Sensor & Multi-Engine Evidence Fusion Matrix
Fuses visual, spatial, behavioural, baseline, aerial, thermal, and simulated radar
evidence into a unified explainable evidence score matrix.
"""

from typing import Dict, Any, List, Optional


class EvidenceFusionMatrix:
    """
    Combines weighted signals from all intelligence subsystems while preserving
    the exact individual contribution percentages for explainability.
    """
    WEIGHTS = {
        "spatial_incursion": 0.30,
        "behavioural_anomaly": 0.25,
        "baseline_deviation": 0.20,
        "person_object_sequence": 0.15,
        "sensor_contradiction": 0.10
    }

    def __init__(self):
        pass

    def fuse_evidence(
        self,
        spatial_events: List[Dict[str, Any]],
        behaviour_data: Dict[str, Any],
        baseline_data: Dict[str, Any],
        outlier_data: Optional[Dict[str, Any]],
        interaction_events: List[Dict[str, Any]],
        aerial_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Calculates composite evidence score and per-channel breakdown.
        """
        # 1. Spatial Signal
        has_incursion = any(e.get("event_type") == "RESTRICTED_INCURSION" for e in spatial_events)
        current_zone = behaviour_data.get("current_zone", "General Area")
        if has_incursion or "Restricted" in current_zone or "Outpost" in current_zone:
            spatial_score = 1.0
        elif "Buffer" in current_zone:
            spatial_score = 0.40
        else:
            spatial_score = 0.05
            
        # 2. Behavioural Signal
        speed = behaviour_data.get("speed_kmh", 0.0)
        tortuosity = behaviour_data.get("route_tortuosity", 1.0)
        beh_score = min(1.0, 0.4 * min(1.0, speed / 25.0) + 0.6 * min(1.0, max(0.0, tortuosity - 1.0) / 2.0))
        
        # 3. Baseline Deviation Signal
        base_score = baseline_data.get("composite_deviation_score", 0.10)
        
        # 4. Person-Object Sequence Signal
        has_interaction = len(interaction_events) > 0
        obj_score = 0.90 if has_interaction else 0.0
        
        # 5. Sensor / Aerial Contradiction Signal
        contra_score = 0.0
        if aerial_data and aerial_data.get("has_contradiction"):
            contra_score = 0.95

        # Weighted composite calculation
        composite = (
            self.WEIGHTS["spatial_incursion"] * spatial_score +
            self.WEIGHTS["behavioural_anomaly"] * beh_score +
            self.WEIGHTS["baseline_deviation"] * base_score +
            self.WEIGHTS["person_object_sequence"] * obj_score +
            self.WEIGHTS["sensor_contradiction"] * contra_score
        )
        composite = round(min(1.0, composite), 3)

        evidence_breakdown = [
            {"channel": "Spatial Zone Incursion", "weight_pct": 30, "raw_score": spatial_score, "weighted_contribution": round(30 * spatial_score, 1)},
            {"channel": "Kinematic & Route Anomaly", "weight_pct": 25, "raw_score": round(beh_score, 2), "weighted_contribution": round(25 * beh_score, 1)},
            {"channel": "Behavioural Baseline Deviation", "weight_pct": 20, "raw_score": base_score, "weighted_contribution": round(20 * base_score, 1)},
            {"channel": "Person-Object Sequence", "weight_pct": 15, "raw_score": obj_score, "weighted_contribution": round(15 * obj_score, 1)},
            {"channel": "Sensor / Aerial Contradiction", "weight_pct": 10, "raw_score": contra_score, "weighted_contribution": round(10 * contra_score, 1)}
        ]

        return {
            "composite_evidence_score": composite,
            "evidence_breakdown": evidence_breakdown,
            "has_spatial_incursion": has_incursion,
            "has_object_sequence": has_interaction,
            "has_sensor_contradiction": contra_score > 0.5
        }
