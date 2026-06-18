# Voice2Law — open the startup terminals in order (Windows PowerShell).
# Run from project root:  .\scripts\start_voice2law.ps1
#
# Current stack (no MongoDB):
#   1) NLP / RAG service  : http://127.0.0.1:8001  (FastAPI + Chroma + Gemini/Groq)
#   2) Backend API        : http://localhost:5000  (Express, proxies answers to NLP)
#   3) Frontend (Vite)    : http://localhost:5173  (React)

$root = Split-Path -Parent $PSScriptRoot
$nlpScript = Join-Path $root "nlp-service\scripts\start_nlp.ps1"
$backendDir = Join-Path $root "backend"
$frontendDir = $root

Write-Host "Opening Voice2Law startup terminals..." -ForegroundColor Cyan
Write-Host "1) NLP/RAG :8001   2) Backend :5000   3) Frontend :5173" -ForegroundColor Gray

# 1) NLP / RAG service (start first — it is the primary answer engine).
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\nlp-service'; & '$nlpScript'"

# Give the NLP service a head start (Chroma index load / embedding preload).
Start-Sleep -Seconds 3

# 2) Backend API (proxies /api/ai/* to the NLP service).
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$backendDir'; npm run dev"

Start-Sleep -Seconds 1

# 3) Frontend (Vite dev server).
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$frontendDir'; npm run dev"

Write-Host "When the NLP window shows 'Application startup complete', run: .\scripts\verify_services.ps1" -ForegroundColor Green
