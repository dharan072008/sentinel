"""
SENTINEL - Odd-One-Out Population Intelligence Engine
Performs population-level comparison across all active entities in the surveillance scene
to isolate significant behavioural outliers without making arbitrary criminal declarations.
"""

from typing import List, Dict, Any, Optional
import numpy as np


class OddOneOutEngine:
    """
    Ranks active entities by outlier score relative to current scene population.
    Example: 20 people observed -> 18 conform to baseline -> 1 slight deviation -> 1 significant outlier (P07).
    """
    def __init__(self):
        pass

    def evaluate_population_outliers(
        self,
        baseline_results: List[Dict[str, Any]],
        behaviour_results: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Analyzes the population distribution of deviation scores.
        Returns:
            - population_summary: {total_count, normal_count, moderate_count, outlier_count}
            - ranked_entities: list of entities sorted by anomaly score
            - primary_outlier: dict of the highest significant outlier with explanation
        """
        if not baseline_results:
            return {
                "total_entities": 0,
                "normal_count": 0,
                "moderate_count": 0,
                "significant_outlier_count": 0,
                "ranked_entities": [],
                "primary_outlier": None
            }

        scores = [res["composite_deviation_score"] for res in baseline_results]
        total_count = len(baseline_results)
        
        # Calculate population statistics
        mean_score = float(np.mean(scores))
        std_score = float(np.std(scores)) if total_count > 1 else 0.2
        
        ranked_entities = []
        normal_count = 0
        moderate_count = 0
        significant_outlier_count = 0
        
        for res in baseline_results:
            tid = res["track_id"]
            score = res["composite_deviation_score"]
            z_score = (score - mean_score) / max(0.01, std_score)
            
            # Anomaly is significant if score > 0.40 or z_score > 1.2 or zone is Restricted with high deviation
            is_significant_outlier = score > 0.40 or z_score > 1.20 or ("Restricted" in res.get("zone", "") and score > 0.20)
            if is_significant_outlier:
                classification = "SIGNIFICANT_OUTLIER"
                significant_outlier_count += 1
            elif score > 0.25 or z_score > 0.8:
                classification = "MODERATE_DEVIATION"
                moderate_count += 1
            else:
                classification = "BASELINE_CONFORMANT"
                normal_count += 1
                
            ranked_entities.append({
                "track_id": tid,
                "zone": res["zone"],
                "score": score,
                "z_score": round(z_score, 2),
                "classification": classification,
                "reasons": res["deviation_reasons"]
            })
            
        # Sort descending by anomaly score
        ranked_entities.sort(key=lambda x: x["score"], reverse=True)
        
        primary_outlier = None
        if ranked_entities and ranked_entities[0]["classification"] == "SIGNIFICANT_OUTLIER":
            top = ranked_entities[0]
            primary_outlier = {
                "track_id": top["track_id"],
                "zone": top["zone"],
                "score": top["score"],
                "z_score": top["z_score"],
                "explanation": f"Entity {top['track_id']} exhibits a significant deviation (Anomaly Score: {top['score']:.2f}, Z-score: +{top['z_score']}σ) compared to {total_count - 1} cohort entities.",
                "contributing_signals": top["reasons"]
            }

        return {
            "total_entities": total_count,
            "normal_count": normal_count,
            "moderate_count": moderate_count,
            "significant_outlier_count": significant_outlier_count,
            "ranked_entities": ranked_entities,
            "primary_outlier": primary_outlier
        }
