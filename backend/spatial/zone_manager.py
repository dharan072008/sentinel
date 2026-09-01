"""
SENTINEL - Spatial Intelligence & Virtual Zone Manager
Manages polygon virtual zones, point-in-polygon tests, zone entry/exit events,
dwell accumulation, and proximity calculations.
"""

from typing import List, Dict, Any, Tuple, Optional
import cv2
import numpy as np


class VirtualZone:
    """
    Represents a geometric virtual surveillance zone.
    """
    def __init__(
        self,
        zone_id: str,
        name: str,
        polygon: List[List[float]],  # [[x1, y1], [x2, y2], ...]
        zone_type: str = "RESTRICTED",  # VILLAGE, ROAD, BUFFER, RESTRICTED, SENSITIVE
        sensitivity_level: str = "HIGH",  # LOW, MEDIUM, HIGH, CRITICAL
        color: str = "#EF4444",
        description: str = ""
    ):
        self.zone_id = zone_id
        self.name = name
        self.polygon = polygon
        self.zone_type = zone_type.upper()
        self.sensitivity_level = sensitivity_level.upper()
        self.color = color
        self.description = description
        self.pts_np = np.array(polygon, dtype=np.int32).reshape((-1, 1, 2))

    def contains_point(self, x: float, y: float) -> bool:
        """
        Tests whether point (x, y) is inside the polygon zone.
        Returns True if inside or on boundary.
        """
        result = cv2.pointPolygonTest(self.pts_np, (float(x), float(y)), False)
        return result >= 0

    def distance_to_boundary(self, x: float, y: float) -> float:
        """
        Computes signed Euclidean distance in pixels to polygon edge.
        Positive if inside, negative if outside.
        """
        return cv2.pointPolygonTest(self.pts_np, (float(x), float(y)), True)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "zone_id": self.zone_id,
            "name": self.name,
            "polygon": self.polygon,
            "zone_type": self.zone_type,
            "sensitivity_level": self.sensitivity_level,
            "color": self.color,
            "description": self.description
        }


class ZoneManager:
    """
    Registry for active zones and spatial event analysis.
    """
    def __init__(self, frame_width: int = 1280, frame_height: int = 720):
        self.width = frame_width
        self.height = frame_height
        self.zones: Dict[str, VirtualZone] = {}
        self.track_zone_durations: Dict[str, Dict[str, float]] = {}  # {track_id: {zone_id: seconds}}
        self.track_last_zone: Dict[str, str] = {}
        self.spatial_events: List[Dict[str, Any]] = []
        
        # Initialize default border zones
        self._init_default_zones()

    def _init_default_zones(self):
        w, h = self.width, self.height
        
        # 1. Village / Civilian Zone (Left quadrant)
        village_poly = [[0, int(h * 0.35)], [int(w * 0.40), int(h * 0.35)], [int(w * 0.35), h], [0, h]]
        self.add_zone(VirtualZone(
            zone_id="Z_VILLAGE",
            name="Civilian Village Sector",
            polygon=village_poly,
            zone_type="VILLAGE",
            sensitivity_level="LOW",
            color="#3B82F6",
            description="Habitation & farmland zone. Ordinary civilian movement expected."
        ))

        # 2. Main Public Road / Transit Corridor
        road_poly = [[int(w * 0.32), int(h * 0.40)], [int(w * 0.65), int(h * 0.40)], [int(w * 0.58), h], [int(w * 0.35), h]]
        self.add_zone(VirtualZone(
            zone_id="Z_ROAD",
            name="Public Transit Road",
            polygon=road_poly,
            zone_type="ROAD",
            sensitivity_level="LOW",
            color="#10B981",
            description="Designated thoroughfare. Normal baseline velocity: 15-40 km/h."
        ))

        # 3. Buffer / Agricultural Field
        buffer_poly = [[int(w * 0.58), int(h * 0.30)], [int(w * 0.82), int(h * 0.30)], [int(w * 0.78), h], [int(w * 0.58), h]]
        self.add_zone(VirtualZone(
            zone_id="Z_BUFFER",
            name="Agricultural Buffer Zone",
            polygon=buffer_poly,
            zone_type="BUFFER",
            sensitivity_level="MEDIUM",
            color="#F59E0B",
            description="Intermediate perimeter zone between village road and security fence."
        ))

        # 4. Restricted Security Perimeter
        fence_poly = [[int(w * 0.80), int(h * 0.15)], [w, int(h * 0.15)], [w, h], [int(w * 0.76), h]]
        self.add_zone(VirtualZone(
            zone_id="Z_RESTRICTED",
            name="Restricted Border Fence Line",
            polygon=fence_poly,
            zone_type="RESTRICTED",
            sensitivity_level="CRITICAL",
            color="#EF4444",
            description="Zero-tolerance perimeter. Unauthorized civilian presence triggers priority alert."
        ))

        # 5. Sensitive Outpost Facility
        outpost_poly = [[int(w * 0.84), int(h * 0.18)], [int(w * 0.98), int(h * 0.18)], [int(w * 0.98), int(h * 0.48)], [int(w * 0.84), int(h * 0.48)]]
        self.add_zone(VirtualZone(
            zone_id="Z_OUTPOST",
            name="Sensitive Outpost / Armory",
            polygon=outpost_poly,
            zone_type="SENSITIVE",
            sensitivity_level="CRITICAL",
            color="#DC2626",
            description="High-security communications & defense installation."
        ))

    def add_zone(self, zone: VirtualZone):
        self.zones[zone.zone_id] = zone

    def remove_zone(self, zone_id: str):
        if zone_id in self.zones:
            del self.zones[zone_id]

    def get_zone_for_point(self, x: float, y: float) -> str:
        """
        Returns the highest sensitivity zone name containing point (x, y).
        """
        matched_zones = []
        for zone in self.zones.values():
            if zone.contains_point(x, y):
                matched_zones.append(zone)
                
        if not matched_zones:
            return "General Area"
            
        # Priority order: CRITICAL > HIGH > MEDIUM > LOW
        priority_map = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1}
        matched_zones.sort(key=lambda z: priority_map.get(z.sensitivity_level, 0), reverse=True)
        return matched_zones[0].name

    def evaluate_spatial_events(
        self,
        track_id: str,
        class_name: str,
        cx: float,
        cy: float,
        timestamp: float,
        dt: float = 0.033
    ) -> List[Dict[str, Any]]:
        """
        Updates zone residency and generates incursion / transition events.
        """
        events = []
        current_zone_name = self.get_zone_for_point(cx, cy)
        
        # Initialize tracking records
        if track_id not in self.track_zone_durations:
            self.track_zone_durations[track_id] = {}
        if current_zone_name not in self.track_zone_durations[track_id]:
            self.track_zone_durations[track_id][current_zone_name] = 0.0
            
        self.track_zone_durations[track_id][current_zone_name] += dt
        last_zone = self.track_last_zone.get(track_id, "None")
        
        # Zone transition event
        if last_zone != "None" and last_zone != current_zone_name:
            evt = {
                "event_type": "ZONE_TRANSITION",
                "track_id": track_id,
                "class_name": class_name,
                "from_zone": last_zone,
                "to_zone": current_zone_name,
                "timestamp": round(timestamp, 2),
                "position": [round(cx, 1), round(cy, 1)],
                "severity": "HIGH" if "Restricted" in current_zone_name or "Outpost" in current_zone_name else "INFO",
                "description": f"{class_name.capitalize()} {track_id} moved from '{last_zone}' into '{current_zone_name}'."
            }
            events.append(evt)
            self.spatial_events.append(evt)
            
            # Restricted incursion event
            if "Restricted" in current_zone_name or "Outpost" in current_zone_name:
                incursion_evt = {
                    "event_type": "RESTRICTED_INCURSION",
                    "track_id": track_id,
                    "class_name": class_name,
                    "zone_name": current_zone_name,
                    "timestamp": round(timestamp, 2),
                    "position": [round(cx, 1), round(cy, 1)],
                    "severity": "CRITICAL",
                    "description": f"Spatial Incursion: {class_name.capitalize()} {track_id} breached {current_zone_name}."
                }
                events.append(incursion_evt)
                self.spatial_events.append(incursion_evt)
                
        self.track_last_zone[track_id] = current_zone_name
        return events

    def get_all_zones(self) -> List[Dict[str, Any]]:
        return [z.to_dict() for z in self.zones.values()]

    def reset(self):
        self.track_zone_durations.clear()
        self.track_last_zone.clear()
        self.spatial_events.clear()
