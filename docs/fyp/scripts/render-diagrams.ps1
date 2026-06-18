# Render Voice2Law FYP diagram Mermaid sources to PNG
$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..\..")
$diagramsDir = Join-Path $root "docs\fyp\diagrams"
$imagesDir = Join-Path $root "docs\fyp\images"
$tempDir = Join-Path $root "docs\fyp\.mermaid-temp"

New-Item -ItemType Directory -Force -Path $imagesDir | Out-Null
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

$map = [ordered]@{
    "01-system-architecture.md"     = "fig-4-1-system-architecture.png"
    "02-rag-pipeline.md"            = "fig-4-2-rag-pipeline.png"
    "03-data-flow-sequence.md"      = "fig-4-3-data-flow-sequence.png"
    "04-use-case-diagram.md"        = "fig-4-4-use-case-diagram.png"
    "05-database-schema.md"         = "fig-4-5-database-schema.png"
    "06-component-module.md"        = "fig-4-6-component-module.png"
    "07-deployment-diagram.md"      = "fig-4-7-deployment-diagram.png"
}

$configPath = Join-Path $tempDir "mermaid-config.json"
$configJson = @'
{
  "theme": "neutral",
  "themeVariables": {
    "background": "#ffffff",
    "primaryColor": "#E8F5ED",
    "primaryTextColor": "#0B3D2E",
    "primaryBorderColor": "#1FAA59",
    "lineColor": "#64748B",
    "secondaryColor": "#F8FAFC",
    "tertiaryColor": "#FFFFFF",
    "fontFamily": "Segoe UI, Arial, sans-serif"
  },
  "flowchart": { "htmlLabels": true, "curve": "basis" },
  "sequence": { "mirrorActors": false }
}
'@
[System.IO.File]::WriteAllText($configPath, $configJson)

foreach ($entry in $map.GetEnumerator()) {
    $src = Join-Path $diagramsDir $entry.Key
    $content = Get-Content $src -Raw
    if ($content -match '(?s)```mermaid\r?\n(.*?)```') {
        $mermaid = $Matches[1].TrimEnd()
    } else {
        throw "No mermaid block in $src"
    }
    $mmd = Join-Path $tempDir ($entry.Key -replace '\.md$', '.mmd')
    $out = Join-Path $imagesDir $entry.Value
    [System.IO.File]::WriteAllText($mmd, $mermaid)
    Write-Host "Rendering $($entry.Value) ..."
    npx --yes @mermaid-js/mermaid-cli@11.4.0 `
        -i $mmd `
        -o $out `
        -b white `
        -w 1400 `
        -H 900 `
        -c $configPath
    if (-not (Test-Path $out)) { throw "Failed to create $out" }
}

Write-Host "Done. Images saved to $imagesDir"
