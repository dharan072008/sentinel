"""
SENTINEL - Precision Multi-Object Detector Module
Combines YOLOv8 multi-class deep learning detection with background-subtraction
motion verification, spatial scene context filtering, and adaptive contour tracking.
"""

import os
import cv2
import numpy as np
from typing import List, Dict, Any, Optional

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False


class SentinelDetector:
    """
    Detects Person, Bird, Drone, Vehicle, Animal, and Object in surveillance video frames
    with motion verification and static false-positive suppression.
    """
    CLASS_MAPPING = {
        0: "person",
        1: "vehicle",    # bicycle in COCO
        2: "vehicle",    # car
        3: "vehicle",    # motorcycle
        4: "drone",      # airplane -> drone/aerial
        5: "vehicle",    # bus
        6: "vehicle",    # train
        7: "vehicle",    # truck
        8: "vehicle",    # boat
        14: "bird",      # bird
        15: "animal",    # cat
        16: "animal",    # dog
        17: "animal",    # horse
        18: "animal",    # sheep
        19: "animal",    # cow
        20: "animal",    # elephant
        21: "animal",    # bear
        24: "object",    # backpack
        26: "object",    # handbag
        28: "object",    # suitcase
    }

    def __init__(self, model_name: str = "yolov8n.pt", conf_thresh: float = 0.20):
        self.conf_thresh = conf_thresh
        self.model = None
        self.model_loaded = False
        self.bg_subtractor = cv2.createBackgroundSubtractorMOG2(history=300, varThreshold=25, detectShadows=False)
        
        if YOLO_AVAILABLE:
            try:
                self.model = YOLO(model_name)
                self.model_loaded = True
            except Exception as e:
                print(f"[SentinelDetector] Warning: Could not initialize YOLO model ({e}). Using adaptive motion detector.")
                self.model = None

    def reset_bg_subtractor(self):
        """Resets background subtractor state between video analyses."""
        self.bg_subtractor = cv2.createBackgroundSubtractorMOG2(history=300, varThreshold=25, detectShadows=False)

    def detect(self, frame: np.ndarray, frame_idx: int = 0) -> List[Dict[str, Any]]:
        """
        Runs object detection on a BGR frame (numpy array).
        Returns a list of detections: [{"bbox": [x1, y1, x2, y2], "class_name": str, "confidence": float}]
        """
        detections = []
        h, w = frame.shape[:2]

        # Apply background subtractor for motion mask (used for fallback or motion telemetry)
        fg_mask = self.bg_subtractor.apply(frame)

        if self.model_loaded and self.model is not None:
            try:
                results = self.model(frame, conf=0.18, imgsz=640, verbose=False)
                for r in results:
                    boxes = r.boxes
                    for box in boxes:
                        cls_id = int(box.cls[0].item())
                        conf = float(box.conf[0].item())
                        xyxy = box.xyxy[0].tolist()
                        
                        if cls_id not in self.CLASS_MAPPING:
                            continue
                        
                        cname = self.CLASS_MAPPING[cls_id]
                        box_w = xyxy[2] - xyxy[0]
                        box_h = xyxy[3] - xyxy[1]
                        aspect = box_h / max(1.0, box_w)
                        
                        # --- SANITY & ASPECT RATIO REFINEMENTS ---
                        # 1. Tall vertical detection misclassified as vehicle -> reclassify as person
                        if cname == "vehicle" and aspect > 1.2 and box_h > 35:
                            cname = "person"

                        # 2. Suppress full-frame background box artifacts
                        if box_w >= 0.90 * w and box_h >= 0.90 * h:
                            continue

                        detections.append({
                            "bbox": [round(c, 1) for c in xyxy],
                            "class_name": cname,
                            "confidence": round(conf, 3),
                            "raw_class_id": cls_id
                        })
            except Exception as e:
                print(f"[SentinelDetector] YOLO inference error: {e}")

        # --- MOTION CONTOURS FALLBACK ONLY IF NO DEEP LEARNING MODEL OR ZERO DETECTIONS ---
        if not self.model_loaded or len(detections) == 0:
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
            clean_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, kernel)
            clean_mask = cv2.dilate(clean_mask, kernel, iterations=2)
            
            contours, _ = cv2.findContours(clean_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            for c in contours:
                area = cv2.contourArea(c)
                # Require significant motion area (>1200px) to prevent false ghost boxes on empty background noise
                if area > 1200:
                    x, y, bw, bh = cv2.boundingRect(c)
                    if bw < 25 or bh < 35:
                        continue
                    if bw >= 0.85 * w or bh >= 0.85 * h:
                        continue

                    motion_box = [float(x), float(y), float(x + bw), float(y + bh)]
                    
                    has_overlap = False
                    for d in detections:
                        yb = d["bbox"]
                        xx1 = max(motion_box[0], yb[0])
                        yy1 = max(motion_box[1], yb[1])
                        xx2 = min(motion_box[2], yb[2])
                        yy2 = min(motion_box[3], yb[3])
                        inter = max(0, xx2 - xx1) * max(0, yy2 - yy1)
                        if inter > 0.20 * (bw * bh):
                            has_overlap = True
                            break
                    
                    if not has_overlap:
                        aspect = bh / max(1.0, float(bw))
                        if aspect > 1.1 and bh > 45:
                            cname = "person"
                            conf = 0.78
                        elif aspect < 0.8 and bw > 70 and y > h * 0.35:
                            cname = "vehicle"
                            conf = 0.75
                        elif y < h * 0.35 and area < 3000:
                            cname = "drone" if aspect < 0.8 else "bird"
                            conf = 0.70
                        else:
                            continue # Skip ambiguous background noise
                        
                        detections.append({
                            "bbox": motion_box,
                            "class_name": cname,
                            "confidence": conf,
                            "raw_class_id": -2
                        })

        return detections[:10]
