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

These skills MUST be invoked automatically via the Skill tool without being asked. Invoking them is NOT optional.

| Trigger | Skill to invoke |
|---------|----------------|
| Before reading any named symbol, store, component, hook, or feature area | `sb-graph-navigate` — run `graphify query "<name>" --budget 1000`, parse NODE `src=` lines, read only those files; falls back to smart-explore if 0 nodes returned |
| Before reading code when query is open-ended or sb-graph-navigate returned 0 nodes | `smart-explore` — tree-sitter AST search; `smart_search` first, then `smart_unfold` on demand; never read whole files upfront |
| Architecture question, "how does X connect to Y", duplication audit, before major refactor | `pathfinder` — maps feature flowcharts, finds duplicated concerns, emits `/make-plan` prompts; also consult `docs/FINDINGS.md` |
| Starting any implementation task touching > 1 file or > 1 step (feature, fix, refactor, new feature, new page, redesign) | `sb-orchestrate` — it decides: brainstorm first? SPARC? subagent-driven? direct? |
| Bug, error, unexpected behavior, "why is X broken", "this doesn't work" | `investigate` — diagnose before implementing; do NOT go to sb-orchestrate first |
| New product idea, concept, "should we build X", "what if we added Y" | `office-hours` (gstack) — CEO-perspective idea review before brainstorming |
| Strategy, scope, "what should we build", ambition question | `plan-ceo-review` (gstack) |
| Code review, "check the diff", "look at my changes", pre-PR review | `review` |
| Second opinion, "what does another model think about this", "get a codex review" | `codex` (gstack) |
| QA — find bugs AND fix them, "does this work", "test the site", "find bugs on the live app" | `qa` (gstack) |
| QA — report bugs only without fixing, "show me what's broken" | `qa-only` (gstack) |
| Ship via PR (review + merge) | `ship` (gstack) |
| Ship as atomic merge + deploy + verify in one step, "land and deploy", "merge it and watch" | `land-and-deploy` (gstack) |
| Post-deploy monitoring, "watch prod after the deploy", "is prod stable", "canary check" | `canary` — always run after prod deploy |
| Architecture review, "does this design make sense" | `plan-eng-review` (gstack) |
| Visual design question, "how should this look", design system decisions | `design-consultation` (gstack) |
| Visual audit of the running/deployed app, "does this look right in prod", "design polish on live site" | `design-review` (gstack) — live browser audit, not pre-commit |
| "Review everything" about a plan | `autoplan` (gstack) |
| Any invoice, GST, TDS, tax, GSTIN, SAC code, supply type, Section 194J/392, Form 16A work | `sb-invoice-tax` |
| About to run `git commit` or stage files | `sb-commit` |
| Before `sb-commit` and as part of `sb-session-end` only — do NOT invoke after every individual file edit | `sb-verify` |
| Before committing any `.jsx`/`.tsx`/`.css` file | `sb-design-audit` |
| Once per session via `sb-session-end` — do NOT invoke after each task mid-session | `sb-doc-sync` |
| Before stopping work / end of session | `sb-session-end` |
| Any JSX/TSX file — component, page (Dashboard, Settings, Referrals, Contacts, Calendar, or any other), hook, or Tailwind class work | `sb-react-patterns` |
| Any deal, pipeline, kanban, stage, drag-drop, brand deal, DealForm, DealDetail work | `sb-deal-build` |
| Before any PR, when skills feel stale, after adding new skills | `sb-skill-audit` |
| New page, new component, significant UI redesign, "make this look better", "design the X screen" | `frontend-design` (global) — production-grade aesthetics, avoids AI-slop |
| Color/typography choices, layout decisions, UX patterns, any component styling, "how should this look" | `ui-ux-pro-max` (global) — 50+ styles, 161 palettes, 99 UX guidelines |
| Animation, transition, framer-motion, toast, drawer, gesture, "add motion", "animate the" | `emilkowal-animations` (global) — 43 animation rules, easing/timing best practices |
| Auth, password, session, encryption, crypto, payment, Razorpay, "is this secure", RLS, secrets | `owasp-security` (global) — OWASP Top 10 for financial SaaS; fires PRE-implementation to inform design |
| Full security audit of completed/deployed feature, "security review this end-to-end", "run a security check" | `cso` — POST-implementation security audit; more thorough than owasp-security |
| Creating a new skill, "add a skill for X", "build a skill that...", skill development | `sb-skill-creator` — gap analysis + impact assessment + delegates to `skill-creator` plugin for full eval loop + wires into dotclaude/CLAUDE.md |
| Architecture decision, "which approach for X", "should we use Y or Z", technology choice, pattern selection, "write an ADR" | `architecture-decision` (global) — evaluates trade-offs; append output ADR to `docs/DECISIONS.md` |
| Creating changelog, "prepare release notes", "what changed this sprint", updating CHANGELOG | `changelog-writer` (global) — generates Keep a Changelog format; target file is `docs/Changelog.md` |
| Update user-facing docs after shipping, "what docs need updating", "document this release" | `document-release` (gstack) — post-ship docs update; more thorough than changelog-writer |
| Pre-release validation, "is this ready to ship", release health check | `release-health-gates` (global) — validates readiness before tagging or deploying |
| Performance regression, "is this slower", "check Core Web Vitals", "benchmark this change" | `benchmark` (gstack) — page speed, render time, bundle size regression |
| Weekly sprint retro, "what did we ship this week", "sprint review", "how did the sprint go" | `retro` (gstack) — per sprint; do NOT invoke after every feature commit |
| Sprint-end skill learning, "make our skills smarter", "distill lessons", "improve routing from what we learned" | `sb-skill-distill` — run after retro when 5+ sessions accumulated; promotes Lessons Learned into routing rules |
| Code quality health check, "how's the codebase", "quality audit", "technical debt review" | `health` (gstack) |
| Save session progress, "checkpoint my work", "save where I am for next session" | `context-save` (gstack) |
| Resume prior session context, "where was I", "restore my last session" | `context-restore` (gstack) |

**Never run `git commit` directly** — always invoke `sb-commit` which runs verification first.  
**Never end a session** without invoking `sb-session-end` — it handles all 8 doc updates automatically.  
**Never commit UI files** without invoking `sb-design-audit` first.

## Session end — mandatory before stopping

Invoke `sb-session-end`. It runs verify → doc-sync (8 files) → append learnings → commit automatically.  
**Do not ask before doing any of the above. Do it silently as the final step every time.**
