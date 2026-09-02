@echo off
echo ===================================================
echo   SENTINEL - Context-Aware Surveillance System
echo ===================================================

echo [1/3] Checking & Installing Backend Dependencies...
python -m pip install -r requirements.txt

if not exist "frontend\node_modules\" (
    echo [2/3] Installing Frontend Dependencies (npm install)...
    cd frontend
    cmd /c npm install
    cd ..
) else (
    echo [2/3] Frontend dependencies already installed.
)

echo [3/3] Launching SENTINEL Intelligence System...
echo Starting FastAPI Backend (Port 8000)...
start "SENTINEL Backend" cmd /k "python app.py"

echo Starting React + Vite Frontend (Port 5173)...
start "SENTINEL Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo   SENTINEL is online!
echo   Frontend Dashboard: http://localhost:5173
echo   Backend API Docs:   http://localhost:8000/docs
echo ===================================================
pause

