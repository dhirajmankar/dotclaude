---
name: "sb-skill-audit"
description: "StudioBooks skill graph audit — invoke before any PR, when skills feel stale or not auto-firing correctly, or after adding a new skill. Verifies all CLAUDE.md triggers are covered by skill descriptions, no conflicts exist between skills, and all sb-* skills have Feedback Protocol and Lessons Learned sections. Reports coverage gaps and consistency issues."
model: sonnet
---

# sb-skill-audit — Skill Graph Audit

## What This Skill Does
As the skill library grows, trigger phrases can drift, new skills can conflict with existing ones, and feedback sections can be forgotten. This utility does a consistency check across the whole skill graph and CLAUDE.md.

---

## Execution Steps

### Step 1 — Read CLAUDE.md auto-invocation table

Read `CLAUDE.md` section `## Auto-invoked skills`. Extract every trigger → skill mapping.

### Step 2 — Read all sb-* skill descriptions

For each skill in `.claude/skills/sb-*/SKILL.md`, extract:
- `name:` (frontmatter)
- `description:` (frontmatter — the trigger phrases)
- Whether `## Feedback Protocol` section exists
- Whether `## Lessons Learned` section exists
- Count of entries in Lessons Learned (0 is fine)
- `version:` if present

### Step 3 — Check trigger coverage

For each row in CLAUDE.md auto-invocation table:
- Does the listed skill's description contain phrases that would match the trigger?
- If not: flag as `❌ COVERAGE GAP`

### Step 4 — Check for conflicts

For any two skills with overlapping trigger phrases:
- Do they serve different scopes (leaf vs orchestrator)? → fine
- Do they both claim to be the entry point for the same task? → `⚠️ CONFLICT`

### Step 5 — Check feedback completeness

For every `sb-*` skill in `.claude/skills/`:
- Has `## Feedback Protocol` section? If not: `❌ MISSING`
- Has `## Lessons Learned` section? If not: `❌ MISSING`

### Step 6 — Report

```
🔍 SKILL AUDIT REPORT  [date]
─────────────────────────────────
  CLAUDE.md triggers:    <N> defined
  Skills scanned:        <M> sb-* skills
  
  COVERAGE
  ✅ All triggers covered    |  ❌ <K> uncovered:
    - "<trigger>" → no matching skill description

  CONFLICTS
  ✅ No conflicts            |  ⚠️ <list>:
    - "<skill A>" and "<skill B>" both trigger on "<phrase>"

  FEEDBACK SECTIONS
  ✅ All present             |  ❌ Missing in:
    - sb-<name>: missing Feedback Protocol
    - sb-<name>: missing Lessons Learned

  LESSONS LEARNED
  Total entries: <N> across all skills
  Most active skill: <name> (<N> entries)

  VERSIONS
  <skill>: v<N>   (list only skills with explicit version)

  RESULT: ✅ GRAPH CONSISTENT  |  ❌ FIX REQUIRED
```

---

## When to Run

- Before any PR that adds or changes skills
- When a skill isn't auto-firing and you can't figure out why
- After adding a new row to CLAUDE.md auto-invocation table
- After a new `sb-*` skill is created
- Periodically (after 3+ sessions of skill usage)

---

## Fixing Issues Found

| Issue | Fix |
|-------|-----|
| Coverage gap | Update CLAUDE.md trigger row OR update skill description to include the trigger phrase |
| Conflict | Clarify in the description which skill is the entry point and which is leaf |
| Missing feedback protocol | Append section to the skill file (addable zone — safe) |
| Missing lessons learned | Append empty section to the skill file |
| Version drift | Check if breaking change log was written; if rule changed without log, flag for user review |

---

## Feedback Protocol

Update rules governed by `sb-skill-feedback` skill. Summary:
- **Never change:** reporting format block, step numbers, skill name, trigger phrases
- **Safe to add:** new check steps, new report rows, new `## Lessons Learned` entries
- **Breaking changes:** require version bump + user approval + migration note

Current version: 1.0

## Lessons Learned

<!-- Entries added after each invocation where a new edge case, canonical pattern, or rule clarification was discovered. -->
<!-- Format: - [YYYY-MM-DD] context: <task> — <one sentence lesson>. -->
- [2026-05-20] distillation: promoted from learnings.md session 2 — skills live in TWO locations: (1) `~/.claude/skills/` global (dotclaude sync + gstack install), (2) `.claude/skills/` project-level (dotclaude sync via sync.ps1); `.agents/skills/` was an old Ruflo path, no longer used; when a skill listed in CLAUDE.md can't be found, check both locations before assuming it doesn't exist.
- [2026-05-31] updated: gstack sub-skills (investigate, qa, ship, etc.) have preamble-tier ≥ 2 which previously excluded them from the Skill tool available list; copying them into dotclaude project skills causes the discovery algorithm to expose ALL gstack skills — not just the copied ones.
- [2026-05-20] distillation: promoted from learnings.md session 8 — the reliable method for finding unwired skills is: `ls ~/.claude/skills/gstack/` vs all skill names in CLAUDE.md trigger rows; any installed skill with no trigger row is a gap; this found 12 unwired gstack skills in one pass.
- [2026-05-20] audit run: post-distillation audit — when CLAUDE.md trigger phrases are broadened for a skill (e.g. sb-react-patterns expanded from "useState/useEffect" to "any JSX/TSX file"), always update the skill's frontmatter description to match or the skill won't auto-fire on the new trigger phrases.
