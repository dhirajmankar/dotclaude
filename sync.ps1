# sync.ps1 — Sync skills and project configs from this repo to the local machine
# Run this after pulling updates or adding new skills.
# Usage: ./sync.ps1

# ── Global skills → ~/.claude/skills/ ────────────────────────────────────────
$globalSrc = "$PSScriptRoot\skills"
$globalDst = "$env:USERPROFILE\.claude\skills"

if (-not (Test-Path $globalDst)) {
    New-Item -ItemType Directory -Force -Path $globalDst | Out-Null
}

$globalSkills = Get-ChildItem -Path $globalSrc -Directory
foreach ($skill in $globalSkills) {
    $destPath = "$globalDst\$($skill.Name)"
    Copy-Item -Recurse -Force -Path $skill.FullName -Destination $destPath
    Write-Host "Synced global: $($skill.Name)"
}
Write-Host "Done. $($globalSkills.Count) global skills synced to $globalDst`n"

# ── Project skills → <project>/.claude/ ──────────────────────────────────────
# Paths vary per machine — configure in projects.local.json (gitignored).
# Example projects.local.json:
#   { "studiobooks": "C:\\Users\\Work\\StudioBooks\\.claude" }

$localConfig = "$PSScriptRoot\projects.local.json"
if (-not (Test-Path $localConfig)) {
    Write-Host "No projects.local.json found — skipping project sync."
    Write-Host "Create projects.local.json to sync project-level configs."
    exit 0
}

$projects = Get-Content $localConfig -Raw | ConvertFrom-Json
$projectCount = 0

foreach ($project in $projects.PSObject.Properties) {
    $name    = $project.Name
    $dotClaude = $project.Value
    $srcDir  = "$PSScriptRoot\projects\$name"

    if (-not (Test-Path $srcDir)) {
        Write-Host "Skipping $name — no projects/$name/ in repo."
        continue
    }
    if (-not (Test-Path $dotClaude)) {
        New-Item -ItemType Directory -Force -Path $dotClaude | Out-Null
    }

    # Sync each subdirectory (skills, commands, agents, helpers)
    foreach ($sub in @("skills", "commands", "agents", "helpers")) {
        $subSrc = "$srcDir\$sub"
        $subDst = "$dotClaude\$sub"
        if (Test-Path $subSrc) {
            Copy-Item -Recurse -Force -Path $subSrc -Destination $dotClaude
            Write-Host "Synced $name/$sub -> $subDst"
        }
    }

    # Copy project settings.json (hooks, etc.)
    $settingsSrc = "$srcDir\settings.json"
    if (Test-Path $settingsSrc) {
        Copy-Item -Force -Path $settingsSrc -Destination "$dotClaude\settings.json"
        Write-Host "Synced $name/settings.json -> $dotClaude\settings.json"
    }

    $projectCount++
}

Write-Host "`nDone. $projectCount project(s) synced."
