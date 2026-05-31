---
name: "sb-skill-distill"
description: "Sprint-cadence skill learning engine — reads all Lessons Learned entries across sb-* skills, session outcome logs, and learnings.md; identifies repeated patterns; proposes routing table improvements. Run alongside retro, once per sprint. This is how StudioBooks skills get smarter over time."
model: sonnet
---

# sb-skill-distill — Skill Learning Engine

One sprint per run. Makes skills smarter by distilling accumulated observations into concrete routing rule changes.

---

## When to Run

Run at the END of each sprint alongside `retro`. Never run per-feature or per-commit. Wait until 5+ sessions have accumulated since the last distillation — check `docs/skill-distillation-*.md` for the last run date.

---

## Step 1 — Collect Observations

**1a. Read Lessons Learned from every sb-* skill:**

```bash
for skill in C:/Users/Work/dotclaude/projects/studiobooks/skills/*/SKILL.md; do
  echo "=== $skill ==="
  grep -A 100 "## Lessons Learned" "$skill" 2>/dev/null | head -40 || true
done
```

**1b. Read recent learnings.md** — last 40 entries (everything since the last distillation date found in `docs/skill-distillation-*.md`).

**1c. Read session outcomes log** — if `docs/session-outcomes.jsonl` exists:

```bash
cat docs/session-outcomes.jsonl 2>/dev/null | tail -20
```

**1d. Read gstack learnings** — if the file exists:

```bash
cat ~/.gstack/projects/dhirajmankar-StudioBooks/learnings.jsonl 2>/dev/null | tail -20
```

**1e. Try claude-flow pattern store** (optional — skip on error):

```js
mcp__claude-flow__agentdb_pattern-search({ query: "routing decision skill outcome studiobooks", limit: 20 })
```

---

## Step 2 — Identify Candidates

Scan all observations for these signal types. Candidate strength = number of independent sources that show the same pattern.

| Signal type | Pattern | Strength threshold |
|-------------|---------|-------------------|
| **Repeated edge case** | Same lesson in 2+ skill Lessons Learned OR 3+ learnings.md entries | Strong (≥2 sources) |
| **Routing threshold wrong** | session-outcomes shows a phase triggered bug_protocol_triggered=true >40% for a task type | Strong |
| **Missing domain signal** | A domain page/feature was worked on but its skill was not auto-invoked | Medium (1 source OK if clear) |
| **New task type** | A Pre-Routing pattern recurs that has no existing row | Medium |
| **Dead routing row** | A routing row was never triggered in the last 10 sessions | Weak (flag only) |

For each candidate, write down:
1. The observation (exact quote from source)
2. Source count and source list
3. Which routing table it improves (Pre-Routing, Phase 0, Phase 0.5 proxy, Phase 1, Phase 2, Phase 3, CLAUDE.md)
4. The exact proposed text change

---

## Step 3 — Classify by Zone

Use `sb-skill-feedback` zone definitions to classify each candidate:

**Zone 2 — Safe to apply automatically:**
- New routing row (doesn't remove or modify existing rows)
- New domain signal added to CLAUDE.md auto-invoke table
- New example added to an execution pattern section
- New model tier row

**Zone 3 — Requires user approval:**
- Threshold change to an existing row
- Removing or replacing an existing routing row
- Changing a step number or format string
- Any change that affects code already written under the old rule

Never apply Zone 3 changes without explicit user confirmation.

---

## Step 4 — Present Report and Apply

Format the output as:

```
═══════════════════════════════════════════════════════
SKILL DISTILLATION REPORT — [date]
Sprint: [branch name or sprint description]
Sessions analyzed: [N] (since [last distillation date])
Observations: [N lessons] + [N learnings.md] + [N outcomes] + [N gstack]
═══════════════════════════════════════════════════════

ZONE 2 — APPLYING AUTOMATICALLY:
[N] candidates

  1. [skill file] — [section]
     ADD: | [trigger text] | [skill to invoke] |
     Evidence: [source1], [source2]
     Confidence: HIGH / MEDIUM

  2. ...

ZONE 3 — NEEDS YOUR APPROVAL:
[N] candidates

  1. [skill file] — [section]
     CHANGE: [what would change]
     Evidence: [source]
     Approve? (y/n)

PATTERNS BELOW THRESHOLD (watch next sprint):
  - [description] (appeared N times, needs N more)

ROUTING ROWS WITH NO RECENT HITS (may be dead):
  - [row description] — last triggered: [date or never]
═══════════════════════════════════════════════════════
```

Apply all Zone 2 changes using sb-skill-feedback protocol. For Zone 3, apply only the ones the user approves.

After applying each change:
1. Edit the source file in `C:\Users\Work\dotclaude\projects\studiobooks\skills\`
2. Add a Lessons Learned entry in the edited skill: `- [date] distillation: promoted from learnings.md — [one sentence]`
3. Run `.claude/sync.ps1` once at the end (not after each edit)

---

## Step 5 — Persist Results

**5a. Write distillation record:**

Create `docs/skill-distillation-YYYY-MM-DD.md`:

```markdown
# Skill Distillation — [date]

Sprint: [description]
Sessions analyzed: [N] (since [previous date])
Observations processed: [N]

## Changes Applied
- [skill] [Zone] [one-line description of what was added]

## Watched Patterns (below threshold this sprint)
- [description] — appeared N times, needs M more

## Dead Routing Rows Flagged
- [row description]
```

**5b. Try storing patterns in claude-flow** (skip on error):

```js
mcp__claude-flow__agentdb_pattern-store({
  key: "skill_distillation_" + date,
  value: {
    sprint: "<branch>",
    changes_applied: N,
    watched_patterns: ["..."],
    next_watch: ["..."]
  }
})
```

**5c. Log gstack learnings** (skip on error):

```bash
~/.claude/skills/gstack/bin/gstack-learnings-log \
  '{"skill":"sb-skill-distill","type":"operational","key":"distillation_run","insight":"Sprint distillation complete: N changes applied to routing tables","confidence":3,"source":"observed"}'
```

---

## ReasoningBank Enhancement (when available)

When ruflo/claude-flow trajectory tools are fully verified, upgrade Steps 1 and 5 with:

```js
// At session start (add to sb-session-end.md Step 0 or a startup hook):
mcp__claude-flow__hooks_intelligence_trajectory-start({
  task: "<session summary>",
  context: { branch, skills_planned }
})

// At session end (add to sb-session-end.md Step 2.5):
mcp__claude-flow__hooks_intelligence_trajectory-end({
  outcome: "success|partial|blocked",
  metrics: { build_passed, tests_passed, bug_protocol_triggered }
})
```

Then in Step 1e of distillation, replace the agentdb_pattern-search with:
```js
mcp__claude-flow__hooks_intelligence_stats({ window: "30d" })
```

This gives attention weights — which routing decisions led to successful outcomes vs. bug protocol triggers — making candidate identification quantitative rather than pattern-matching.

---

## Feedback Protocol

- **Never**: delete existing Lessons Learned entries or Zone 1 routing rows
- **Safe to add**: new routing rows (Zone 2), new examples, new distillation records
- **Breaking changes**: Zone 3 protocol — user approval + version bump

Current version: 1.0

## Lessons Learned

<!-- Format: - [YYYY-MM-DD] context: <task> — <one sentence lesson>. -->
