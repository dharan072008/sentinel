"""
SENTINEL - Multi-Object Tracker (Kalman Filter + IoU / ByteTrack Paradigm)
Maintains persistent track IDs, computes instantaneous velocity, trajectory points,
dwell time, and kinematic statistics.
"""

import math
import time
from typing import List, Dict, Any, Tuple, Optional
import numpy as np


class KalmanBoxTracker:
    """
    Simple 2D Bounding Box Kalman Filter for tracking position (x, y, w, h, dx, dy, dw, dh).
    """
    count = 0

    def __init__(self, bbox: List[float], class_name: str, confidence: float):
        # bbox: [x1, y1, x2, y2]
        self.bbox = [float(c) for c in bbox]
        self.class_name = class_name
        self.confidence = float(confidence)
        
        # ID prefix based on class
        prefix = "P" if class_name == "person" else ("B" if class_name == "bird" else ("D" if class_name == "drone" else ("V" if class_name == "vehicle" else "U")))
        KalmanBoxTracker.count += 1
        self.id_num = KalmanBoxTracker.count
        self.track_id = f"{prefix}{self.id_num:02d}"
        
        self.history: List[Tuple[float, float, float]] = []  # (center_x, center_y, timestamp)
        self.hits = 1
        self.age = 0
        self.time_since_update = 0
        self.first_seen = time.time()
        self.last_seen = self.first_seen
        
        # Kinematics
        self.velocity = (0.0, 0.0)  # px/s
        self.speed = 0.0  # px/s
        self.speed_kmh = 0.0  # estimated km/h
        self.heading_deg = 0.0
        self.dwell_seconds = 0.0
        self.current_zone = "Unknown"
        self.zone_history: List[Dict[str, Any]] = []
        self.interaction_state = "None"
        
        cx = (self.bbox[0] + self.bbox[2]) / 2.0
        cy = (self.bbox[1] + self.bbox[3]) / 2.0
        self.history.append((cx, cy, 0.0))

    def update(self, bbox: List[float], confidence: float, current_time: float, zone: str = "Unknown"):
        self.time_since_update = 0
        self.hits += 1
        self.confidence = confidence
        self.last_seen = current_time
        self.dwell_seconds = max(0.0, current_time - self.first_seen)
        
        old_cx = (self.bbox[0] + self.bbox[2]) / 2.0
        old_cy = (self.bbox[1] + self.bbox[3]) / 2.0
        
        # Exponential smoothing for bbox
        alpha = 0.75
        self.bbox = [
            alpha * bbox[0] + (1 - alpha) * self.bbox[0],
            alpha * bbox[1] + (1 - alpha) * self.bbox[1],
            alpha * bbox[2] + (1 - alpha) * self.bbox[2],
            alpha * bbox[3] + (1 - alpha) * self.bbox[3]
        ]
        
        new_cx = (self.bbox[0] + self.bbox[2]) / 2.0
        new_cy = (self.bbox[1] + self.bbox[3]) / 2.0
        
        dt = 0.033  # Approx 30fps default frame interval if not given
        if len(self.history) >= 1:
            last_cx, last_cy, last_t = self.history[-1]
            dt = max(0.001, current_time - last_t) if last_t > 0 else 0.033
            
            dx = (new_cx - last_cx) / dt
            dy = (new_cy - last_cy) / dt
            self.velocity = (dx, dy)
            self.speed = math.sqrt(dx * dx + dy * dy)
            
            # Calibration factor: 100px ~= 1.5m -> 1px = 0.015m -> px/s * 0.015 * 3.6 = km/h
            self.speed_kmh = round(self.speed * 0.015 * 3.6, 1)
            
            if self.speed > 2.0:
                rad = math.atan2(dy, dx)
                self.heading_deg = (math.degrees(rad) + 360) % 360
        
        self.history.append((round(new_cx, 1), round(new_cy, 1), round(current_time, 3)))
        if len(self.history) > 150:
            self.history.pop(0)
            
        # Update zone
        if self.current_zone != zone:
            if self.current_zone != "Unknown":
                self.zone_history.append({
                    "zone": self.current_zone,
                    "exited_at": current_time
                })
            self.current_zone = zone
            self.zone_history.append({
                "zone": zone,
                "entered_at": current_time
            })

    def to_dict(self) -> Dict[str, Any]:
        cx = (self.bbox[0] + self.bbox[2]) / 2.0
        cy = (self.bbox[1] + self.bbox[3]) / 2.0
        w = self.bbox[2] - self.bbox[0]
        h = self.bbox[3] - self.bbox[1]
        
        return {
            "track_id": self.track_id,
            "class_name": self.class_name,
            "confidence": round(self.confidence, 3),
            "bbox": [round(c, 1) for c in self.bbox],
            "center": [round(cx, 1), round(cy, 1)],
            "dimensions": [round(w, 1), round(h, 1)],
            "speed_px_s": round(self.speed, 1),
            "speed_kmh": self.speed_kmh,
            "heading_deg": round(self.heading_deg, 1),
            "dwell_seconds": round(self.dwell_seconds, 1),
            "current_zone": self.current_zone,
            "trajectory": [[p[0], p[1]] for p in self.history[-40:]],
            "hits": self.hits,
            "age": self.age,
            "interaction_state": self.interaction_state
        }


def iou(bb_test: List[float], bb_gt: List[float]) -> float:
    """Calculates Intersection Over Union between two boxes [x1, y1, x2, y2]."""
    xx1 = max(bb_test[0], bb_gt[0])
    yy1 = max(bb_test[1], bb_gt[1])
    xx2 = min(bb_test[2], bb_gt[2])
    yy2 = min(bb_test[3], bb_gt[3])
    
    w = max(0.0, xx2 - xx1)
    h = max(0.0, yy2 - yy1)
    inter = w * h
    
    area_a = (bb_test[2] - bb_test[0]) * (bb_test[3] - bb_test[1])
    area_b = (bb_gt[2] - bb_gt[0]) * (bb_gt[3] - bb_gt[1])
    union = area_a + area_b - inter
    if union <= 0:
        return 0.0
    return inter / union


class SentinelTracker:
    """
    Maintains active track registry, associates detections via IoU matching,
    and removes stale tracks.
    """
    def __init__(self, max_age: int = 15, min_hits: int = 2, iou_threshold: float = 0.25):
        self.max_age = max_age
        self.min_hits = min_hits
        self.iou_threshold = iou_threshold
        self.trackers: List[KalmanBoxTracker] = []
        self.frame_count = 0

    def update(self, detections: List[Dict[str, Any]], current_time: float, zone_fn = None) -> List[Dict[str, Any]]:
        """
        detections: List of dicts with {"bbox": [x1,y1,x2,y2], "class_name": str, "confidence": float}
        zone_fn: function(center_x, center_y) -> zone_name (str)
        """
        self.frame_count += 1
        
        # Match detections to existing trackers
        num_trackers = len(self.trackers)
        num_dets = len(detections)
        
        iou_matrix = np.zeros((num_dets, num_trackers), dtype=np.float32)
        for d, det in enumerate(detections):
            for t, trk in enumerate(self.trackers):
                # Only match if same class or compatible
                if det["class_name"] == trk.class_name or (det["class_name"] in ["bird", "drone"] and trk.class_name in ["bird", "drone"]):
                    iou_matrix[d, t] = iou(det["bbox"], trk.bbox)
                else:
                    iou_matrix[d, t] = 0.0
        
        # Greedy assignment
        matched_dets = set()
        matched_trks = set()
        
        if num_dets > 0 and num_trackers > 0:
            while True:
                max_val = np.max(iou_matrix)
                if max_val < self.iou_threshold:
                    break
                d, t = np.unravel_index(np.argmax(iou_matrix), iou_matrix.shape)
                if d in matched_dets or t in matched_trks:
                    iou_matrix[d, t] = 0.0
                    continue
                
                matched_dets.add(d)
                matched_trks.add(t)
                det = detections[d]
                trk = self.trackers[t]
                
                cx = (det["bbox"][0] + det["bbox"][2]) / 2.0
                cy = (det["bbox"][1] + det["bbox"][3]) / 2.0
                zone = zone_fn(cx, cy) if zone_fn else "General"
                
                trk.update(det["bbox"], det["confidence"], current_time, zone)
                iou_matrix[d, :] = 0.0
                iou_matrix[:, t] = 0.0
        
        # Create new trackers for unmatched detections
        for d in range(num_dets):
            if d not in matched_dets:
                det = detections[d]
                cx = (det["bbox"][0] + det["bbox"][2]) / 2.0
                cy = (det["bbox"][1] + det["bbox"][3]) / 2.0
                zone = zone_fn(cx, cy) if zone_fn else "General"
                
                new_trk = KalmanBoxTracker(det["bbox"], det["class_name"], det["confidence"])
                new_trk.update(det["bbox"], det["confidence"], current_time, zone)
                self.trackers.append(new_trk)
        
        # Update un-matched trackers & remove dead tracks
        active_tracks = []
        for t, trk in enumerate(self.trackers):
            if t not in matched_trks:
                trk.time_since_update += 1
                trk.age += 1
            if trk.time_since_update <= self.max_age:
                active_tracks.append(trk)
                
        self.trackers = active_tracks
        
        # Return serializable track records
        results = [trk.to_dict() for trk in self.trackers if trk.hits >= 1]
        return results

    def reset(self):
        self.trackers = []
        KalmanBoxTracker.count = 0
        self.frame_count = 0
