# sync.ps1 — Copy skills from this repo into ~/.claude/skills/
# Run this after pulling updates or adding new skills.
# Usage: ./sync.ps1

$src = "$PSScriptRoot\skills"
$dst = "$env:USERPROFILE\.claude\skills"

if (-not (Test-Path $dst)) {
    New-Item -ItemType Directory -Force -Path $dst | Out-Null
}

$skills = Get-ChildItem -Path $src -Directory
foreach ($skill in $skills) {
    $destPath = "$dst\$($skill.Name)"
    Copy-Item -Recurse -Force -Path $skill.FullName -Destination $destPath
    Write-Host "Synced: $($skill.Name)"
}

Write-Host "`nDone. $($skills.Count) skills synced to $dst"
