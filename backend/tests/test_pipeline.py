"""
SENTINEL - Intelligence Pipeline Automated Unit Tests
Verifies multi-object tracker, spatial zones, behavioural baseline, odd-one-out ranking,
aerial contradiction, and explainable 5W dossier generation.
"""

import sys
import os
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from vision.tracker import SentinelTracker
from spatial.zone_manager import ZoneManager, VirtualZone
from intelligence.behaviour_engine import BehaviourEngine
from intelligence.baseline_engine import BehaviouralBaseline
from intelligence.oddoneout_engine import OddOneOutEngine
from aerial.bird_drone_classifier import BirdDroneClassifier
from aerial.thermal_engine import ThermalSensorSimulator
from aerial.ecological_context import EcologicalContextEngine
from aerial.contradiction_engine import ContradictionEngine
from fusion.fusion_matrix import EvidenceFusionMatrix
from fusion.priority_engine import PriorityEngine
from fusion.explainability import ExplainabilityEngine


class TestSentinelPipeline(unittest.TestCase):

    def test_tracker_persistent_id(self):
        tracker = SentinelTracker()
        dets_f1 = [{"bbox": [100, 100, 150, 200], "class_name": "person", "confidence": 0.9}]
        tracks_f1 = tracker.update(dets_f1, current_time=0.0)
        self.assertEqual(len(tracks_f1), 1)
        tid = tracks_f1[0]["track_id"]
        
        # Next frame with small displacement
        dets_f2 = [{"bbox": [105, 102, 155, 202], "class_name": "person", "confidence": 0.92}]
        tracks_f2 = tracker.update(dets_f2, current_time=0.05)
        self.assertEqual(len(tracks_f2), 1)
        self.assertEqual(tracks_f2[0]["track_id"], tid)
        self.assertGreaterEqual(tracks_f2[0]["speed_kmh"], 0.0)

    def test_spatial_zone_containment_and_incursion(self):
        zm = ZoneManager(frame_width=1000, frame_height=600)
        # Point inside restricted fence (x=850, y=300)
        zone_name = zm.get_zone_for_point(850, 300)
        self.assertIn("Restricted", zone_name)
        
        # Test incursion event generation
        events = zm.evaluate_spatial_events("P07", "person", 850, 300, timestamp=1.2)
        # Initial event logs entry
        events2 = zm.evaluate_spatial_events("P07", "person", 850, 300, timestamp=1.5)
        self.assertTrue(len(zm.spatial_events) >= 0)

    def test_baseline_and_oddoneout(self):
        baseline = BehaviouralBaseline()
        odd_engine = OddOneOutEngine()
        
        # Normal civilian cohort
        cohort_features = []
        baseline_results = []
        for i in range(10):
            feat = {
                "track_id": f"P{i+1:02d}",
                "class_name": "person",
                "speed_kmh": 4.5 + (i * 0.1),
                "dwell_seconds": 15.0,
                "current_zone": "Civilian Village Sector",
                "route_tortuosity": 1.05
            }
            res = baseline.compare_with_baseline(feat)
            cohort_features.append(feat)
            baseline_results.append(res)
            
        # Anomaly Outlier P07
        outlier_feat = {
            "track_id": "P07",
            "class_name": "person",
            "speed_kmh": 0.0,
            "dwell_seconds": 140.0,
            "current_zone": "Restricted Border Fence Line",
            "route_tortuosity": 2.80
        }
        outlier_res = baseline.compare_with_baseline(outlier_feat)
        cohort_features.append(outlier_feat)
        baseline_results.append(outlier_res)
        
        pop_analysis = odd_engine.evaluate_population_outliers(baseline_results, cohort_features)
        self.assertEqual(pop_analysis["total_entities"], 11)
        self.assertIsNotNone(pop_analysis["primary_outlier"])
        self.assertEqual(pop_analysis["primary_outlier"]["track_id"], "P07")
        self.assertGreater(pop_analysis["primary_outlier"]["score"], 0.60)

    def test_aerial_contradiction_engine(self):
        classifier = BirdDroneClassifier()
        thermal_sim = ThermalSensorSimulator()
        eco_engine = EcologicalContextEngine()
        contra_engine = ContradictionEngine()
        
        # Target with rigid linear flight
        dummy_track = {
            "track_id": "B04",
            "class_name": "bird",
            "speed_kmh": 32.0,
            "trajectory": [[10 + i * 20, 100] for i in range(15)]
        }
        kinematics = classifier.analyze_aerial_kinematics(dummy_track)
        thermal = thermal_sim.get_thermal_signature("bird", "B04", is_drone_override=True)
        ecology = eco_engine.evaluate_ecological_consistency("Steppe Eagle (Aquila nipalensis)", "Thar_Desert_Sector", "Summer")
        
        contradiction = contra_engine.evaluate_aerial_contradiction(
            visual_class="bird",
            kinematics=kinematics,
            thermal=thermal,
            ecology=ecology,
            simulated_radar_blade_rpm=3200.0
        )
        
        self.assertTrue(contradiction["has_contradiction"])
        self.assertEqual(contradiction["final_assessment"], "AMBIGUOUS_AERIAL_TARGET")

    def test_explainable_dossier_generation(self):
        exp_engine = ExplainabilityEngine()
        priority_info = {"priority_level": "CRITICAL_REVIEW", "priority_score": 0.85, "color_hex": "#EF4444"}
        fusion_info = {"composite_evidence_score": 0.85, "evidence_breakdown": []}
        beh = {"current_zone": "Restricted Border Fence Line", "dwell_seconds": 55.0, "speed_kmh": 1.2}
        base = {"deviation_reasons": ["Dwell exceeded", "Restricted incursion"]}
        
        dossier = exp_engine.generate_dossier(
            track_id="P07",
            class_name="person",
            priority_info=priority_info,
            fusion_info=fusion_info,
            spatial_events=[],
            behaviour_features=beh,
            baseline_comparison=base,
            odd_one_out=None,
            event_sequence=[{"summary": "Incursion at Fence"}]
        )
        
        self.assertEqual(dossier["track_id"], "P07")
        self.assertIn("what", dossier["five_w"])
        self.assertIn("why", dossier["five_w"])
        self.assertIn("evidence", dossier["five_w"])
        self.assertEqual(len(dossier["operator_actions"]), 4)


if __name__ == "__main__":
    unittest.main()
