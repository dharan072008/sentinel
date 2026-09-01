"""
SENTINEL - Event Sequence Intelligence Engine
Connects distinct spatial, kinematic, and interaction observations into cohesive
chronological narratives so surveillance operators can inspect the entire context.
"""

from typing import List, Dict, Any, Optional


class EventSequenceEngine:
    """
    Builds and maintains structured event sequence chains per tracked entity.
    """
    def __init__(self):
        # {track_id: [{"step": 1, "timestamp": 12.4, "action": "ZONE_ENTRY", "summary": "Entered Village"}]}
        self.sequences: Dict[str, List[Dict[str, Any]]] = {}

    def log_event(self, track_id: str, action_type: str, summary: str, timestamp: float, metadata: Optional[Dict[str, Any]] = None):
        if track_id not in self.sequences:
            self.sequences[track_id] = []
            
        step_num = len(self.sequences[track_id]) + 1
        self.sequences[track_id].append({
            "step": step_num,
            "timestamp": round(timestamp, 2),
            "action_type": action_type,
            "summary": summary,
            "metadata": metadata or {}
        })

    def get_sequence_for_track(self, track_id: str) -> List[Dict[str, Any]]:
        return self.sequences.get(track_id, [])

    def get_all_active_sequences(self) -> Dict[str, List[Dict[str, Any]]]:
        return self.sequences

    def reset(self):
        self.sequences.clear()
