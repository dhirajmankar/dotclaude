# sync.ps1 — Pull latest StudioBooks .claude config from dotclaude repo
# Run this after pulling dotclaude to get updated skills, commands, agents, helpers.
# Usage: ./sync.ps1

$dotclaudeRepo = "C:\Users\Work\dotclaude"
$src = "$dotclaudeRepo\projects\studiobooks"
$dst = $PSScriptRoot

if (-not (Test-Path $src)) {
    Write-Host "ERROR: dotclaude repo not found at $dotclaudeRepo"
    Write-Host "Clone it first: git clone https://github.com/dhirajmankar/dotclaude $dotclaudeRepo"
    exit 1
}

foreach ($sub in @("skills", "commands", "agents", "helpers")) {
    $subSrc = "$src\$sub"
    if (Test-Path $subSrc) {
        Copy-Item -Recurse -Force -Path $subSrc -Destination $dst
        Write-Host "Synced: $sub"
    }
}

Write-Host "`nDone. StudioBooks .claude synced from dotclaude."
