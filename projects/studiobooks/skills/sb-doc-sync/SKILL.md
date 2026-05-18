---
name: "sb-doc-sync"
description: "StudioBooks documentation sync — invoke ONCE per session via sb-session-end Step 2 only. Do NOT auto-invoke after individual tasks mid-session. Can also be run standalone with /sb-doc-sync when docs feel stale between sessions. Updates 7 mandatory files: CLAUDE.md, CONTEXT.md, memory/project_status.md, README.md, ARCHITECTURE.md, STORES.md, BUSINESS_LOGIC.md — stale sections only."
---

# sb-doc-sync — Documentation Sync

## What This Skill Does
Performs a targeted diff-based update of the 7 mandatory session docs. Does **not** rewrite files wholesale — reads each file, compares against what actually changed this session, and updates only the sections that are now stale.

---

## The 7 Files (update in this order)

| # | File | What to update |
|---|------|----------------|
| 1 | `CLAUDE.md` | `**Current Phase:**` line — what's now done, what's next |
| 2 | `docs/CONTEXT.md` | `**Current Status**` block — phase, branch, test count, last session summary |
| 3 | `memory/project_status.md` | task table rows, next step, completed commits |
| 4 | `README.md` | Quick-start, project structure, design rules if changed |
| 5 | `docs/ARCHITECTURE.md` | Routing, auth, data layer, security, testing — only if those changed |
| 6 | `docs/STORES.md` | Store state shapes and actions — only if a store was modified |
| 7 | `docs/BUSINESS_LOGIC.md` | Subscription, GST/TDS, referral, domain logic — only if those changed |

> Files 4–7 are conditional: skip them if nothing in their domain changed this session.

---

## Execution Steps

### Step 1 — Audit what changed
```bash
git diff HEAD --name-only
git diff --cached --name-only
```
Build a mental list: which domains were touched? (UI, stores, auth, business logic, config)

### Step 2 — Update CLAUDE.md (always)
- Read current `**Current Phase:**` line
- Rewrite it: move completed work into the "Completed" list, update "Next:" to the next task
- Do NOT change any other section unless explicitly relevant

### Step 3 — Update docs/CONTEXT.md (always)
- Update `**Phase:**` — current status phrase
- Update `**Branch:**` — current branch
- Update `**Tests:**` — current passing count from last sb-verify run
- Update `**Last session:**` — today's date + 2-sentence summary of what was done
- Update `**IMPORTANT for next dev:**` — exact next step

### Step 4 — Update memory/project_status.md (always)
Memory file path: `C:\Users\Work\.claude\projects\C--Users-Work-StudioBooks\memory\project_status.md`
- Mark completed tasks as ✅ in the task table
- Update "Next steps" section
- Add completed commits to the completed block

### Step 5 — Update README.md (if structure/setup changed)
Skip if: only feature code was added, no new routes, no new env vars, no new dependencies.
Update if: new pages added, new stores, new env vars, new npm scripts.

### Step 6 — Update docs/ARCHITECTURE.md (if arch changed)
Skip if: no routing changes, no auth changes, no new stores, no new data layer patterns.

### Step 7 — Update docs/STORES.md (if any store was modified)
For each modified store: update its state shape table and action list.

### Step 8 — Update docs/BUSINESS_LOGIC.md (if domain logic changed)
Skip if: only UI changes. Update if: subscription rules, GST/TDS, deal pipeline, invoicing logic changed.

---

## Writing Rules

- **Be a journalist, not a copywriter.** State facts: what was built, what it does.
- **No AI-sounding phrases.** Not "seamless", "powerful", "comprehensive".
- **Dates must be absolute.** Write `2026-05-16`, not "today" or "this session".
- **Keep sections concise.** CONTEXT.md Current Status = 4–6 lines max.
- **Don't pad.** If nothing changed in a section, don't touch it.

---

## Composability

- **Called by:** `sb-session-end` as its second step
- **Standalone use:** `/sb-doc-sync` — run this anytime docs feel out of sync
- Does **not** call any other skill

---

## Feedback Protocol

Update rules governed by `sb-skill-feedback` skill. Summary:
- **Never change:** the 7-file list and their update responsibilities — other skills reference these by number
- **Safe to add:** new file rows (if new mandatory docs are added), new writing rules, new `## Lessons Learned` entries
- **Breaking changes:** require version bump + user approval + migration note

Current version: 1.0

## Lessons Learned

<!-- Entries added after each invocation where a new edge case, canonical pattern, or rule clarification was discovered. -->
<!-- Format: - [YYYY-MM-DD] context: <task> — <one sentence lesson>. -->
