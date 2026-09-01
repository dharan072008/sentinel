"""
SENTINEL - Contradiction & Ambiguity Engine
Detects conflicting multi-sensor and contextual signals (e.g. Visual looks like bird, but
Thermal indicates 68°C motor stator and Micro-Doppler indicates high-RPM rotor harmonics).
"""

from typing import Dict, Any, List, Optional


class ContradictionEngine:
    """
    Evaluates agreement vs conflict across independent evidence channels:
    1. Visual Object Detector (YOLO)
    2. Aerial Flight Kinematics (Flight Linearity & Wing-beat Oscillation)
    3. Radiometric Thermal Signature (Metabolic vs Electromechanical)
    4. Micro-Doppler Radar Simulation (Blade chop vs Wing flap harmonics)
    5. Ecological / Seasonal Feasibility
    """
    def __init__(self):
        pass

    def evaluate_aerial_contradiction(
        self,
        visual_class: str,
        kinematics: Dict[str, Any],
        thermal: Dict[str, Any],
        ecology: Dict[str, Any],
        simulated_radar_blade_rpm: float = 0.0
    ) -> Dict[str, Any]:
        """
        Fuses independent channels and flags contradictions.
        """
        conflicts = []
        evidence_alignment = []
        
        is_visual_bird = visual_class == "bird"
        is_thermal_mechanical = thermal.get("thermal_type") == "ELECTROMECHANICAL_POINT_SOURCE"
        is_kinematics_drone = kinematics.get("preliminary_aerial_type") == "DRONE_SUSPECT"
        is_ecology_contradiction = ecology.get("verdict") == "ECOLOGICAL_CONTRADICTION"
        
        # Check Conflict 1: Visual Bird vs Thermal Motor
        if is_visual_bird and is_thermal_mechanical:
            conflicts.append({
                "source_a": "Visual CCTV (Bird Silhouette)",
                "source_b": "Thermal IR Sensor [SIMULATED]",
                "details": f"Visual shape resembles avian silhouette, but Thermal IR detects {thermal.get('peak_temperature_c')}°C electromechanical point-source (stator/ESC)."
            })
            
        # Check Conflict 2: Visual Bird vs Linear Rotor Kinematics
        if is_visual_bird and is_kinematics_drone:
            conflicts.append({
                "source_a": "Visual CCTV (Bird Silhouette)",
                "source_b": "Kinematic Trajectory Analyzer",
                "details": "Flight path exhibits rigid vector linearity (>0.90) with zero flapping velocity oscillation."
            })
            
        # Check Conflict 3: Ecological Mismatch
        if is_visual_bird and is_ecology_contradiction:
            conflicts.append({
                "source_a": "Species Classifier",
                "source_b": "Regional Ecological Knowledge Base",
                "details": f"Suspected species '{ecology.get('species_identified')}' is ecologically invalid for this region/season."
            })

        # Micro-Doppler Radar Check (Simulated)
        radar_summary = "No high-RPM blade reflections detected (Consistent with wing movement)"
        if simulated_radar_blade_rpm > 1200:
            radar_summary = f"Simulated Micro-Doppler radar detected high-frequency rotor harmonics (~{simulated_radar_blade_rpm:.0f} RPM)"
            if is_visual_bird:
                conflicts.append({
                    "source_a": "Visual CCTV (Bird)",
                    "source_b": "Micro-Doppler Radar [SIMULATED]",
                    "details": f"Radar micro-Doppler spectrum detected rotor blade rotation harmonics (~{simulated_radar_blade_rpm:.0f} RPM)."
                })

        has_contradiction = len(conflicts) > 0
        overall_confidence = 0.45 if has_contradiction else 0.88
        
        if has_contradiction:
            final_assessment = "AMBIGUOUS_AERIAL_TARGET"
            recommendation = "MANDATORY OPERATOR VERIFICATION: Evidence conflict between visual silhouette and sensor telemetry. Potential camouflaged aerial payload."
        else:
            if visual_class == "drone" or is_kinematics_drone:
                final_assessment = "CONFIRMED_DRONE"
                recommendation = "Alert Air Defense / Border Patrol: Verified Unmanned Aerial Vehicle."
            else:
                final_assessment = "NATURAL_AVIAN_FAUNA"
                recommendation = "Standard Civilian Ecological Traffic: No threat action required."

        return {
            "has_contradiction": has_contradiction,
            "conflict_count": len(conflicts),
            "conflicts": conflicts,
            "final_assessment": final_assessment,
            "overall_confidence": overall_confidence,
            "recommendation": recommendation,
            "radar_sensor_status": {
                "sensor_label": "[SIMULATED SENSOR]",
                "simulated_blade_rpm": simulated_radar_blade_rpm,
                "radar_summary": radar_summary
            }
        }
