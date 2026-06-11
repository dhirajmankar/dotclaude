# dotclaude

Global and project-level Claude Code configuration — skills, commands, agents, and helpers.

## Structure

```
skills/                  ← 25 global skills, synced to ~/.claude/skills/
projects/
  studiobooks/           ← StudioBooks project config
    skills/              ← sb-*, v3-*, agentdb-*, github-*, reasoningbank-*
    commands/
    agents/
    helpers/
skills-lock.json         ← global skill registry (name → source)
sync.ps1                 ← syncs global + project skills to the local machine
projects.local.json      ← machine-specific project paths (gitignored, create manually)
config/                  ← global CLAUDE.md and settings templates
```

## Quick start (new machine)

```powershell
git clone https://github.com/dhirajmankar/dotclaude C:\Users\Work\dotclaude
cd C:\Users\Work\dotclaude

# 1. Create projects.local.json with paths for projects you have checked out
#    (see "Project path config" below)

# 2. Run sync — installs global skills + project configs
.\sync.ps1
```

## Project path config

`projects.local.json` maps project names to their `.claude` directories.
This file is gitignored because paths differ per machine.

```json
{
  "studiobooks": "C:\\Users\\Work\\StudioBooks\\.claude"
}
```

Create it manually after cloning. Only include projects you have checked out locally.

## How Claude Code finds skills

Claude Code loads skills from two places:
- **Global:** `~/.claude/skills/` — available in every project
- **Project-level:** `<project_root>/.claude/skills/` — loaded when working in that project

`sync.ps1` writes to both locations so skills are always discoverable.

## Adding a global skill

1. Add the skill folder to `skills/<name>/`
2. Add an entry to `skills-lock.json`
3. Run `.\sync.ps1`
4. Commit and push

## Adding a project-level skill

1. Add the skill folder to `projects/<project>/skills/<name>/`
2. Run `.\sync.ps1` — it copies the skill into the project's `.claude/skills/`
3. Commit and push

## Global skills reference

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

## StudioBooks project skills

| Skill | Purpose |
|-------|---------|
| `sb-orchestrate` | Task router — entry point for all multi-step work |
| `sb-session-end` | Session-end gate — verify → doc-sync → commit |
| `sb-commit` | Smart commit with verification gate |
| `sb-verify` | Lint + build + test gate |
| `sb-doc-sync` | Diff-based sync of 8 mandatory docs (7 + DECISIONS.md on arch changes) |
| `sb-design-audit` | Pre-commit design token checker |
| `ui-ux-mindset` | Kole Jain's 4-question pre-design framework, 60-30-10 color rules, 11 CSS micro-animation recipes |
| `sb-invoice-tax` | Invoice + tax knowledge hub (routes to sub-skills) |
| `sb-gst-calc` | GST calculation rules |
| `sb-tds-rules` | TDS rules (Income Tax Act 2025) |
| `sb-gstin-validate` | GSTIN format + checksum validation |
| `sb-deal-build` | Deal feature builder (routes to sub-skills) |
| `sb-deal-calc` | Deal financial calculation formulas |
| `sb-deal-stages` | Deal pipeline state machine |
| `sb-react-patterns` | React + Zustand patterns for this codebase |
| `sb-graph-navigate` | Graph-first file discovery (85% cheaper than Grep) |
| `sb-skill-audit` | Skill graph consistency checker |
| `sb-skill-feedback` | Skill update protocol |
| `sb-skill-creator` | New skill lifecycle (gap → build via skill-creator → wire) |
| `sb-skill-audit` | Skill graph consistency checker |
