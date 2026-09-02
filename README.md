# SENTINEL — Context-Aware Border & Civilian Surveillance Intelligence 🛡️

> **"Detection is easy, Context is everything."**  
> *SENTINEL is an end-to-end tactical surveillance intelligence platform designed for complex border and civilian environments. Rather than relying on simple bounding boxes or static threat rules, SENTINEL learns local behavioral baselines, isolates group statistical outliers (*Odd-One-Out*), resolves multi-sensor aerial contradictions (*Bird vs. Drone*), and produces transparent **5W Explainable Intelligence Dossiers** for defense operators.*

---

## 🚩 Problem Statement
Traditional CCTV analytics ask: *"What is there?"*  
In real-world border and civilian sectors—where villages, roads, farmland, livestock, and migratory birds overlap—simple object detection produces high false alarm rates. A person walking on a road or a bird flying near a fence is not inherently a threat. 

**SENTINEL asks:**  
1. *"What is the object doing over time?"*  
2. *"Is this behavior normal for this specific location, time, and environment?"*  
3. *"How does this individual compare to the surrounding population?"*  
4. *"What concrete evidence makes this activity an operational anomaly?"*

---

## ⚙️ 11-Stage Intelligence Progression

SENTINEL converts raw CCTV video into explainable tactical intelligence across an 11-stage pipeline:

```
  ┌──────┐     ┌──────────┐     ┌───────┐     ┌────────┐     ┌────────────┐
  │ SEE  │ ──► │ IDENTIFY │ ──► │ TRACK │ ──► │ LOCATE │ ──► │ UNDERSTAND │
  └──────┘     └──────────┘     └───────┘     └────────┘     └────────────┘
                                                                   │
  ┌─────────┐     ┌─────────┐     ┌───────────┐     ┌───────────┐  ▼
  │ EXPLAIN │ ◄── │ CONTEXT │ ◄── │ CORRELATE │ ◄── │ DEVIATION │ ◄─── LEARN NORMAL
  └─────────┘     └─────────┘     └───────────┘     └───────────┘
```

1. **SEE**: Frame extraction and video stream decoding.
2. **IDENTIFY**: Multi-class object detection (Person, Vehicle, Bird, Drone, Animal, Baggage/Object).
3. **TRACK**: Frame-by-frame persistent Track ID assignment with velocity vectors.
4. **LOCATE**: Polygon virtual zone containment evaluation (*Village Sector*, *Road Corridor*, *Restricted Fence*).
5. **UNDERSTAND**: Feature extraction for speed, dwell duration, direction shifts, and route tortuosity.
6. **LEARN NORMAL**: Dynamic local baseline construction representing expected civilian patterns.
7. **DETECT DEVIATION**: Deviation scoring against learned spatial, temporal, and dwell baselines.
8. **CORRELATE**: Chronological event sequence linking (*Approach ➔ Incursion ➔ Dwell ➔ Drop ➔ Exit*).
9. **CONTEXTUALIZE**: Ecological context evaluation (Region, Season, Time of Day, Habitat) + Thermal/Radar simulation.
10. **EVIDENCE FUSION**: Multi-sensor contradiction checks (resolving visual vs. thermal/doppler conflicts).
11. **EXPLAIN**: 5W Explainable Intelligence Dossier generation for human-in-the-loop decision support.

---

## 🌟 Key Features & Innovations

### 1. Multi-Object Tracking & Kinematics Engine
- **Detector**: YOLOv8 multi-class detection.
- **Tracker**: ByteTrack persistent frame-by-frame association.
- **Kinematics**: Real-time velocity vectors (km/h), trajectory history, direction vectoring, and dwell clocks.

### 2. Spatial Intelligence & Interactive Virtual Zones
- Define custom polygonal perimeter zones (*Civilian Village*, *Road Corridor*, *Agricultural Buffer*, *Restricted Border Line*, *Asset Depot*).
- Real-time incursion triggers, zone dwell monitoring, and zone transition matrices.
- Built-in interactive polygon drawer inside the tactical dashboard.

### 3. Odd-One-Out Engine (Group Outlier Detection)
- Population-level behavioral comparison using **Mahalanobis Distance** across multi-dimensional feature space (speed, dwell time, zone proximity, trajectory variance).
- Isolates the exact behavioral anomaly (e.g., `P07`) out of active civilian cohorts (e.g., 40 entities) without hardcoding threat rules.

### 4. Aerial & Ecological Contradiction Engine (Bird vs. Drone)
- Evaluates aerial targets against **Visual + Thermal (LWIR) + Micro-Doppler Radar + Species + Region + Season + Habitat**.
- **Contradiction Resolution**: If visual features indicate a bird, but thermal sensors record **68°C motor heat** and micro-Doppler radar detects **3400 RPM blade rotation**, SENTINEL flags an **Ambiguous Aerial Object / Evidence Conflict** requiring human review.

### 5. 5W Explainable Operator Dossier
Every alert is synthesized into a plain-language tactical briefing for operators:
- **What**: Nature of event (*Behavioral Outlier / Aerial Contradiction / Restricted Incursion*).
- **Where**: Zone coordinates and spatial sector.
- **When**: Timestamped frame sequence and dwell duration.
- **Why**: Statistical deviation metrics and observable evidence signals.
- **Evidence**: Supporting sensor telemetry (Visual, Thermal, Kinematics, Baseline Delta).
- **Operator Actions**: 1-click response (*Acknowledge*, *Mark Civilian*, *Dispatch Patrol*, *Export Dossier*).

### 6. CCTV Matrix & Real-Time Laptop Webcam Mode
- **5 CCTV Camera Matrix**: 1-click switching between live sectors (Burglary, Vandalism, Road Accident, Fighting, Patrol).
- **Real-Time Webcam Mode**: Live webcam motion, presence, and intruder tracking with optional aerial drone simulation triggers.

---

## 🏗️ Architecture & Technology Stack

```
SENTINEL Core Platform
├── Frontend (Tactical Command Center)
│   ├── Framework: React 18 + Vite + TypeScript
│   ├── Canvas Engine: Custom 60 FPS HTML5 Canvas Overlay Renderer
│   ├── UI Components: Tailwind CSS + Lucide React Icons
│   └── Charts: Recharts (Odd-One-Out Scatter & Baseline Histograms)
│
└── Backend (Intelligence Engine)
    ├── Server: Python 3.11 + FastAPI + Uvicorn
    ├── Vision: OpenCV + PyTorch + YOLOv8 + ByteTrack
    ├── Intelligence: NumPy + scikit-learn (Mahalanobis & Baseline Anomaly)
    └── Fusion: Multi-Sensor Contradiction Matrix & 5W Explainability Engine
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.9+**
- **Node.js 18+ and npm**

---

### ⚡ Option 1: One-Click Automated Launcher (Recommended)

Simply double-click or run:
```cmd
start_sentinel.bat
```
> **Note**: `start_sentinel.bat` automatically verifies, installs missing Python and Node dependencies, and launches both the backend and frontend servers.

---

### 🛠️ Option 2: Manual Terminal Execution

#### 1. Install Backend Dependencies
```bash
pip install -r requirements.txt
```

#### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

#### 3. Start Backend Server (Port 8000)
```bash
python app.py
```

#### 4. Start Frontend Dashboard (Port 5173)
```bash
cd frontend
npm run dev
```

- 🛡️ **Tactical Dashboard**: [http://localhost:5173](http://localhost:5173)
- ⚙️ **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🧪 Verification & Automated Test Suite

SENTINEL includes an automated unit & pipeline test suite verifying all 11 intelligence modules:

```bash
python backend/tests/test_pipeline.py
```

**Test Coverage**:
- ✅ Multi-Object Tracker Persistent Track ID Matching
- ✅ Polygon Zone Containment & Incursion Generation
- ✅ Behavioral Baseline Comparison & Mahalanobis Odd-One-Out Ranking
- ✅ Aerial Contradiction Engine (Bird vs. Stealth Drone Thermal/RPM Resolution)
- ✅ 5W Explainable Intelligence Dossier Generation

---

## 📂 Repository Structure

```
SENTINEL/
├── backend/
│   ├── aerial/             # Bird vs Drone, Thermal Engine & Ecological Database
│   ├── fusion/             # Multi-sensor Evidence Fusion & 5W Explainability Engine
│   ├── intelligence/       # Behavioral Baseline, Odd-One-Out & Sequence Engines
│   ├── scenarios/          # Pre-packaged border scenario catalog & synthetic generator
│   ├── spatial/            # Polygon zone geometry & incursion evaluation
│   ├── vision/             # YOLOv8 detector, ByteTrack tracker & frame processor
│   ├── tests/              # Automated unit and integration test suite
│   └── app.py              # FastAPI application server
├── frontend/
│   ├── src/
│   │   ├── components/     # Tactical Canvas, CCTV Feeds, Scatter Plot, Timeline, Dossier
│   │   ├── services/       # REST API client & Tactical Scene Engine (60 FPS)
│   │   ├── types/          # Full TypeScript interfaces
│   │   └── App.tsx         # Main Tactical Command Dashboard
│   └── package.json
├── app.py                  # Root application entry point
├── requirements.txt        # Python backend dependencies
├── start_sentinel.bat      # One-click auto-installer & launcher
├── prd_extracted.txt       # Complete Product Requirements Document
└── README.md               # System Documentation & AI Evaluation Guide
```

---

## ⚖️ Ethical AI & Human Oversight Standard
SENTINEL is built strictly as a **Human-in-the-Loop Decision Support System**.  
- It does **not** predict criminal intent, read psychological states, or declare individuals as threats.  
- All outputs represent **observable behavioral anomalies and evidence conflicts** provided to human defense operators for review and decision making.

---

## 🛡️ License
Developed for Defense & Border Intelligence Automation (Build With Bharat Hackathon).
