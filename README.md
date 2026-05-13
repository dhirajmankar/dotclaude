# dotclaude

Global Claude Code configuration — skills, settings, and prompts.  
All generic, non-project-specific Claude tooling lives here.

## Structure

```
skills/          ← 25 skills, synced to ~/.claude/skills/
skills-lock.json ← skill registry (name → GitHub source)
config/          ← global CLAUDE.md and settings templates
sync.ps1         ← sync skills into ~/.claude/skills/
```

## Quick start (new machine)

```powershell
git clone https://github.com/dhirajmankar/dotclaude C:\Users\Work\dotclaude
cd C:\Users\Work\dotclaude
.\sync.ps1
```

## Adding a skill

1. Install via superpowers or copy manually into `skills/<name>/`
2. Add an entry to `skills-lock.json` with source info
3. Run `.\sync.ps1` to push to global Claude
4. Commit and push

## Skills reference

| Skill | Source | Purpose |
|-------|--------|---------|
| `do` | thedotmack/claude-mem | Execute phased plans via subagents |
| `make-plan` | thedotmack/claude-mem | Create detailed implementation plans |
| `smart-explore` | thedotmack/claude-mem | Structured codebase exploration |
| `pathfinder` | thedotmack/claude-mem | Navigate unfamiliar codebases |
| `knowledge-agent` | thedotmack/claude-mem | Research + knowledge extraction |
| `mem-search` | thedotmack/claude-mem | Search project memory |
| `timeline-report` | thedotmack/claude-mem | Progress and timeline reports |
| `owasp-security` | hoodini/ai-agents-skills | OWASP security review |
| `security-review` | getsentry/skills | Sentry-style security audit |
| `requesting-code-review` | obra/superpowers | Structure code review requests |
| `frontend-design` | anthropics/skills | Frontend design guidance |
| `hooks-automation` | local | Claude hooks automation |
| `pair-programming` | local | Pair programming workflow |
| `skill-builder` | local | Build new skills |
| `sparc-methodology` | local | SPARC dev methodology |
| `stream-chain` | local | Streaming agent chains |
| `swarm-advanced` | local | Advanced swarm patterns |
| `swarm-orchestration` | local | Swarm orchestration |
| `verification-quality` | local | Output quality verification |
| `claude-code-plugin-release` | thedotmack/claude-mem | Plugin release workflow |
| `bencium-controlled-ux-designer` | local | UX design guidance |
| `emilkowal-animations` | local | Animation patterns |
| `find-skills` | local | Discover installable skills |
| `impeccable` | local | Code quality enforcement |
| `ui-ux-pro-max` | ui-ux-pro-max-skill marketplace | Full UI/UX design system |
