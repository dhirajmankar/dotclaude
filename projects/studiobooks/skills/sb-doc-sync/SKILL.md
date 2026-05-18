---
name: "sb-doc-sync"
description: "StudioBooks documentation sync — invoke ONCE per session via sb-session-end Step 2 only. Do NOT auto-invoke after individual tasks mid-session. Can also be run standalone with /sb-doc-sync when docs feel stale between sessions. Updates 8 files: CLAUDE.md, CONTEXT.md, memory/project_status.md, README.md, ARCHITECTURE.md, STORES.md, BUSINESS_LOGIC.md — stale sections only. File 8 (DECISIONS.md) updates only when architecture-decision was invoked."
---

# sb-doc-sync — Documentation Sync

## What This Skill Does
Performs a targeted diff-based update of up to 8 session docs. Does **not** rewrite files wholesale — uses the gate-to-file routing map to know exactly which files need touching before even running `git diff`.

---

## Gate-to-File Routing

Every documentation write is triggered by a named gate. When a gate fires **during** the session, note the file it targets. At session end, only those files need updating — no guessing.

| Gate | Fires when | Target file |
|------|-----------|-------------|
| G-task-done | Completing a task in a multi-step plan | `docs/PendingWork.md` |
| G-learning | Non-obvious discovery, hidden constraint | `learnings.md` |
| G-context | Every session end | `docs/CONTEXT.md` |
| G-decision | `architecture-decision` skill invoked | `docs/DECISIONS.md` |
| G-store | Store shape or action added/changed | `docs/STORES.md` |
| G-arch | Route, auth, or data layer changed | `docs/ARCHITECTURE.md` |
| G-domain | Business rule added or changed | `docs/BUSINESS_LOGIC.md` |
| G-sprint | New sprint planned | `docs/PendingWork.md` |
| G-skill | New skill wired | `CLAUDE.md` auto-invoke table |

**Write guards (enforce these):**
- `CLAUDE.md` → only Current Phase line + new skill trigger rows. Nothing else.
- `learnings.md` → only non-obvious discoveries. Never "added X component" or "fixed Y".
- `docs/DECISIONS.md` → ADR format only (Status/Context/Decision/Consequences). No task notes.
- `docs/CONTEXT.md` → 4–6 lines max. No code, no lists.

---

## The 8 Files (update in this order)

| # | File | What to update |
|---|------|----------------|
| 1 | `CLAUDE.md` | `**Current Phase:**` line — what's now done, what's next |
| 2 | `docs/CONTEXT.md` | `**Current Status**` block — phase, branch, test count, last session summary |
| 3 | `memory/project_status.md` | task table rows, next step, completed commits |
| 4 | `README.md` | Quick-start, project structure, design rules if changed |
| 5 | `docs/ARCHITECTURE.md` | Routing, auth, data layer, security, testing — only if those changed |
| 6 | `docs/STORES.md` | Store state shapes and actions — only if a store was modified |
| 7 | `docs/BUSINESS_LOGIC.md` | Subscription, GST/TDS, referral, domain logic — only if those changed |
| 8 | `docs/DECISIONS.md` | Add new ADR entry if `architecture-decision` skill was invoked this session |

> Files 4–8 are conditional: skip them if nothing in their domain changed this session.

---

## Execution Steps

### Step 1 — Identify which gates fired this session

Check which gates fired (see Gate-to-File Routing table above):
```bash
git diff HEAD --name-only
git diff --cached --name-only
```
Map changed files to gates: `src/store/*` → G-store, `src/App.jsx` → G-arch, domain rule change → G-domain, etc.
Only update the target files for gates that actually fired. Skip the rest.

### Step 2 — Update CLAUDE.md (always)
- Read current `**Current Phase:**` line
- Update it: append the completed work phrase, update the "Next sprint:" part
- Do NOT create or reference a "Completed" list — CLAUDE.md no longer has one
- Do NOT change any other section

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

### Step 9 — Update docs/DECISIONS.md (if architecture-decision was invoked)
Skip if: `architecture-decision` skill was not invoked this session.
Update if: an ADR was written during the session — verify it was appended correctly in ADR format (Status, Context, Decision, Consequences, Alternatives).

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
- **Never change:** the 8-file list and their update responsibilities — other skills reference these by number
- **Safe to add:** new file rows (if new mandatory docs are added), new writing rules, new `## Lessons Learned` entries
- **Breaking changes:** require version bump + user approval + migration note

Current version: 1.0

## Lessons Learned

<!-- Entries added after each invocation where a new edge case, canonical pattern, or rule clarification was discovered. -->
<!-- Format: - [YYYY-MM-DD] context: <task> — <one sentence lesson>. -->
