---
name: "sb-session-end"
description: "StudioBooks session-end gate — AUTOMATICALLY invoke before stopping work. Single entry point for ending any work session. Runs verification, syncs 7 mandatory docs, and commits. Never skip. Triggers: 'end of session', 'done for now', 'let's stop', 'wrap up', 'before we stop', anytime work is concluding."
auto-invokes:
  - sb-verify    # Step 1 — lint/build/test gate
  - sb-doc-sync  # Step 2 — sync 7 mandatory docs
  - sb-commit    # Step 3 — commit docs changes
---

# sb-session-end — Session End Gate

## What This Skill Does
Orchestrates the mandatory end-of-session sequence. Three steps in order — never skip any.

---

## Step 1 — Verification Gate

**Invoke the `sb-verify` skill.**

If sb-verify reports `❌ VERIFY FAILED`: stop, fix the issue, re-run verify. Do not proceed to docs until verify passes.

---

## Step 2 — Documentation Sync

**Invoke the `sb-doc-sync` skill.**

This updates the 7 mandatory files based on what changed this session:
1. `CLAUDE.md` — Current Phase line
2. `docs/CONTEXT.md` — Current Status block
3. `memory/project_status.md` — task table, next step, completed commits
4. `README.md` (if structure/setup changed)
5. `docs/ARCHITECTURE.md` (if arch changed)
6. `docs/STORES.md` (if any store was modified)
7. `docs/BUSINESS_LOGIC.md` (if domain logic changed)

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
