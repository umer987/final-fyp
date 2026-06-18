@echo off
REM Voice2Law Startup Script for Windows
REM This script installs dependencies and starts the API server

echo ============================================
echo Voice2Law - Quick Start
echo ============================================
echo.

REM Navigate to voice2law directory
cd /d "%~dp0voice2law"
echo Working directory: %cd%
echo.

REM Step 1: Install dependencies
echo [Step 1] Installing dependencies...
echo This may take 2-3 minutes on first run...
echo.
python -m pip install --upgrade -r requirements.txt
if errorlevel 1 (
    echo Error: pip install failed
    echo Try: python -m pip install -r requirements.txt
    pause
    exit /b 1
)
echo.

REM Step 2: Run quick setup
echo [Step 2] Creating sample chunks and indexing...
python quick_setup.py
if errorlevel 1 (
    echo Error: Setup failed
    pause
    exit /b 1
)
echo.

REM Step 3: Start server
echo [Step 3] Starting FastAPI server...
echo.
echo ========================================
echo Server is running!
echo ========================================
echo.
echo Open in browser: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo.

uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload

pause
