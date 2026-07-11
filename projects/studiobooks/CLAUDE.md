# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

StudioBooks — creator CRM SaaS for Indian content creators (brand deals, invoices, taxes, income). React 19 + Supabase + Zustand. PWA, mobile-first.

**Current Phase:** Phase 1 MVP — Depts 0–7 complete + all Security sprints ✅ + **D1/D2 deployed ✅** + **D9 TDS Tax Centre ✅** + **Skill system ✅** + **Auth completion ✅** (A1 forgot password, A2 check-email, A3 onboarding modal — PR #22 + #23 merged ✅). **Graph system ✅** (code + skills graphs, auto-refresh hooks wired). **IT pipeline ✅** (sb-orchestrate wired: TDD gate + systematic-debugging + verification-before-completion + architecture-decision; docs/DECISIONS.md seeded; changelog-writer + release-health-gates + architecture-decision wired into trigger table). **Parked:** D4 Resend SMTP, R2 Razorpay webhook secret. **Next sprint:** notification system + mark-paid animation, then `feat/deal-invoice-v2`.

Full build history → `docs/CONTEXT.md`

## Commands

```bash
npm run dev       # Vite dev server at http://localhost:5173
npm run build     # Production build
npm run lint      # ESLint check
npm run preview   # Preview production build
```

## Environment Setup

Copy `.env.example` to `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_RAZORPAY_KEY_ID=rzp_test_xxxx
```
Schema: run `supabase/schema.sql` in Supabase SQL editor. New developer setup: see `README.md`.

## Where to look

| I need to know... | Go to |
|------------------|-------|
| Active sprint tasks | `docs/PendingWork.md` |
| Last session summary, branch, test count | `docs/CONTEXT.md` |
| Store shapes, actions, mutation guards | `docs/STORES.md` |
| Subscription, tax, deal pipeline rules | `docs/BUSINESS_LOGIC.md` |
| Stack, routing, auth, data layer | `docs/ARCHITECTURE.md` |
| Design tokens, typography, touch targets | `DESIGN.md` |
| Past discoveries and gotchas | `learnings.md` |
| Why something was built this way | `docs/DECISIONS.md` |
| Named symbol (store, component, hook) | `graphify query "X" --budget 1000` (see Graph-first search below) |
| Live feature connections, duplication | `pathfinder` skill |
| Open-ended codebase question | `smart-explore` skill |
| Cross-session memory | `memory/project_status.md` |
| Skill dependency chains | `sb-orchestrate` skill |

## Hard rules

Non-derivable constraints — things that would surprise any developer:

1. **Zustand selectors:** always scalar — `useStore(s => s.field)`. Object selectors `useStore(s => ({a: s.a, b: s.b}))` cause infinite render loops in React 19.
2. **Layered arch:** Supabase queries → `src/lib/repositories/` only. Business logic → `src/lib/services/`. Stores are state managers — never call `supabase` directly in a store or component.
3. **Currency:** `formatINR()` from `src/utils/` — always. Never raw `toLocaleString`.
4. **Invoice PDF:** `window.print()` only — no PDF library. CSS print styles injected at print time.
5. **Test environment — mandatory annotation on every new test file** (ADR-004):
   - Store, utility, service, or any pure-JS test → first line must be `// @vitest-environment node`
   - Component, page, or hook test (uses `render`/`renderHook`) → first line must be `// @vitest-environment jsdom`
   - Missing annotation = fails code review. Running jsdom on non-DOM tests was the root cause of 9-minute test runs and OOM crashes.
6. **Test async renders:** Never bare `render(<X />)` on a component with async `useEffect`. Use `await waitFor(...)` or `await act(async () => { render(<X />) })`. Bare `act()` warnings are treated as failures.
7. **Axe tests:** max one per test file, on the primary render only. Axe adds 100–500ms per call; more than one per file bloats the suite.

## Documentation gates — where to write

Each gate fires at a specific moment and writes to a specific file. Never write ad hoc — use this table.

| Gate | Fires when | Writes to | Never write |
|------|-----------|-----------|-------------|
| G-task-done | Completing a task in a multi-step plan | `docs/PendingWork.md` — `✅ Task N — one line` | Future plans, ideas |
| G-learning | Non-obvious discovery, hidden constraint, business rule clarification | `learnings.md` — append `[date] context: task — lesson` | "Added X", "Fixed Y bug", obvious things |
| G-context | Session end (sb-doc-sync step 2) | `docs/CONTEXT.md` — key-value block, 4–6 lines max | Code snippets, long lists |
| G-decision | Architecture choice made; `architecture-decision` invoked | `docs/DECISIONS.md` — ADR format | Task notes, implementation details |
| G-store | Store shape or action added/changed | `docs/STORES.md` — update state shape table | Unrelated domain info |
| G-arch | Route, auth, or data layer changed | `docs/ARCHITECTURE.md` — update relevant section | Business rules |
| G-domain | Business rule added or changed | `docs/BUSINESS_LOGIC.md` — update relevant section | Implementation notes |
| G-sprint | New sprint planned | `docs/PendingWork.md` — new task table | Decisions, discoveries |
| G-skill | New skill wired into trigger table | CLAUDE.md's auto-invoke table only | Anything else |

**CLAUDE.md write guard:** this file receives only — Current Phase line (sb-doc-sync, session end) + new skill trigger rows (G-skill). Nothing else belongs here.

## Skill management

**Source of truth:** `C:\Users\Work\dotclaude\projects\studiobooks\skills\`  
Skills auto-sync on session start via hook. Manual: run `.claude/sync.ps1`.  
**Never create skills in** `.agents/skills/` or `.claude/skills/` directly — changes won't survive the next sync.

## Special instruction

- **At session start: read `learnings.md` and apply any recorded learnings before doing any work.**

## Graph-first search — MANDATORY, no exceptions for src/ and skills

Two knowledge graphs are always available and auto-refreshed after every file edit:

| Graph | Path | Covers | Query command |
|-------|------|---------|---------------|
| Code | `graphify-out/graph.json` | All of `src/` | `graphify query "<name>" --budget 1000` |
| Skills | `graphify-skills/graph.json` | All `.claude/skills/` | `graphify query "<name>" --graph graphify-skills/graph.json --budget 1000` |

**Token cost comparison:**
- `graphify query` → ~300–500 tokens, returns exact file paths
- `Grep` sweep → 5,000–50,000 tokens, reads file content

### NEVER use Grep/Glob/Read for anything in `src/` or `.claude/skills/`

**Step 1 always:** `graphify query "<symbol>" --budget 1000`  
**Step 2:** Parse `NODE … src=<path>` lines — those are the exact files to `Read`  
**Step 3:** `Read` only those files — nothing else

### When Grep IS acceptable

| Target | Reason |
|--------|--------|
| `supabase/migrations/*.sql` | SQL, not in graph |
| `supabase/functions/` | Edge functions, not in graph |
| Root config files (`tailwind.config.js`, `vite.config.js`) | Not in graph |
| Cross-cutting string patterns | Pattern, not symbol |

### Fallback chain when graph returns 0 nodes

1. Zustand store/hook/selector? → read `src/store/` or `src/hooks/` directly
2. Open-ended or structural question? → `smart-explore`
3. Only after both above fail → narrow targeted `Grep`

**Graph health:** Rebuilt daily at session start + after every file edit. Check `docs/.graph-stamp`. If stale: `npm run graph:rebuild`.

## Process rules

- Always test and build and remove any code if it is not tested
- Follow standard practices as SAAS company should follow
- Ask for clarity if you don't have any, don't just assume, deduce
- Run `/compact` after completing each plan task before starting the next; target context under 80k tokens
- Run `/clear` when switching between unrelated feature areas (e.g. deals → settings → invoice)

## Auto-invoked skills — mandatory, no prompting needed

These skills MUST be invoked automatically via the Skill tool without being asked. Invoking them is NOT optional. (Consolidated 2026-07-11: 44 rows → 12 core rows; everything else is on-demand below. The authoritative copy of this table lives in `StudioBooks/CLAUDE.md` — sync.ps1 does not copy this file; keep the two in step manually.)

| Trigger | Skill |
|---------|-------|
| Before reading any named symbol/store/component/hook/feature area | `sb-graph-navigate` — graphify query, read only `src=` files; falls back to smart-explore on 0 nodes |
| Open-ended read, or sb-graph-navigate returned 0 nodes | `smart-explore` — tree-sitter AST; never read whole files upfront |
| Any implementation touching >1 file or >1 step (feature, fix, refactor, new page, redesign) | `sb-orchestrate` — decides brainstorm / SPARC / subagent / direct |
| Bug, error, unexpected behavior, "why is X broken", "this doesn't work" | `investigate` — diagnose before implementing (not sb-orchestrate first) |
| Invoice, GST, TDS, GSTIN, SAC code, supply type, Section 194J/392/393, Form 16A | `sb-invoice-tax` — routes to sb-tds-rules / sb-gst-calc / sb-gstin-validate as needed |
| Any deal/pipeline/kanban/stage/drag-drop/brand-deal/DealForm/DealDetail work | `sb-deal-build` — routes to sb-deal-calc / sb-deal-stages as needed |
| About to `git commit` or stage files | `sb-commit` — runs `sb-verify` **targeted** mode (matching tests only; full suite is session-end + CI) |
| Before committing any `.jsx`/`.tsx`/`.css` | `sb-design-audit` — 4 grep checks, ~30s |
| New page or component (net-new file, not restyle) | `frontend-design` (global) — production aesthetics, avoids AI-slop |
| Existing-UI styling, color/typography/layout/UX/motion/animation decisions — ANY design question | `graphic-design-psychology` — the master design skill; it pulls in `ui-ux-mindset` CSS recipes when it needs them. Do NOT also invoke `ui-ux-pro-max`/`emilkowal-animations`/`ui-ux-mindset` separately — they're on-demand sub-references now |
| Auth, password, session, encryption, crypto, payment, Razorpay, RLS, secrets, "is this secure" | `owasp-security` (global) — fires PRE-implementation |
| Before stopping work / end of session | `sb-session-end` — runs `sb-verify` **full** (skip-if-clean) → `sb-doc-sync` (conditional docs) → learnings → commit |

**On-demand skills** — invoke only when the user asks or the task plainly requires them; never auto-fire:
`sb-patterns`, `sb-react-patterns`, `sb-verify` (standalone re-run), `sb-doc-sync` (standalone), `pathfinder`, `cso`, `sb-skill-audit`, `sb-skill-creator`, `sb-skill-distill`, `sb-tds-rules`/`sb-gst-calc`/`sb-gstin-validate`/`sb-deal-calc`/`sb-deal-stages` (reached via their routers), `ui-ux-pro-max`, `ui-ux-mindset`, `emilkowal-animations`, `architecture-decision`, `changelog-writer`, `release-health-gates`, and all gstack skills (`review`, `codex`, `qa`, `qa-only`, `ship`, `land-and-deploy`, `canary`, `retro`, `health`, `benchmark`, `office-hours`, `plan-ceo-review`, `plan-eng-review`, `design-consultation`, `design-review`, `autoplan`, `document-release`, `context-save`, `context-restore`) — user-triggered by nature.

**Never run `git commit` directly** — always invoke `sb-commit` which runs verification first.  
**Never end a session** without invoking `sb-session-end` — it handles doc updates (gate-conditional since 2026-07-11) automatically.  
**Never commit UI files** without invoking `sb-design-audit` first.

## Session end — mandatory before stopping

Invoke `sb-session-end`. It runs verify (full, skip-if-clean) → doc-sync (conditional) → append learnings → commit automatically.  
**Do not ask before doing any of the above. Do it silently as the final step every time.**
