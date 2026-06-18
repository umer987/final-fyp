# One-time project cleanup — moves loose root files into standard folders.
# Run from repo root: .\scripts\reorganize-project.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

function Ensure-Dir($path) {
    if (-not (Test-Path $path)) { New-Item -ItemType Directory -Path $path -Force | Out-Null }
}

function Move-IfExists($from, $toDir) {
    if (-not (Test-Path $from)) { return }
    Ensure-Dir $toDir
    $dest = Join-Path $toDir (Split-Path $from -Leaf)
    if (Test-Path $dest) {
        Write-Host "Skip (exists): $dest" -ForegroundColor Yellow
        return
    }
    Move-Item -LiteralPath $from -Destination $toDir
    Write-Host "Moved: $(Split-Path $from -Leaf) -> $toDir" -ForegroundColor Green
}

Write-Host "Voice2Law project reorganization" -ForegroundColor Cyan

# --- FYP documents ---
$fyp = Join-Path $root "docs\fyp"
Ensure-Dir $fyp
@(
    "Meeting-logbook-COMPLETED-CONTENT.md",
    "Meeting-logbook-COMPLETED.docx",
    "Meeting-logbook-UPDATED.docx",
    "Meeting logbook.pdf",
    "final report.docx",
    "Sample Report for FYP2.pdf",
    "Voice2Law_FYP2_Report.docx",
    "Voice2Law_FYP2_Report.pdf"
) | ForEach-Object { Move-IfExists (Join-Path $root $_) $fyp }

# --- Legal PDFs -> nlp-service/legal_data (canonical ingest location) ---
$legal = Join-Path $root "nlp-service\legal_data"
Move-IfExists (Join-Path $root "Family law 1.pdf") (Join-Path $legal "family")
Move-IfExists (Join-Path $root "Family law 3.pdf") (Join-Path $legal "family")
Move-IfExists (Join-Path $root "Pakistan Penal Code.pdf") (Join-Path $legal "penal")
Move-IfExists (Join-Path $root "LAND PROPERTY .pdf") (Join-Path $legal "property")
# Root copy is duplicate if already under legal_data/criminal
$criminalDest = Join-Path $legal "criminal\Criminal law DataSet.pdf"
$criminalRoot = Join-Path $root "Criminal law DataSet.pdf"
if ((Test-Path $criminalRoot) -and (Test-Path $criminalDest)) {
    Remove-Item -LiteralPath $criminalRoot -Force
    Write-Host "Removed duplicate: Criminal law DataSet.pdf (kept nlp-service copy)" -ForegroundColor Green
} else {
    Move-IfExists $criminalRoot (Join-Path $legal "criminal")
}
# Remove root PDFs when canonical copy already exists in legal_data
@(
    @{ Root = "Family law 1.pdf"; Dest = Join-Path $legal "family\Family law 1.pdf" },
    @{ Root = "Family law 3.pdf"; Dest = Join-Path $legal "family\Family law 3.pdf" },
    @{ Root = "Pakistan Penal Code.pdf"; Dest = Join-Path $legal "penal\Pakistan Penal Code.pdf" },
    @{ Root = "LAND PROPERTY .pdf"; Dest = Join-Path $legal "property\LAND PROPERTY .pdf" }
) | ForEach-Object {
    $rp = Join-Path $root $_.Root
    if ((Test-Path $rp) -and (Test-Path $_.Dest)) {
        Remove-Item -LiteralPath $rp -Force
        Write-Host "Removed duplicate root: $($_.Root)" -ForegroundColor Green
    } else {
        Move-IfExists $rp (Split-Path $_.Dest -Parent)
    }
}

# --- Legacy prototype ---
$legacy = Join-Path $root "legacy"
Ensure-Dir $legacy
$v2l = Join-Path $root "voice2law"
if (Test-Path $v2l) {
    $legacyV2l = Join-Path $legacy "voice2law"
    if (-not (Test-Path $legacyV2l)) {
        try {
            Move-Item -LiteralPath $v2l -Destination $legacyV2l -ErrorAction Stop
            Write-Host "Moved: voice2law -> legacy\voice2law" -ForegroundColor Green
        } catch {
            Write-Host "Could not move voice2law (folder in use). See legacy\README.md" -ForegroundColor Yellow
        }
    }
}

# --- Postman -> tools ---
$toolsPostman = Join-Path $root "tools\postman"
$postman = Join-Path $root "postman"
if (Test-Path $postman) {
    Ensure-Dir (Join-Path $root "tools")
    if (-not (Test-Path $toolsPostman)) {
        Move-Item -LiteralPath $postman -Destination $toolsPostman
        Write-Host "Moved: postman -> tools\postman" -ForegroundColor Green
    }
}

# --- Admin guide out of src ---
$guides = Join-Path $root "docs\guides"
$adminGuide = Join-Path $root "src\ADMIN_SECURITY_GUIDE.md"
if (Test-Path $adminGuide) {
    Move-IfExists $adminGuide $guides
}

# --- Empty root data folder ---
$dataRoot = Join-Path $root "data"
if (Test-Path $dataRoot) {
    $items = Get-ChildItem $dataRoot -Force -ErrorAction SilentlyContinue
    if (-not $items -or $items.Count -eq 0) {
        Remove-Item $dataRoot -Force -ErrorAction SilentlyContinue
        Write-Host "Removed empty root data/ folder" -ForegroundColor Green
    } else {
        Write-Host "Kept root data/ (not empty)" -ForegroundColor Yellow
    }
}

Write-Host "`nDone. See README.md and docs/PROJECT_STRUCTURE.md" -ForegroundColor Cyan
