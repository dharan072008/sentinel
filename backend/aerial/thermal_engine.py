"""
SENTINEL - Thermal Intelligence Engine (Simulated Sensor Module)
Simulates Long-Wave Infrared (LWIR) radiometric thermal telemetry for the prototype.
All outputs from this module are explicitly tagged with [SIMULATED SENSOR].
"""

import random
from typing import Dict, Any, Optional


class ThermalSensorSimulator:
    """
    Simulates thermal radiation characteristics:
    - Birds: Warm organic core (38°C - 41.5°C) with feathered insulating gradient (cool wing tips).
    - Drones: Cold carbon/plastic airframe (~ambient + 3°C) with localized point-source motor/ESC/battery hot spots (55°C - 78°C).
    - Humans: Standard metabolic body heat signature (35.5°C - 37.2°C).
    - Vehicles: Internal combustion engine block / exhaust manifold (80°C - 160°C).
    """
    def __init__(self):
        self.sensor_tag = "[SIMULATED SENSOR]"
        self.ambient_temp_c = 26.5

    def get_thermal_signature(self, class_name: str, track_id: str, is_drone_override: bool = False) -> Dict[str, Any]:
        """
        Returns simulated radiometric thermal data for an entity.
        """
        if class_name == "bird" and not is_drone_override:
            core_temp = round(random.uniform(39.0, 41.2), 1)
            surface_temp = round(random.uniform(31.0, 34.0), 1)
            hotspots = ["Visceral core / chest"]
            thermal_type = "BIOLOGICAL_ENDOTHERMIC"
            confidence = 0.88
            summary = f"Uniform organic metabolic gradient. Core: {core_temp}°C, Outer plumage: {surface_temp}°C."
        elif class_name == "drone" or is_drone_override:
            core_temp = round(random.uniform(62.0, 74.5), 1)  # Motor stator / ESC temp
            surface_temp = round(random.uniform(28.0, 31.0), 1)  # Chassis
            hotspots = ["Brushless motor stator (quad nodes)", "LiPo battery compartment", "ESC voltage regulator"]
            thermal_type = "ELECTROMECHANICAL_POINT_SOURCE"
            confidence = 0.94
            summary = f"High-contrast electromechanical point-sources detected ({core_temp}°C) on cool chassis ({surface_temp}°C)."
        elif class_name == "person":
            core_temp = round(random.uniform(36.2, 37.0), 1)
            surface_temp = round(random.uniform(32.5, 34.5), 1)
            hotspots = ["Facial region", "Exposed extremities"]
            thermal_type = "HUMAN_METABOLIC"
            confidence = 0.96
            summary = f"Standard human biometric thermal envelope ({surface_temp}°C - {core_temp}°C)."
        elif class_name == "vehicle":
            core_temp = round(random.uniform(92.0, 145.0), 1)
            surface_temp = round(random.uniform(38.0, 48.0), 1)
            hotspots = ["Engine compartment", "Exhaust pipe", "Brake calipers"]
            thermal_type = "COMBUSTION_HEAVY_MACHINERY"
            confidence = 0.98
            summary = f"High-temperature combustion manifold ({core_temp}°C) with tire friction signature."
        else:
            core_temp = round(self.ambient_temp_c + random.uniform(1.0, 5.0), 1)
            surface_temp = round(self.ambient_temp_c, 1)
            hotspots = ["None / Ambient equilibrium"]
            thermal_type = "INORGANIC_PASSIVE"
            confidence = 0.70
            summary = f"Object at thermal ambient equilibrium ({core_temp}°C)."

        return {
            "sensor_label": self.sensor_tag,
            "is_simulated": True,
            "thermal_type": thermal_type,
            "peak_temperature_c": core_temp,
            "ambient_reference_c": self.ambient_temp_c,
            "delta_t_c": round(core_temp - self.ambient_temp_c, 1),
            "hotspot_regions": hotspots,
            "sensor_confidence": confidence,
            "thermal_summary": summary
        }
