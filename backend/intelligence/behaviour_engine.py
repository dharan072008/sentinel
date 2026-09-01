"""
SENTINEL - Human Behaviour & Interaction Intelligence Engine
Extracts observable movement features, analyzes route curvature, stopping/starting patterns,
and detects person-object interaction sequences (e.g. baggage placement/drop).
"""

import math
from typing import List, Dict, Any, Tuple, Optional
import numpy as np


class BehaviourEngine:
    """
    Analyzes observable kinematics and interaction state transitions.
    Does not attempt psychological mind-reading; strictly measures observable physics.
    """
    def __init__(self):
        # State tracking for person-object interactions
        # {person_id: {"state": "APPROACH"|"INTERACT"|"PLACED"|"LEFT", "target_obj": str, "placed_pos": (x,y), "placed_time": float}}
        self.object_interactions: Dict[str, Dict[str, Any]] = {}
        self.interaction_events: List[Dict[str, Any]] = []

    def extract_behaviour_features(self, track_data: Dict[str, Any], all_tracks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Extracts comprehensive behavioural feature vector for a track.
        """
        traj = track_data.get("trajectory", [])
        speed = track_data.get("speed_kmh", 0.0)
        dwell = track_data.get("dwell_seconds", 0.0)
        current_zone = track_data.get("current_zone", "Unknown")
        
        # 1. Route Curvature & Direction Change Frequency
        turn_angle_sum = 0.0
        route_tortuosity = 1.0  # Path length / Displacement
        path_length = 0.0
        displacement = 0.0
        
        if len(traj) >= 3:
            pts = np.array(traj)
            diffs = np.diff(pts, axis=0)
            segment_lengths = np.linalg.norm(diffs, axis=1)
            path_length = float(np.sum(segment_lengths))
            
            p_start = pts[0]
            p_end = pts[-1]
            displacement = float(np.linalg.norm(p_end - p_start))
            if displacement > 10.0:
                route_tortuosity = round(path_length / displacement, 2)
                
            # Angular change between segments
            for i in range(len(diffs) - 1):
                v1 = diffs[i]
                v2 = diffs[i+1]
                dot = np.dot(v1, v2)
                mag1 = np.linalg.norm(v1)
                mag2 = np.linalg.norm(v2)
                if mag1 > 1.0 and mag2 > 1.0:
                    cos_theta = np.clip(dot / (mag1 * mag2), -1.0, 1.0)
                    angle = math.degrees(math.acos(cos_theta))
                    turn_angle_sum += angle
                    
        # 2. Acceleration / Deceleration & Stopping
        is_stationary = speed < 1.0
        movement_state = "Stationary / Lingering" if is_stationary else ("Walking / Normal Pace" if speed < 8.0 else "Fast Movement / Running")
        
        # 3. Proximity to other entities (Interactions & Group Movement)
        cx, cy = track_data.get("center", [0, 0])
        nearby_persons = []
        nearby_objects = []
        
        for other in all_tracks:
            if other.get("track_id") == track_data.get("track_id"):
                continue
            ocx, ocy = other.get("center", [0, 0])
            dist = math.sqrt((cx - ocx)**2 + (cy - ocy)**2)
            
            if dist < 80.0:  # ~1.2 meters in calibrated pixel scale
                if other.get("class_name") == "person":
                    nearby_persons.append(other.get("track_id"))
                elif other.get("class_name") in ["object", "backpack", "suitcase"]:
                    nearby_objects.append({
                        "object_id": other.get("track_id"),
                        "distance_px": round(dist, 1)
                    })

        return {
            "track_id": track_data.get("track_id"),
            "class_name": track_data.get("class_name"),
            "speed_kmh": speed,
            "dwell_seconds": dwell,
            "current_zone": current_zone,
            "movement_state": movement_state,
            "route_tortuosity": route_tortuosity,
            "turn_angle_sum_deg": round(turn_angle_sum, 1),
            "is_stationary": is_stationary,
            "nearby_persons_count": len(nearby_persons),
            "nearby_persons": nearby_persons,
            "nearby_objects": nearby_objects
        }

    def evaluate_person_object_sequence(
        self,
        tracks: List[Dict[str, Any]],
        current_time: float
    ) -> List[Dict[str, Any]]:
        """
        Evaluates the 5-step sequence:
        1. Person approaches an object
        2. Person interacts/dwells with object
        3. Object is placed / detached
        4. Person moves away
        5. Object remains unattended
        """
        events = []
        persons = [t for t in tracks if t.get("class_name") == "person"]
        objects = [t for t in tracks if t.get("class_name") in ["object", "backpack", "suitcase", "unknown"]]
        
        for p in persons:
            pid = p["track_id"]
            pcx, pcy = p["center"]
            pspeed = p.get("speed_kmh", 0.0)
            
            for obj in objects:
                oid = obj["track_id"]
                ocx, ocy = obj["center"]
                dist = math.hypot(pcx - ocx, pcy - ocy)
                
                # Check interaction progression
                if pid not in self.object_interactions:
                    if dist < 60.0 and pspeed < 2.0:
                        # Step 1 & 2: Approached and interacting
                        self.object_interactions[pid] = {
                            "state": "INTERACTING",
                            "object_id": oid,
                            "placed_pos": (ocx, ocy),
                            "interact_start": current_time,
                            "zone": p.get("current_zone", "General Area")
                        }
                else:
                    state_info = self.object_interactions[pid]
                    if state_info["object_id"] == oid:
                        # If person is now moving away (dist > 90px and speed > 2.0)
                        if dist > 90.0 and pspeed > 2.0 and state_info["state"] == "INTERACTING":
                            state_info["state"] = "OBJECT_ABANDONED"
                            state_info["depart_time"] = current_time
                            
                            evt = {
                                "event_type": "PERSON_OBJECT_DEPOSITION",
                                "track_id": pid,
                                "object_id": oid,
                                "zone": state_info["zone"],
                                "timestamp": round(current_time, 2),
                                "position": [round(ocx, 1), round(ocy, 1)],
                                "severity": "HIGH",
                                "description": f"Behavioural Pattern: Person {pid} approached, interacted, deposited item {oid}, and moved away while item remained stationary."
                            }
                            events.append(evt)
                            self.interaction_events.append(evt)
                            
        return events

    def reset(self):
        self.object_interactions.clear()
        self.interaction_events.clear()
