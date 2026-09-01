@echo off
echo ===================================================
echo   SENTINEL - Context-Aware Surveillance System
echo ===================================================
echo Starting FastAPI Backend (Port 8000)...
start "SENTINEL Backend" cmd /k "python app.py"

echo Starting React + Vite Frontend (Port 5173)...
start "SENTINEL Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo SENTINEL is launching!
echo Backend:  http://localhost:8000/docs
echo Frontend: http://localhost:5173
echo ===================================================
pause
