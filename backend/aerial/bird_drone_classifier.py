"""
SENTINEL - Bird vs Drone Kinematics & Aerial Classifier
Analyzes aerial flight paths, velocity oscillations (wing flapping vs rotor propulsion),
altitude stability, and aerodynamic linearity.
"""

import math
from typing import List, Dict, Any, Tuple
import numpy as np


class BirdDroneClassifier:
    """
    Distinguishes biological bird flight (periodic velocity modulation, curved gliding, thermal soaring)
    from unmanned aerial vehicles / quadcopters (rigid linear vectors, instantaneous yaw, high constant velocity).
    """
    def __init__(self):
        pass

    def analyze_aerial_kinematics(self, track_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extracts aerial kinematics features from the track trajectory.
        """
        traj = track_data.get("trajectory", [])
        speed = track_data.get("speed_kmh", 0.0)
        
        # Default aerial profile
        if len(traj) < 5:
            return {
                "track_id": track_data.get("track_id"),
                "flight_pattern": "Indeterminate / Insufficient trajectory points",
                "flapping_oscillation_detected": False,
                "path_linearity_score": 0.5,
                "velocity_variance": 0.0,
                "preliminary_aerial_type": "UNKNOWN_AERIAL",
                "confidence": 0.50
            }

        pts = np.array(traj)
        diffs = np.diff(pts, axis=0)
        step_speeds = np.linalg.norm(diffs, axis=1)
        
        # 1. Velocity modulation variance (Flapping birds exhibit cyclic velocity peaks)
        vel_var = float(np.var(step_speeds))
        vel_mean = float(np.mean(step_speeds)) if len(step_speeds) > 0 else 1.0
        norm_var = vel_var / max(0.1, vel_mean)
        
        # 2. Path linearity / Heading jitter
        p_start = pts[0]
        p_end = pts[-1]
        displacement = np.linalg.norm(p_end - p_start)
        path_length = np.sum(step_speeds)
        linearity = round(float(displacement / max(1.0, path_length)), 2)
        
        # Classification heuristics
        is_drone_like = False
        reasons = []
        
        if linearity > 0.92 and norm_var < 0.25 and speed > 25.0:
            is_drone_like = True
            reasons.append("High path linearity (>0.92) with near-zero velocity variance (Rotor propulsion signature)")
        elif norm_var > 0.8:
            reasons.append("Cyclic velocity oscillation detected (Biomechanical wing flapping signature)")
        else:
            reasons.append("Thermal soaring / standard gliding pattern")

        preliminary_type = "DRONE_SUSPECT" if is_drone_like else "BIRD_SUSPECT"
        confidence = 0.85 if is_drone_like else 0.78
        
        return {
            "track_id": track_data.get("track_id"),
            "flight_pattern": "Linear Quadcopter Transit" if is_drone_like else "Biological Avian Flight",
            "flapping_oscillation_detected": norm_var > 0.8,
            "path_linearity_score": linearity,
            "velocity_variance": round(vel_var, 2),
            "preliminary_aerial_type": preliminary_type,
            "confidence": confidence,
            "kinematic_reasons": reasons
        }
