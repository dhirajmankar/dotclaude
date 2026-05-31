---
name: "sb-session-end"
description: "StudioBooks session-end gate — AUTOMATICALLY invoke before stopping work. Single entry point for ending any work session. Runs verification, syncs 8 docs, appends learnings, and commits. Never skip. Triggers: 'end of session', 'done for now', 'let's stop', 'wrap up', 'before we stop', anytime work is concluding."
auto-invokes:
  - sb-verify    # Step 1 — lint/build/test gate
  - sb-doc-sync  # Step 2 — sync 8 docs
  - sb-commit    # Step 4 — commit docs changes
---

# sb-session-end — Session End Gate

## What This Skill Does
Orchestrates the mandatory end-of-session sequence. Three steps in order — never skip any.

---

## Step 1 — Verification Gate

**Invoke the `sb-verify` skill.**

If sb-verify reports `❌ VERIFY FAILED`: stop. Invoke `investigate` then `superpowers:systematic-debugging` to diagnose root cause before attempting any fix. Never inline-patch on a verify failure. After fix, re-run sb-verify. Do not proceed to docs until verify passes.

---

## Step 2 — Documentation Sync

**Invoke the `sb-doc-sync` skill.**

This updates up to 8 docs based on what changed this session:
1. `CLAUDE.md` — Current Phase line
2. `docs/CONTEXT.md` — Current Status block
3. `memory/project_status.md` — task table, next step, completed commits
4. `README.md` (if structure/setup changed)
5. `docs/ARCHITECTURE.md` (if arch changed)
6. `docs/STORES.md` (if any store was modified)
7. `docs/BUSINESS_LOGIC.md` (if domain logic changed)
8. `docs/DECISIONS.md` (only if `architecture-decision` skill was invoked this session)

---

## Step 2.5 — Log Session Outcome

Append one JSON line to `docs/session-outcomes.jsonl` (create if missing). This file is the dataset `sb-skill-distill` uses to improve routing rules over time.

```bash
# Get current branch
BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
```

Write one line with these fields:

```json
{
  "date": "YYYY-MM-DD",
  "branch": "<current branch>",
  "session_summary": "<2–4 words matching the sb-doc-sync CONTEXT.md update>",
  "phase_used": "<direct|single-subagent|subagent-driven|sparc|mixed>",
  "skills_invoked": ["<list every skill explicitly invoked this session>"],
  "bug_protocol_triggered": false,
  "build_passed": true,
  "tests_passed": true,
  "outcome": "<success|partial|blocked>"
}
```

**How to fill the fields:**
- `phase_used`: what Phase 1 execution pattern was used (Direct if <3 files inline, single-subagent if 1 Agent call, etc.)
- `skills_invoked`: literal skill names that were Skill()-invoked this session (not domain skills that fired automatically)
- `bug_protocol_triggered`: true if Mid-Execution Bug Protocol was invoked at any point
- `outcome`: success = task done + all gates passed; partial = task done but some gate skipped; blocked = couldn't complete

Optional — try, skip on error:
```js
mcp__claude-flow__hooks_intelligence_trajectory-end({
  outcome: "<success|partial|blocked>",
  metrics: { build_passed: true, tests_passed: true, bug_protocol_triggered: false }
})
```

---

## Step 3 — Append Learnings

Open `learnings.md` at the project root. Append any non-obvious discoveries from this session:
- Plugin issues or version conflicts
- Business logic decisions or constraints discovered
- Gotchas or invariants that would surprise future-Claude
- Patterns that worked or failed

Format: `- [YYYY-MM-DD] <context>: <task> — <one sentence lesson>.`

Skip if nothing non-obvious happened this session. **Never append obvious things** ("added a new component", "fixed a typo").

---

## Step 4 — Commit the Docs Changes

**Invoke the `sb-commit` skill** with type `chore` for the docs updates.

> **Skip sb-verify inside sb-commit** — it already ran in Step 1 above. When sb-commit prompts to run sb-verify, skip that sub-step. Running lint + build + tests twice per session-end is wasteful. Step 1 of this skill is the verify gate; sb-commit here is only for staging and committing.

Suggested message format:
```
chore: update session docs — <2-3 word summary of what was built>
```

Examples:
```
chore: update session docs — TDS Tax Centre complete
chore: update session docs — invoice register shipped
chore: update session docs — auth flow fixed
```

Stage only the docs files (CLAUDE.md, docs/*.md, memory/*.md). Do not bundle with feature code.

---

## Composability

- **Depends on:** `sb-verify` (Step 1), `sb-doc-sync` (Step 2), `sb-commit` (Step 3)
- These three skills are always run in order — never rearrange

---

## Feedback Protocol

Update rules governed by `sb-skill-feedback` skill. Summary:
- **Never change:** the three-step order (verify → doc-sync → commit)
- **Safe to add:** new examples, new `## Lessons Learned` entries
- **Breaking changes:** require version bump + user approval

Current version: 1.0

## Lessons Learned

<!-- Format: - [YYYY-MM-DD] context: <task> — <one sentence lesson>. -->
- [2026-05-20] skill gap audit: sb-orchestrate review — failure path "stop, fix the issue" had no escalation routing; added `investigate` + `systematic-debugging` before any fix attempt.
