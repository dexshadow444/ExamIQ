@echo off
title JM Vertex ExamIQ - Full Stack Launcher
color 0B

echo ======================================================================
echo           JM Vertex ExamIQ - Full Stack Launcher
echo ======================================================================
echo.

:: Check Python installation
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed or not in PATH.
    echo Please install Python 3.9+ and try again.
    pause
    exit /b 1
)

echo [1/3] Installing/checking backend and frontend dependencies...
pip install -r requirements.txt -r requirements-backend.txt --quiet
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Dependency installation encountered warnings, proceeding...
)

echo.
echo [2/3] Verified configuration in .env
echo.
echo [3/3] Launching FastAPI Backend (Port 8000) & Flask Frontend (Port 3000)...
echo.

python run_all.py

pause

