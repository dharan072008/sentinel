"""
SENTINEL - Behavioural Baseline & Context Comparison Engine
Defines what is normal for a particular environment (velocity distribution, expected dwell limits,
standard corridor routes) and computes Low/Medium/High deviation metrics.
"""

from typing import Dict, Any, List, Optional
import numpy as np


class BehaviouralBaseline:
    """
    Holds statistical priors of normal human and vehicular activity per zone and environment.
    """
    def __init__(self, environment: str = "Border Rural / Village"):
        self.environment = environment
        
        # Zone-specific baseline norms: (expected_mean_speed_kmh, speed_std, max_normal_dwell_s, normal_flow_angle)
        self.zone_profiles: Dict[str, Dict[str, Any]] = {
            "Civilian Village Sector": {
                "mean_speed_kmh": 4.5,
                "speed_std_kmh": 1.8,
                "max_normal_dwell_s": 90.0,
                "allowed_stationary": True,
                "typical_activities": ["Walking", "Gathering", "Agricultural transit"]
            },
            "Public Transit Road": {
                "mean_speed_kmh": 22.0,
                "speed_std_kmh": 8.0,
                "max_normal_dwell_s": 15.0,
                "allowed_stationary": False,
                "typical_activities": ["Continuous vehicular flow", "Roadside pedestrian transit"]
            },
            "Agricultural Buffer Zone": {
                "mean_speed_kmh": 3.8,
                "speed_std_kmh": 1.5,
                "max_normal_dwell_s": 60.0,
                "allowed_stationary": True,
                "typical_activities": ["Farming", "Livestock herding"]
            },
            "Restricted Border Fence Line": {
                "mean_speed_kmh": 0.0,
                "speed_std_kmh": 0.5,
                "max_normal_dwell_s": 0.0,
                "allowed_stationary": False,
                "typical_activities": ["Security Patrols only"]
            },
            "Sensitive Outpost / Armory": {
                "mean_speed_kmh": 0.0,
                "speed_std_kmh": 0.5,
                "max_normal_dwell_s": 0.0,
                "allowed_stationary": False,
                "typical_activities": ["Authorized personnel only"]
            },
            "General Area": {
                "mean_speed_kmh": 5.0,
                "speed_std_kmh": 2.5,
                "max_normal_dwell_s": 45.0,
                "allowed_stationary": True,
                "typical_activities": ["General transit"]
            }
        }

    def compare_with_baseline(self, behaviour_features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculates deviation score (0.0 to 1.0) and categorical deviation level (LOW, MEDIUM, HIGH)
        by comparing observed features with the zone baseline.
        """
        zone = behaviour_features.get("current_zone", "General Area")
        profile = self.zone_profiles.get(zone, self.zone_profiles["General Area"])
        
        speed = behaviour_features.get("speed_kmh", 0.0)
        dwell = behaviour_features.get("dwell_seconds", 0.0)
        tortuosity = behaviour_features.get("route_tortuosity", 1.0)
        class_name = behaviour_features.get("class_name", "person")
        
        # 1. Dwell deviation
        max_dwell = profile["max_normal_dwell_s"]
        if max_dwell == 0.0:
            dwell_dev = 1.0 if dwell > 2.0 else 0.0
        else:
            dwell_dev = min(1.0, max(0.0, (dwell - max_dwell) / max(1.0, max_dwell)))
            
        # 2. Speed deviation
        expected_speed = profile["mean_speed_kmh"]
        speed_std = profile["speed_std_kmh"]
        z_speed = abs(speed - expected_speed) / max(0.1, speed_std)
        speed_dev = min(1.0, z_speed / 3.0)  # normalized 3-sigma
        
        # 3. Route / Curvature deviation
        route_dev = min(1.0, max(0.0, (tortuosity - 1.2) / 2.0))
        
        # 4. Zone sensitivity penalty
        zone_penalty = 0.0
        if "Restricted" in zone or "Outpost" in zone:
            zone_penalty = 0.85
        elif "Buffer" in zone:
            zone_penalty = 0.35
            
        # Composite baseline deviation
        composite_score = round(
            0.30 * dwell_dev + 0.20 * speed_dev + 0.20 * route_dev + 0.30 * zone_penalty,
            3
        )
        
        deviation_level = "LOW"
        if composite_score > 0.65:
            deviation_level = "HIGH"
        elif composite_score > 0.35:
            deviation_level = "MEDIUM"
            
        reasons = []
        if dwell_dev > 0.5:
            reasons.append(f"Dwell ({dwell:.0f}s) exceeds normal {zone} threshold ({max_dwell:.0f}s)")
        if speed_dev > 0.6:
            reasons.append(f"Velocity ({speed:.1f} km/h) deviates from zone norm ({expected_speed:.1f} km/h)")
        if route_dev > 0.5:
            reasons.append(f"Erratic route tortuosity ({tortuosity:.2f}) indicates non-linear movement")
        if zone_penalty > 0.5:
            reasons.append(f"Present inside restricted perimeter: '{zone}'")
            
        return {
            "track_id": behaviour_features.get("track_id"),
            "zone": zone,
            "expected_mean_speed": profile["mean_speed_kmh"],
            "observed_speed": speed,
            "max_normal_dwell": max_dwell,
            "observed_dwell": dwell,
            "speed_deviation_score": round(speed_dev, 2),
            "dwell_deviation_score": round(dwell_dev, 2),
            "route_deviation_score": round(route_dev, 2),
            "composite_deviation_score": composite_score,
            "deviation_level": deviation_level,
            "deviation_reasons": reasons
        }
