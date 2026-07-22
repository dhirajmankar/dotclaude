# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

StudioBooks — creator CRM SaaS for Indian content creators (brand deals, invoices, taxes, income). React 19 + Supabase + Zustand. PWA, mobile-first.

**Current Phase:** Invoice line-items + payment tab fixes ✅ (`claude/payment-tabs-invoice-fixes-m847w6`, 858 tests). Next: ESLint architecture guards + merge to master. Full history + department breakdown: `docs/CONTEXT.md`

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

**Context loading discipline:** CLAUDE.md is the only file loaded every session. Everything else is demand-only — read a doc only when the task explicitly touches that domain. Never pre-read docs/* speculatively. When in doubt: don't read it until you need it.

## Hard rules

Non-derivable constraints — things that would surprise any developer:

1. **Zustand selectors:** always scalar — `useStore(s => s.field)`. Object selectors `useStore(s => ({a: s.a, b: s.b}))` cause infinite render loops in React 19.
2. **Layered arch:** Supabase queries → `src/lib/repositories/` only. Business logic → `src/lib/services/`. Stores are state managers — never call `supabase` directly in a store or component.
3. **Currency:** `formatINR()` from `src/utils/` — always. Never raw `toLocaleString`.
4. **Invoice PDF:** `downloadInvoicePDF(element, filename)` from `@/utils/invoicePdf` — uses `html2canvas` + `jspdf` (dynamically imported). Never call `window.print()` for downloads. Print CSS in `index.css` is kept for browser Ctrl+P only. See ADR-007.
5. **Test environment — mandatory annotation on every new test file** (ADR-004):
   - Store, utility, service, or any pure-JS test → first line must be `// @vitest-environment node`
   - Component, page, or hook test (uses `render`/`renderHook`) → first line must be `// @vitest-environment jsdom`
   - Missing annotation = fails code review. Running jsdom on non-DOM tests was the root cause of 9-minute test runs and OOM crashes.
6. **Test async renders:** Never bare `render(<X />)` on a component with async `useEffect`. Use `await waitFor(...)` or `await act(async () => { render(<X />) })`. Bare `act()` warnings are treated as failures.
7. **Axe tests:** max one per test file, on the primary render only. Axe adds 100–500ms per call; more than one per file bloats the suite.
8. **Test files location:** All test files (`*.test.js`, `*.test.jsx`, `*.spec.js`, `*.spec.jsx`) must live in `tests/` (mirroring `src/`). Never create test files inside `src/`. `src/test/` contains only test infrastructure (`setup.js`, `utils.js`) — not test files.
9. **Layered architecture — supabase isolation:** `supabase` must only be imported inside `src/lib/repositories/`. No page, component, store, hook, or service may import `@/services/supabase` directly. Use a repository function instead. Exceptions: `main.jsx` (config flag only), `src/services/razorpay.js` (edge functions), `src/pages/Admin/Admin.jsx` (edge functions) — each carries an `eslint-disable` comment explaining why.
10. **Layered architecture — no repositories in pages/components:** Pages (`src/pages/`) and components (`src/components/`) must not import repositories directly. Use a workflow hook (`src/hooks/`) instead.
11. **Auth operations workflow:** All `supabase.auth.*` calls must go through `src/lib/repositories/authRepository.js`. Pages call `useAuthWorkflow` (`src/hooks/useAuthWorkflow.js`). `authStore` is the only store that uses `authRepository`.
12. **Cross-store chains:** Stores must not call `.getState()` on another store inside a store action. Coordinate across stores from workflow hooks instead.

## Documentation gates — where to write

Each gate fires at a specific moment and writes to a specific file. Never write ad hoc — use this table.

| Gate | Fires when | Writes to | Never write |
|------|-----------|-----------|-------------|
| G-phase | Sprint ships or major feature merges to master | (1) CLAUDE.md `Current Phase` — strict 1-line format only (see format rule below) + (2) `docs/CONTEXT.md` Current Status block — full details here | Sprint detail inline in CLAUDE.md; anything beyond the 1-line format |
| G-task-done | Completing a task in a multi-step plan | `docs/PendingWork.md` — `✅ Task N — one line` | Future plans, ideas |
| G-learning | Non-obvious discovery, hidden constraint, business rule clarification | `learnings.md` — append `[date] context: task — lesson` | "Added X", "Fixed Y bug", obvious things |
| G-context | Session end (sb-doc-sync step 2) | `docs/CONTEXT.md` — key-value block, 4–6 lines max | Code snippets, long lists |
| G-decision | Architecture choice made; `architecture-decision` invoked | `docs/DECISIONS.md` — ADR format | Task notes, implementation details |
| G-store | Store shape or action added/changed | `docs/STORES.md` — update state shape table | Unrelated domain info |
| G-arch | Route, auth, or data layer changed | `docs/ARCHITECTURE.md` — update relevant section | Business rules |
| G-domain | Business rule added or changed | `docs/BUSINESS_LOGIC.md` — update relevant section | Implementation notes |
| G-sprint | New sprint planned | `docs/PendingWork.md` — new task table | Decisions, discoveries |
| G-skill | New skill wired into trigger table | CLAUDE.md's auto-invoke table only | Anything else |

**G-phase format rule — exactly this shape, no more:**
```
**Current Phase:** Phase 1 MVP — [sprint name] ✅ (`[branch]`, [N] tests). Next: [next sprint name]. Full history + department breakdown: `docs/CONTEXT.md`
```
Any sprint detail beyond this 1-line format belongs in `docs/CONTEXT.md`, never here.

**CLAUDE.md write guard:** this file receives only — (1) `Current Phase` in the G-phase 1-line format (updated by sb-doc-sync at session end) + (2) new skill trigger rows (G-skill). Nothing else. If you are tempted to write sprint detail, discoveries, or architecture notes here — stop and use the correct gate instead.

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

## Subagent model selection

When spawning agents via the Agent tool, choose model by task type:

| Task type | Model | Examples |
|-----------|-------|---------|
| File search, symbol lookup, explore | `haiku` | Explore subagent, graphify queries, grep-style lookups |
| Documentation updates | `haiku` | CONTEXT.md, PendingWork.md, learnings.md writes |
| Simple file read + count | `haiku` | Test counting, file listing, pattern detection |
| Code review, adversarial review | `sonnet` | Pre-landing review, security audit |
| Coverage audit, codepath tracing | `sonnet` | ship Step 7 — needs reasoning |
| Architecture, implementation | `sonnet` | Feature dev, refactor, design agents |

Default to `sonnet` when uncertain. Never use `haiku` for agents that make quality or security judgments.

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

<!-- NOTE (2026-07-22 merge): this mirror file had diverged into two different auto-invoke table shapes — this session's (12-row, post 2026-07-11 consolidation, matches the live StudioBooks/CLAUDE.md) and an older pre-consolidation ~35-row table from a parallel branch. Kept the consolidated version since it matches what's actually authoritative. This file is a MANUALLY-maintained mirror (see note above — sync.ps1 does not touch it) and is already stale relative to the live StudioBooks/CLAUDE.md in other sections too (Current Phase, hard rules, docs gates). Needs a full manual refresh separately — not done as part of this merge. -->

**Never run `git commit` directly** — always invoke `sb-commit` which runs verification first.  
**Never end a session** without invoking `sb-session-end` — it handles doc updates (gate-conditional since 2026-07-11) automatically.  
**Never commit UI files** without invoking `sb-design-audit` first.

## Session end — mandatory before stopping

Invoke `sb-session-end`. It runs verify (full, skip-if-clean) → doc-sync (conditional) → append learnings → commit automatically.  
**Do not ask before doing any of the above. Do it silently as the final step every time.**
