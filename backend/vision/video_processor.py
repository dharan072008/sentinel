"""
SENTINEL - Video Processing & Ingestion Engine
Handles video decoding, frame extraction, metadata probing, and timestamp synchronization.
"""

import os
import cv2
import base64
import time
from typing import Dict, Any, Optional, Tuple, Generator


class SentinelVideoProcessor:
    """
    Decodes video streams/files, extracts frames, and manages temporal synchronization.
    """
    def __init__(self, video_path: str):
        self.video_path = video_path
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found at: {video_path}")
            
        self.cap = cv2.VideoCapture(video_path)
        if not self.cap.isOpened():
            raise ValueError(f"Could not open video file: {video_path}")
            
        fps = self.cap.get(cv2.CAP_PROP_FPS)
        self.fps = float(fps) if fps and fps > 0 else 10.0
        
        frames = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
        self.total_frames = frames if frames > 0 else 100
        
        self.width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 1280
        self.height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 720
        if self.width <= 0: self.width = 1280
        if self.height <= 0: self.height = 720
        
        self.duration_seconds = self.total_frames / self.fps

    def get_metadata(self) -> Dict[str, Any]:
        return {
            "video_path": self.video_path,
            "filename": os.path.basename(self.video_path),
            "fps": round(self.fps, 2),
            "total_frames": self.total_frames,
            "width": self.width,
            "height": self.height,
            "duration_seconds": round(self.duration_seconds, 2)
        }

    def get_frame(self, frame_index: int) -> Optional[Tuple[cv2.Mat, float]]:
        """
        Extracts a specific frame by index. Returns (frame_bgr, timestamp_seconds).
        """
        if frame_index < 0 or frame_index >= self.total_frames:
            return None
            
        self.cap.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
        ret, frame = self.cap.read()
        if not ret:
            return None
            
        timestamp = frame_index / self.fps
        return frame, timestamp

    def frame_generator(self, stride: int = 1) -> Generator[Tuple[int, cv2.Mat, float], None, None]:
        """
        Iterates over video frames with step stride using fast sequential decoding.
        """
        stride = max(1, stride)
        self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        idx = 0
        while idx < self.total_frames:
            ret, frame = self.cap.read()
            if not ret:
                break
            timestamp = idx / self.fps
            yield idx, frame, timestamp
            
            idx += 1
            if stride > 1:
                for _ in range(stride - 1):
                    if not self.cap.grab():
                        return
                    idx += 1

    def close(self):
        if self.cap and self.cap.isOpened():
            self.cap.release()

    @staticmethod
    def frame_to_base64_jpeg(frame: cv2.Mat, quality: int = 80) -> str:
        """Converts an OpenCV BGR frame to a base64 encoded JPEG string."""
        encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), quality]
        _, buffer = cv2.imencode('.jpg', frame, encode_param)
        return base64.b64encode(buffer).decode('utf-8')
