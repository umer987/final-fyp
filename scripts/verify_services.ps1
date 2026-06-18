# Voice2Law - verify NLP (8001) + backend (5000), and prove backend -> NLP RAG wiring.
# Run from project root:  .\scripts\verify_services.ps1
$ErrorActionPreference = "Continue"

function Test-Endpoint {
    param([string]$Name, [string]$Url)
    try {
        $r = Invoke-RestMethod -Uri $Url -TimeoutSec 15
        Write-Host "[OK] $Name" -ForegroundColor Green
        $r | ConvertTo-Json -Depth 4
        return $true
    } catch {
        Write-Host "[FAIL] $Name - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

Write-Host "=== Voice2Law service verification ===" -ForegroundColor Cyan

$listeners = netstat -ano | Select-String ":8001\s"
if ($listeners) {
    $count = ($listeners | Measure-Object).Count
    if ($count -gt 2) {
        Write-Host "[WARN] Multiple lines on port 8001 - ensure only ONE uvicorn process." -ForegroundColor Yellow
    }
    $listeners | ForEach-Object { Write-Host $_ }
} else {
    Write-Host "[WARN] Nothing listening on port 8001 - start NLP: nlp-service\scripts\start_nlp.ps1" -ForegroundColor Yellow
}

$okNlp = Test-Endpoint "NLP /health" "http://127.0.0.1:8001/health"
$okBackend = Test-Endpoint "Backend /api/health" "http://localhost:5000/api/health"

# Direct NLP /ask (English) — confirms the RAG engine itself works.
if ($okNlp) {
    Write-Host ""
    Write-Host "--- Direct NLP /ask test ---" -ForegroundColor Cyan
    $body = @{ question = "What is the punishment for theft?"; language = "english" } | ConvertTo-Json -Compress
    try {
        $ask = Invoke-RestMethod -Uri "http://127.0.0.1:8001/ask" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 60
        $flat = ($ask.answer -replace "`r`n", " ")
        $len = [Math]::Min(120, $flat.Length)
        Write-Host "[OK] NLP /ask preview: $($flat.Substring(0, $len))..." -ForegroundColor Green
    } catch {
        Write-Host "[FAIL] NLP /ask - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Backend -> NLP RAG wiring (Urdu) — proves /api/ai/text-query returns a grounded answer.
if ($okBackend) {
    Write-Host ""
    Write-Host "--- Backend /api/ai/text-query (Urdu, proves RAG wiring) ---" -ForegroundColor Cyan
    # Urdu question ("What is the punishment for theft?") as JSON \u escapes to avoid PS encoding issues.
    $payload = '{"question":"\u0686\u0648\u0631\u06cc \u06a9\u06cc \u0633\u0632\u0627 \u06a9\u06cc\u0627 \u06c1\u06d2\u061f"}'
    try {
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        $ask = Invoke-RestMethod -Uri "http://localhost:5000/api/ai/text-query" -Method POST -Body $payload -ContentType "application/json; charset=utf-8" -TimeoutSec 60
        $sw.Stop()
        $flat = ($ask.answer -replace "`r`n", " ")
        $len = [Math]::Min(160, $flat.Length)
        Write-Host "[OK] text-query in $($sw.ElapsedMilliseconds) ms; confidence=$($ask.confidence); sources=$($ask.sources.Count)" -ForegroundColor Green
        Write-Host "     answer: $($flat.Substring(0, $len))..." -ForegroundColor Gray
    } catch {
        Write-Host "[FAIL] backend text-query - $($_.Exception.Message)" -ForegroundColor Red
    }

    # Crash-safety: a Firestore route must NOT take the server down when Firebase is absent.
    Write-Host ""
    Write-Host "--- Crash-safety: GET /api/lawyers without Firebase ---" -ForegroundColor Cyan
    try {
        $law = Invoke-RestMethod -Uri "http://localhost:5000/api/lawyers" -TimeoutSec 15
        Write-Host "[OK] /api/lawyers returned (lawyers count = $($law.lawyers.Count)); server still alive." -ForegroundColor Green
    } catch {
        Write-Host "[INFO] /api/lawyers returned an error (expected if Firebase off): $($_.Exception.Message)" -ForegroundColor Yellow
    }
    $stillUp = Test-Endpoint "Backend /api/health (still alive)" "http://localhost:5000/api/health"
    if (-not $stillUp) { Write-Host "[FAIL] Backend went down after a Firestore route!" -ForegroundColor Red }
}

if (-not $okNlp -or -not $okBackend) {
    Write-Host ""
    Write-Host "Start order: NLP (8001) -> backend (5000) -> frontend (5173)" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "All core services reachable." -ForegroundColor Green
exit 0
