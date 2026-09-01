"""
SENTINEL - Synthetic Video & Scenario Generator
Generates realistic, annotated demo video files using OpenCV for immediate out-of-the-box
testing without requiring large external downloads.
"""

import os
import math
import cv2
import numpy as np


def ensure_scenario_videos(output_dir: str):
    """
    Checks if scenario videos exist; if not, generates them.
    """
    os.makedirs(output_dir, exist_ok=True)
    
    scenarios = [
        ("border_sector_incursion.mp4", generate_border_incursion_video),
        ("aerial_drone_contradiction.mp4", generate_aerial_contradiction_video),
        ("village_baseline_traffic.mp4", generate_village_traffic_video),
        ("checkpoint_night_patrol.mp4", generate_checkpoint_patrol_video),
        ("forest_border_trail.mp4", generate_forest_trail_video)
    ]
    
    for filename, gen_func in scenarios:
        path = os.path.join(output_dir, filename)
        if not os.path.exists(path) or os.path.getsize(path) < 1000:
            print(f"[SampleGenerator] Rendering synthetic scenario video: {filename}...")
            gen_func(path)
            print(f"[SampleGenerator] Generated: {path}")



def draw_tactical_background(w: int, h: int, scene_type: str = "border") -> np.ndarray:
    """Creates a stylized surveillance scene background."""
    img = np.zeros((h, w, 3), dtype=np.uint8)
    
    # Sky
    sky_color = [180, 160, 140] if scene_type == "aerial" else [140, 120, 100]
    ground_color = [45, 55, 40] if scene_type == "village" else [50, 60, 55]
    
    horizon_y = int(h * 0.35)
    img[0:horizon_y, :] = sky_color
    img[horizon_y:h, :] = ground_color
    
    # Ground texture & road
    road_poly = np.array([[int(w * 0.25), horizon_y], [int(w * 0.48), horizon_y], [int(w * 0.55), h], [int(w * 0.15), h]], np.int32)
    cv2.fillPoly(img, [road_poly], (65, 70, 75))
    
    # Road dashed line
    cv2.line(img, (int(w * 0.36), horizon_y), (int(w * 0.35), h), (200, 200, 200), 2, cv2.LINE_AA)
    
    # Fence line (Right side)
    fence_x = int(w * 0.78)
    for y in range(horizon_y, h, 25):
        cv2.line(img, (fence_x, y), (w, y), (90, 95, 100), 1)
    for x in range(fence_x, w, 40):
        cv2.line(img, (x, horizon_y), (x, h), (110, 115, 120), 2)
        
    # Village huts on left
    cv2.rectangle(img, (20, int(h * 0.40)), (140, int(h * 0.58)), (80, 75, 90), -1)
    cv2.rectangle(img, (160, int(h * 0.42)), (260, int(h * 0.56)), (90, 85, 95), -1)
    
    # Border Outpost on top right
    cv2.rectangle(img, (int(w * 0.82), int(h * 0.20)), (int(w * 0.96), int(h * 0.36)), (70, 80, 85), -1)
    cv2.putText(img, "BORDER POST 04", (int(w * 0.83), int(h * 0.24)), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (220, 220, 220), 1)
    
    # Overlay tactical scanlines / grid
    for gy in range(0, h, 40):
        cv2.line(img, (0, gy), (w, gy), (40, 50, 45), 1)
    for gx in range(0, w, 60):
        cv2.line(img, (gx, 0), (gx, h), (40, 50, 45), 1)
        
    return img


def generate_border_incursion_video(output_path: str):
    """Scenario 1: Person P07 deviates from road, approaches fence, drops bag, and retreats."""
    w, h = 960, 540
    fps = 20
    duration_s = 14
    total_frames = fps * duration_s
    
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (w, h))
    bg = draw_tactical_background(w, h, "border")
    
    # Baggage coordinates
    bag_dropped = False
    bag_pos = (0, 0)
    
    for f in range(total_frames):
        frame = bg.copy()
        t = f / fps
        
        # 1. Normal Civilians (P01, P02, P03) walking along the road
        for i, speed in enumerate([1.2, 0.9, 1.4]):
            norm_y = int(h * 0.42 + (f * speed * 3 + i * 90) % (h * 0.50))
            norm_x = int(w * 0.30 + (norm_y - h * 0.42) * 0.25)
            # Draw Person stick/ellipse
            cv2.ellipse(frame, (norm_x, norm_y), (8, 20), 0, 0, 360, (180, 140, 100), -1)
            cv2.circle(frame, (norm_x, norm_y - 24), 6, (200, 170, 140), -1)
            cv2.putText(frame, f"CIV-{i+1}", (norm_x - 14, norm_y - 32), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (180, 220, 180), 1)
            
        # 2. Normal Vehicle on road
        veh_y = int(h * 0.40 + (f * 9) % (h * 0.55))
        veh_x = int(w * 0.42 + (veh_y - h * 0.40) * 0.18)
        cv2.rectangle(frame, (veh_x - 18, veh_y - 12), (veh_x + 18, veh_y + 12), (70, 110, 160), -1)
        
        # 3. Anomaly Person P07 Trajectory
        # Phase 1 (f < 60): Walking on road
        # Phase 2 (60 <= f < 140): Deviates right across Buffer towards Fence
        # Phase 3 (140 <= f < 200): Dwells at fence, drops bag
        # Phase 4 (f >= 200): Quickly retreats back to road
        if f < 60:
            p7_x = int(w * 0.34 + f * 0.4)
            p7_y = int(h * 0.52 + f * 0.6)
        elif f < 140:
            progress = (f - 60) / 80.0
            p7_x = int(w * 0.36 + progress * (w * 0.45))
            p7_y = int(h * 0.58 - progress * (h * 0.15))
        elif f < 200:
            # Dwell at fence
            p7_x = int(w * 0.81 + math.sin(f * 0.5) * 2)
            p7_y = int(h * 0.43 + math.cos(f * 0.3) * 2)
            if f >= 170:
                bag_dropped = True
                bag_pos = (int(w * 0.80), int(h * 0.46))
        else:
            # Retreat
            progress = (f - 200) / 80.0
            p7_x = int(w * 0.81 - progress * (w * 0.48))
            p7_y = int(h * 0.43 + progress * (h * 0.30))
            
        # Draw P07
        cv2.ellipse(frame, (p7_x, p7_y), (9, 22), 0, 0, 360, (60, 60, 200), -1)
        cv2.circle(frame, (p7_x, p7_y - 26), 7, (80, 80, 220), -1)
        cv2.putText(frame, "P07", (p7_x - 12, p7_y - 36), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (100, 100, 255), 1)
        
        # Draw dropped bag
        if bag_dropped:
            cv2.rectangle(frame, (bag_pos[0] - 6, bag_pos[1] - 4), (bag_pos[0] + 6, bag_pos[1] + 4), (30, 30, 30), -1)
            cv2.putText(frame, "BAG-01", (bag_pos[0] - 14, bag_pos[1] - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.3, (255, 200, 50), 1)
            
        # Draw Birds flying high in sky
        bird_x = int((f * 4) % (w + 40) - 20)
        bird_y = int(h * 0.12 + math.sin(f * 0.4) * 8)
        cv2.ellipse(frame, (bird_x, bird_y), (10, 4), 15, 0, 360, (40, 40, 40), -1)
        
        # Timestamp HUD
        cv2.putText(frame, f"CAM-04 NORTH PERIMETER | T+{t:.1f}s | FPS: {fps}", (15, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 200), 1)
        out.write(frame)
        
    out.release()


def generate_aerial_contradiction_video(output_path: str):
    """Scenario 2: Aerial target B04/D02 flying across sky with high linearity."""
    w, h = 960, 540
    fps = 20
    duration_s = 12
    total_frames = fps * duration_s
    
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (w, h))
    bg = draw_tactical_background(w, h, "aerial")
    
    for f in range(total_frames):
        frame = bg.copy()
        t = f / fps
        
        # 1. Biological Bird B01 (curved flight)
        b1_x = int(w * 0.10 + f * 4.5)
        b1_y = int(h * 0.18 + math.sin(f * 0.6) * 18)
        cv2.ellipse(frame, (b1_x, b1_y), (12, 5), int(math.sin(f * 0.6) * 20), 0, 360, (50, 50, 50), -1)
        cv2.putText(frame, "B01 (Avian)", (b1_x - 15, b1_y - 12), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (180, 220, 180), 1)
        
        # 2. Target Aerial Object D02 / B04 (Linear drone with bird-like profile)
        d2_x = int(w * 0.05 + f * 6.5)
        d2_y = int(h * 0.14)  # Strict linear horizontal altitude
        # Draw stealth shape
        cv2.rectangle(frame, (d2_x - 14, d2_y - 4), (d2_x + 14, d2_y + 4), (40, 45, 55), -1)
        cv2.line(frame, (d2_x - 18, d2_y), (d2_x + 18, d2_y), (20, 20, 20), 2)
        cv2.putText(frame, "TARGET-B04", (d2_x - 20, d2_y - 12), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (50, 150, 255), 1)
        
        # HUD
        cv2.putText(frame, f"AERIAL RADAR CAM-07 | T+{t:.1f}s | ECOLOGY CHECK ACTIVE", (15, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 220, 255), 1)
        out.write(frame)
        
    out.release()


def generate_village_traffic_video(output_path: str):
    """Scenario 3: Standard Village Baseline Traffic."""
    w, h = 960, 540
    fps = 20
    duration_s = 10
    total_frames = fps * duration_s
    
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (w, h))
    bg = draw_tactical_background(w, h, "village")
    
    for f in range(total_frames):
        frame = bg.copy()
        t = f / fps
        
        # Multiple pedestrians conforming to road
        for i in range(5):
            py = int(h * 0.44 + (f * (1.0 + i * 0.2) * 3 + i * 70) % (h * 0.48))
            px = int(w * 0.28 + (py - h * 0.44) * 0.22 + (i % 2) * 20)
            cv2.ellipse(frame, (px, py), (7, 18), 0, 0, 360, (160, 130, 90), -1)
            cv2.circle(frame, (px, py - 22), 5, (190, 160, 120), -1)
            cv2.putText(frame, f"P{i+1:02d}", (px - 10, py - 28), cv2.FONT_HERSHEY_SIMPLEX, 0.3, (200, 200, 200), 1)
            
        cv2.putText(frame, f"VILLAGE SECTOR BASELINE | T+{t:.1f}s | NOMINAL", (15, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (100, 255, 100), 1)
        out.write(frame)
        
    out.release()


def generate_checkpoint_patrol_video(output_path: str):
    """Scenario 4: Checkpoint Security & Intrusion."""
    w, h = 960, 540
    fps = 20
    duration_s = 12
    total_frames = fps * duration_s
    
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (w, h))
    bg = np.zeros((h, w, 3), dtype=np.uint8)
    
    # Night/IR palette
    bg[:] = (30, 35, 30)
    # Road
    cv2.rectangle(bg, (int(w * 0.2), 0), (int(w * 0.6), h), (45, 50, 45), -1)
    # Checkpoint Gate
    cv2.line(bg, (int(w * 0.2), int(h * 0.5)), (int(w * 0.55), int(h * 0.5)), (0, 165, 255), 4)
    # Guard Post
    cv2.rectangle(bg, (int(w * 0.58), int(h * 0.4)), (int(w * 0.75), int(h * 0.65)), (60, 70, 60), -1)
    cv2.putText(bg, "GUARD POST 02", (int(w * 0.59), int(h * 0.44)), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (180, 220, 180), 1)
    # Restricted Storage (Top Right)
    cv2.rectangle(bg, (int(w * 0.70), int(h * 0.05)), (int(w * 0.95), int(h * 0.35)), (40, 40, 60), 2)
    cv2.putText(bg, "RESTRICTED DEPOT", (int(w * 0.72), int(h * 0.12)), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (80, 80, 255), 1)

    for f in range(total_frames):
        frame = bg.copy()
        t = f / fps
        
        # Vehicle 1 approaching gate and waiting
        v_y = min(int(h * 0.52), int(h * 0.10 + f * 4))
        cv2.rectangle(frame, (int(w * 0.32), v_y), (int(w * 0.48), v_y + 40), (120, 120, 140), -1)
        cv2.putText(frame, "VEH-01", (int(w * 0.34), v_y + 25), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (220, 220, 220), 1)
        
        # Intruder P09 sneaking around fence toward Restricted Depot
        p_x = int(w * 0.65 + math.sin(f * 0.1) * 15)
        p_y = int(h * 0.75 - f * 2.5) if f < 160 else int(h * 0.20)
        cv2.ellipse(frame, (p_x, p_y), (8, 18), 0, 0, 360, (200, 100, 100), -1)
        cv2.circle(frame, (p_x, p_y - 20), 5, (220, 120, 120), -1)
        cv2.putText(frame, "P09 (Outlier)", (p_x - 20, p_y - 26), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (50, 50, 255), 1)
        
        cv2.putText(frame, f"NIGHT PERIMETER CHECKPOINT | IR CAM-03 | T+{t:.1f}s", (15, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 200), 1)
        out.write(frame)
        
    out.release()


def generate_forest_trail_video(output_path: str):
    """Scenario 5: Forest Border Trail with Wildlife & Rapid Crossing."""
    w, h = 960, 540
    fps = 20
    duration_s = 10
    total_frames = fps * duration_s
    
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (w, h))
    bg = np.zeros((h, w, 3), dtype=np.uint8)
    bg[:] = (20, 45, 25)
    
    # Forest Trail
    trail_poly = np.array([[int(w * 0.1), h], [int(w * 0.4), 0], [int(w * 0.6), 0], [int(w * 0.35), h]], np.int32)
    cv2.fillPoly(bg, [trail_poly], (35, 60, 40))
    
    # Trees
    for tx in [int(w * 0.08), int(w * 0.7), int(w * 0.85), int(w * 0.25)]:
        cv2.circle(bg, (tx, int(h * 0.3)), 40, (15, 75, 20), -1)
        cv2.circle(bg, (tx + 15, int(h * 0.6)), 50, (18, 80, 25), -1)
        
    for f in range(total_frames):
        frame = bg.copy()
        t = f / fps
        
        # Wildlife / Animal moving slowly in forest
        a_x = int(w * 0.75 + math.sin(f * 0.15) * 20)
        a_y = int(h * 0.45 + (f * 0.5) % 40)
        cv2.ellipse(frame, (a_x, a_y), (14, 8), 0, 0, 360, (60, 110, 80), -1)
        cv2.putText(frame, "ANIMAL-01", (a_x - 20, a_y - 12), cv2.FONT_HERSHEY_SIMPLEX, 0.3, (120, 200, 150), 1)
        
        # Rapid Infiltrator P14 crossing forest line at high speed
        p_x = int(w * 0.15 + f * 5.5)
        p_y = int(h * 0.80 - f * 3.5)
        cv2.ellipse(frame, (p_x, p_y), (8, 18), 25, 0, 360, (180, 90, 80), -1)
        cv2.circle(frame, (p_x, p_y - 20), 5, (200, 100, 90), -1)
        cv2.putText(frame, "P14 (Fast Trail Outlier)", (p_x - 30, p_y - 25), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 100, 255), 1)
        
        cv2.putText(frame, f"FOREST BORDER SECTOR | OPTICAL CAM-09 | T+{t:.1f}s", (15, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 220, 255), 1)
        out.write(frame)
        
    out.release()

