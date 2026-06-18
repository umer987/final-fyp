# Voice2Law Startup Script for PowerShell
# Run this from PowerShell in the voice2law directory

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Voice2Law - Quick Start" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install dependencies
Write-Host "[Step 1] Installing dependencies..." -ForegroundColor Yellow
Write-Host "This may take 2-3 minutes on first run..." -ForegroundColor Gray
Write-Host ""

python -m pip install --upgrade -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: pip install failed" -ForegroundColor Red
    Write-Host "Try running: python -m pip install -r requirements.txt" -ForegroundColor Gray
    exit 1
}
Write-Host ""

# Step 2: Run quick setup
Write-Host "[Step 2] Creating sample chunks and indexing..." -ForegroundColor Yellow
python quick_setup.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Setup failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Start server
Write-Host "[Step 3] Starting FastAPI server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Server is running!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Open in browser: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload
