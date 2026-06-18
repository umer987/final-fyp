# Start Voice2Law NLP on port 8001 (kills stale listeners first).
param(
    [switch]$NoKill
)

$port = 8001
$ErrorActionPreference = "SilentlyContinue"

if (-not $NoKill) {
    $pids = @(
        netstat -ano |
            Select-String ":$port\s" |
            ForEach-Object {
                if ($_ -match '\s(\d+)\s*$') { [int]$Matches[1] }
            } |
            Sort-Object -Unique
    )
    foreach ($procId in $pids) {
        if ($procId -gt 0) {
            Write-Host "Stopping stale process on port $port (PID $procId)..." -ForegroundColor Yellow
            taskkill /PID $procId /F 2>$null | Out-Null
        }
    }
    if ($pids.Count -gt 0) { Start-Sleep -Seconds 2 }
}

$still = netstat -ano | Select-String ":$port\s+.*LISTENING"
if ($still) {
    Write-Host "ERROR: Port $port is still in use. Close Task Manager -> python.exe on $port, then retry." -ForegroundColor Red
    $still | ForEach-Object { Write-Host $_ }
    exit 1
}

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location (Join-Path $root "nlp-service")

# Reduce TensorFlow oneDNN crashes on Windows when sentence-transformers loads tf-keras.
$env:TF_ENABLE_ONEDNN_OPTS = "0"
$env:ANONYMIZED_TELEMETRY = "False"

Write-Host "Starting Voice2Law NLP on http://127.0.0.1:$port ..." -ForegroundColor Green
Write-Host "First boot may rebuild the Chroma index on Windows; wait for Application startup complete." -ForegroundColor Gray

& .\venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port $port
