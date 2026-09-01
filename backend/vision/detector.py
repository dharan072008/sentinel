"""
SENTINEL - Object Detector Module
Supports YOLOv8 PyTorch detection with automated fallback to adaptive vision detector
for classes: person, bird, drone, vehicle, animal, unknown.
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
    Detects Person, Bird, Drone, Vehicle, Animal, Unknown objects in surveillance video frames.
    """
    CLASS_MAPPING = {
        0: "person",
        1: "bird",       # bicycle in standard coco, remapped for aerial or custom
        2: "vehicle",    # car
        3: "vehicle",    # motorcycle
        5: "vehicle",    # bus
        7: "vehicle",    # truck
        14: "bird",      # bird in COCO
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

    def __init__(self, model_name: str = "yolov8n.pt", conf_thresh: float = 0.35):
        self.conf_thresh = conf_thresh
        self.model = None
        self.model_loaded = False
        
        if YOLO_AVAILABLE:
            try:
                # Initialize YOLOv8
                self.model = YOLO(model_name)
                self.model_loaded = True
            except Exception as e:
                print(f"[SentinelDetector] Warning: Could not initialize YOLO model ({e}). Using algorithmic detector.")
                self.model = None

    def detect(self, frame: np.ndarray, frame_idx: int = 0) -> List[Dict[str, Any]]:
        """
        Runs object detection on a BGR frame (numpy array).
        Returns a list of detections: [{"bbox": [x1, y1, x2, y2], "class_name": str, "confidence": float}]
        """
        detections = []
        h, w = frame.shape[:2]

        if self.model_loaded and self.model is not None:
            try:
                results = self.model(frame, conf=self.conf_thresh, imgsz=480, verbose=False)
                for r in results:
                    boxes = r.boxes
                    for box in boxes:
                        cls_id = int(box.cls[0].item())
                        conf = float(box.conf[0].item())
                        xyxy = box.xyxy[0].tolist()
                        
                        # Map to sentinel class
                        class_name = self.CLASS_MAPPING.get(cls_id, "unknown")
                        
                        # Drone heuristic for small aerial objects moving at high altitude/upper screen
                        if class_name == "bird" or cls_id in [4, 8]:  # airplane/boat COCO fallback
                            # If aspect ratio is wide and rigid, flag potential drone
                            box_w = xyxy[2] - xyxy[0]
                            box_h = xyxy[3] - xyxy[1]
                            if box_w > 1.4 * box_h and xyxy[1] < h * 0.45:
                                class_name = "drone"
                        
                        detections.append({
                            "bbox": [round(c, 1) for c in xyxy],
                            "class_name": class_name,
                            "confidence": round(conf, 3),
                            "raw_class_id": cls_id
                        })
                return detections
            except Exception as e:
                print(f"[SentinelDetector] YOLO inference error: {e}")

        # Fallback adaptive vision / contour detection if YOLO not loaded or error
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, 50, 150)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for c in contours:
            area = cv2.contourArea(c)
            if 600 < area < 40000:
                x, y, bw, bh = cv2.boundingRect(c)
                aspect = bh / max(1.0, float(bw))
                
                # Heuristic categorization
                if aspect > 1.8 and bh > 50:
                    class_name = "person"
                    conf = 0.82
                elif aspect < 0.8 and y < h * 0.4:
                    class_name = "bird" if area < 4000 else "drone"
                    conf = 0.76
                elif aspect < 0.9 and bw > 70:
                    class_name = "vehicle"
                    conf = 0.85
                elif 0.8 <= aspect <= 1.5 and area < 2500:
                    class_name = "object"
                    conf = 0.70
                else:
                    class_name = "unknown"
                    conf = 0.60
                    
                detections.append({
                    "bbox": [float(x), float(y), float(x + bw), float(y + bh)],
                    "class_name": class_name,
                    "confidence": conf,
                    "raw_class_id": -1
                })
        
        return detections[:15]  # limit to top detections
