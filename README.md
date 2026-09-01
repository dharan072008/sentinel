# SENTINEL — Context-Aware Tactical Surveillance System 🛡️

> **"Detection is easy, Context is everything."**  
> SENTINEL does not just detect objects — it understands normal vs abnormal behavior in complex border, road, and village environments, identifies statistical outliers (*Odd-One-Out*), verifies aerial signatures through ecological and thermal context, and produces transparent **5W Explainable Intelligence Dossiers** for human defense operators.

---

## 🌟 Key Architecture & Capabilities

1. **Multi-Object Tracking & Kinematics**:
   - YOLOv8-powered multi-class detection (Person, Vehicle, Bird, Drone, Animal, Object).
   - Frame-by-frame persistent Track IDs with velocity vectors, trajectory history, and dwell clocks.

2. **Spatial Intelligence & Virtual Zones**:
   - Arbitrary polygonal perimeter zones (*Village*, *Road Corridor*, *Agricultural Buffer*, *Restricted Fence Line*, *Asset Depot*).
   - Interactive zone drawer in the dashboard.

3. **Behavioral Baseline & Anomaly Intelligence**:
   - Learned normal movement patterns (e.g., `Road ➔ Shop ➔ Road ➔ Home`).
   - Deviation scoring for suspicious sequences (`Road ➔ Restricted Perimeter ➔ Long Dwell ➔ Unattended Baggage ➔ Exit`).

4. **Odd-One-Out Engine (Group Outlier Detection)**:
   - Evaluates active population clusters (e.g. 40 people) using Mahalanobis distance to identify the specific behavioral outlier (`P07`).

5. **Aerial & Ecological Context Verification**:
   - Evaluates aerial silhouettes against **Visual + Thermal (LWIR) + Doppler Radar + Species + Region + Season + Time of Day + Habitat**.
   - Resolves multi-sensor contradictions (e.g. *Visual says Bird, but Thermal shows 68°C motor heat and 3400 RPM blade rotation* ➔ **Evidence Conflict / Ambiguous Aerial Object**).

6. **5W Explainable Operator Dossier**:
   - Plain-language evidence reasoning: *Why* it is unusual, what observable facts were recorded, and recommendations for human operator review.

7. **5 Multi-Camera CCTV Feeds & Real-Time Laptop Webcam Mode**:
   - Interactive CCTV Matrix featuring 5 live camera sectors with 1-click simulation.
   - Real-time laptop webcam motion and presence tracker with simulated intruder and aerial drone triggers.

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.9+
- Node.js 18+ and npm

### 1. Install Backend Dependencies
```bash
pip install -r requirements.txt
```

### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

### 3. Launch System
**Option A: One-Click Windows Launcher**
```cmd
start_sentinel.bat
```

**Option B: Manual Terminals**
```bash
# Terminal 1 - Backend Server (FastAPI on Port 8000)
python app.py

# Terminal 2 - Tactical Frontend (Vite on Port 5173)
cd frontend
npm run dev
```

- **Frontend Dashboard**: [http://localhost:5173](http://localhost:5173)
- **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📂 Project Structure

```
SENTINEL/
├── backend/
│   ├── aerial/             # Bird vs Drone, Thermal simulation & Ecological database
│   ├── fusion/             # Multi-sensor Evidence Fusion & 5W Explainability engine
│   ├── intelligence/       # Behaviour, Baseline, Odd-One-Out & Sequence engines
│   ├── scenarios/          # Pre-packaged border scenario catalog & generators
│   ├── spatial/            # Polygon zone geometry & incursion evaluation
│   ├── vision/             # YOLOv8 detector, tracker & video streamer
│   ├── tests/              # Automated unit and integration tests
│   └── app.py              # FastAPI application server
├── frontend/
│   ├── src/
│   │   ├── components/     # Tactical Canvas, CCTV Feeds, Scatter Plot, Timeline, Dossier
│   │   ├── services/       # REST API client & Tactical Scene Engine (60 FPS)
│   │   ├── types/          # Full TypeScript interfaces
│   │   └── App.tsx         # Main Tactical Command Dashboard
│   └── package.json
├── requirements.txt
├── start_sentinel.bat
└── README.md
```

---

## 🛡️ License
Built for Defense and Border Intelligence Automation.
