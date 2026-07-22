---
name: "sb-orchestrate"
description: "StudioBooks task router — AUTOMATICALLY invoke when starting any implementation task touching >1 file or >1 step. Decides: design first or code directly? Then which execution pattern. Single entry point for ALL multi-step work."
model: haiku
auto-invokes:
  - design-consultation                   # Phase 0 — new UI with uncertain design
  - superpowers:test-driven-development   # Phase 1 TDD gate — before any logic implementation
  - superpowers:verification-before-completion  # Phase 2 — iron law gate before "done"
  - superpowers:systematic-debugging      # Pre-routing — root cause before any bug fix
  - cso                                   # Phase 2 — post-implementation security audit (auth/payments/RLS)
  - benchmark                             # Phase 2 — performance regression check
  - sb-design-audit                       # Phase 2 — before committing UI files
  - review                                # Phase 2 — after subagent/SPARC work
  - codex                                 # Phase 2 — second opinion (optional, complex logic)
  - release-health-gates                  # Phase 2 → Phase 3 gate
  - ship                                  # Phase 2 — when ready to land (simple PR)
  - land-and-deploy                       # Phase 2 — atomic merge+deploy+verify
  - sb-skill-creator                      # Pre-routing — full skill lifecycle (gap → build → wire)
  - superpowers:finishing-a-development-branch  # Phase 2 — conflict check before ship
  - canary                                # Phase 3 — post-deploy monitoring (always)
  - design-review                         # Phase 3 — live visual audit (UI features)
  - document-release                      # Phase 3 — docs update post-ship (always)
  - retro                                 # Phase 3 — sprint retrospective (per sprint, not per commit)
  - sb-skill-distill                      # Phase 3 — skill learning engine (after retro, every 5+ sessions)
  # Domain skills (Phase 0.5) fire via CLAUDE.md before sb-orchestrate — not listed here to avoid duplication
---

# sb-orchestrate — StudioBooks Task Router

One entry point. Six phases. Every multi-step task flows through here.

---

## Pre-Routing — Task Type Classifier

**First: classify the task type. Some tasks bypass all phases entirely.**

| Task type | Action |
|-----------|--------|
| Bug, error, unexpected behavior, "why is X broken", "this doesn't work" | `Skill({ skill: "investigate" })` then `Skill({ skill: "superpowers:systematic-debugging" })` — root cause BEFORE any fix; stop here |
| New product idea, concept pitch, "should we build X", "what if we add Y" | `Skill({ skill: "office-hours" })` → if approved by CEO review, continue to Phase 0 |
| Strategy, scope, "what should we build", "think bigger", ambition question | `Skill({ skill: "plan-ceo-review" })` → done, stop here |
| Code review, "check my diff", "look at my changes", pre-PR review | `Skill({ skill: "review" })` → done, stop here |
| QA — find AND fix bugs on the live app | `Skill({ skill: "qa" })` → done, stop here |
| QA — report bugs only, no fixing | `Skill({ skill: "qa-only" })` → done, stop here |
| Ship via simple PR | `Skill({ skill: "superpowers:finishing-a-development-branch" })` then `Skill({ skill: "ship" })` → done, stop here |
| Ship as atomic merge + deploy + verify in one step | `Skill({ skill: "land-and-deploy" })` → done, stop here |
| Post-deploy monitoring, "watch prod", "is prod stable after the deploy" | `Skill({ skill: "canary" })` → done, stop here |
| Weekly retro, "what did we ship", "sprint review", "how'd the sprint go" | `Skill({ skill: "retro" })` → done, stop here |
| Second opinion, "what does another model think", "get a codex review" | `Skill({ skill: "codex" })` → done, stop here |
| Code quality health check, "how's our code health", "codebase health" | `Skill({ skill: "health" })` → done, stop here |
| "Review everything about this plan" | `Skill({ skill: "autoplan" })` → done, stop here |
| Creating a new skill, "add a skill for X", skill development, "build a skill that..." | `Skill({ skill: "sb-skill-creator" })` → done, stop here |
| Copy edit, label/text change, single config tweak — ≤2 files, zero logic change | Skip all phases → implement directly |
| Small fix — ≤2 files, ≤~40 changed lines, no new store/route/service, root cause already known | **Fast path** (Execution Economy rule 2) → implement inline, targeted test + lint only |
| Everything else (feature, fix, refactor, new page) | → Phase 0 |

---

## Execution Economy — read before any phase (v1.3)

Credit burn has four sources: skill-chain overhead, subagent cold starts, full-suite verification, and unbatched I/O. These rules override enthusiasm:

1. **Batch I/O, not just tasks.** All independent Reads/Greps in ONE message (parallel tool calls). All edits to one file in ONE Edit call. Never re-read a file just edited (the harness tracks state). Never re-read files already in context.
2. **Fast path:** ≤2 files AND ≤~40 changed lines AND no new store/route/service → implement inline. Run only the matching test file(s) + lint. Skip subagents, plan reviews, and all Phase 2 steps except targeted verification and (if JSX changed) sb-design-audit. Applies to bug fixes too, once `investigate` has the root cause.
3. **Targeted verification mid-session:** `npx vitest run <matching test files>` — the FULL suite runs only inside `sb-session-end`/`sb-verify` before commit. A mid-loop full run costs minutes and thousands of output tokens and finds nothing the targeted file wouldn't.
4. **Skill budget:** ≤3 skill invocations for a small task, ≤6 for a feature. A domain skill already loaded this session is NOT re-invoked — its content is already in context.
5. **Subagent economy:** every subagent cold start re-derives context the main session already has. Prefer inline Direct whenever the work fits in context; use ONE well-specified subagent only for >8-file mechanical work. Two subagents need explicit justification.
6. **Phase 2 conditional gates default to SKIP.** Run cso only when the diff touches auth/payments/RLS; benchmark only for perf-relevant diffs; codex/qa only when the user asks.
7. **Phase 3 is SUSPENDED until the app has real users** (closed alpha, `docs/PATH_TO_BETA.md` Stage 6). canary / design-review / document-release / retro currently observe zero traffic — pure credit burn. Re-enable at alpha.
8. **Runtime evidence beats a second review.** One `verify` pass (actually drive the changed flow in the dev server) catches integration bugs no static review can — and costs less. Budget: max 1 static review + 1 runtime verify per feature. The 2026-07-02 audit proved the old all-static gate chain shipped P0 payment bugs anyway.

---

## Phase 0 — Design Gate

**Ask: Do I know exactly what to build, how it should look, and what the strategy is?**

| Situation | Action |
|-----------|--------|
| New feature or page with significant UI — visual design or UX is uncertain | `Skill({ skill: "design-consultation" })` → then `superpowers:brainstorming` → then `superpowers:writing-plans` → then Phase 0 plan reviews |
| New feature, new page, or architectural decision — needs dialogue with user | `Skill({ skill: "superpowers:brainstorming" })` → then `superpowers:writing-plans` → then Phase 0 plan reviews |
| Large refactor, new service layer, new patterns — design is clear but technically complex | `Skill({ skill: "sparc:orchestrator" })` — handles spec → pseudocode → architecture → refinement → completion autonomously |
| Extending existing patterns, bug fix, known task — no design uncertainty | Skip to Phase 1 directly |

### Phase 0 Plan Reviews (after writing-plans, before Phase 1)

| Plan type | Review skill |
|-----------|-------------|
| Strategically significant — "is this the right thing to build?" | `Skill({ skill: "plan-ceo-review" })` |
| Technically complex — "does this architecture make sense?" | `Skill({ skill: "plan-eng-review" })` |
| UI-heavy feature — "does this fit the design system?" | `Skill({ skill: "plan-design-review" })` |
| All three apply, or user says "review everything" | `Skill({ skill: "autoplan" })` |

> Skip plan reviews for: simple tasks (copy edits, single store actions, small known patterns).

---

## Phase 0.5 — Domain Skills

**Domain skills are owned by CLAUDE.md's auto-invoke table and fire before sb-orchestrate is invoked.** There is no duplicate routing table here — invoking domain skills again wastes ~2,000 tokens per skill and creates drift when the two tables disagree.

If you arrived here via CLAUDE.md's auto-invoke trigger, domain skills have already fired. Proceed to Phase 1.

If you invoked sb-orchestrate directly (bypassing CLAUDE.md), check CLAUDE.md's auto-invoke table for matching domain signals and invoke them now before proceeding.

**sb-graph-navigate is the unconditional first step** before reading any source file. It should have fired already via CLAUDE.md's first row. If it hasn't, run: `Skill({ skill: "sb-graph-navigate" })` now — this single step saves 85% of token cost on all code exploration.

---

## Phase 1 — Execution Pattern

### TDD Gate — runs BEFORE choosing an execution pattern

If the task involves **logic** (new function, store action, service, utility, calculation, condition):
→ `Skill({ skill: "superpowers:test-driven-development" })` — write the test first, then implement.

Skip only for: pure layout/copy/styling changes with zero state logic.

---

### Direct — inline, no agents

Use when ALL of these are true:
- Bug fix, copy edit, or single-component styling tweak
- Fewer than 3 files touched
- No new store, route, or service

**Just implement inline.**

**Domain check:** Before writing any code, confirm CLAUDE.md domain skills have already fired for this task. For auth/payment/RLS changes, `owasp-security` must have run. For any JSX edit, `sb-react-patterns` must have run. If they haven't, invoke them now — the Direct path does not skip domain obligations.

---

### Single Subagent — preferred for small planned tasks

**Prefer this over SDD when the plan has tasks that are each ≤2 files.** SDD adds 2 reviewer subagents per task; Single Subagent + one final `review` at Phase 2 is cheaper for simple, well-specified work.

Use Single Subagent when:
- 3–8 files, implementation is well-understood
- New component or page with a known design
- Extending an existing store action or adding a field
- **Plan tasks are each ≤2 files and spec is clear** ← prefer this over SDD for small tasks

```js
Agent({
  subagent_type: "feature-dev",   // or "sparc-coder"
  prompt: "...<full spec + file paths + existing patterns to follow>..."
})
```

Provide: exact file paths, the existing pattern to follow, what NOT to change.

---

### superpowers:subagent-driven-development — for complex planned work

Use when:
- A plan file exists at `docs/superpowers/plans/YYYY-MM-DD-<name>.md`
- Tasks are numbered, each ~1 commit
- **Tasks touch 3+ files OR have significant integration concerns** — SDD's dual review per task is worth the cost here
- Do NOT use SDD for plans where every task is ≤2 files — use Single Subagent instead (saves 2 reviewers per task)

```js
Skill({ skill: "superpowers:subagent-driven-development" })
```

Keep tasks small: 1 task = 1–2 files = 1 commit. Smaller tasks = cheaper subagents.

**Test coverage is mandatory in SDD.** The code quality reviewer must fail any task that adds logic (new function, store action, service, calculation, condition) without corresponding tests. No tests = not approved. Implementer must write `// @vitest-environment node` or `jsdom` annotation on every new test file (CLAUDE.md Hard Rule 5).

---

### Parallel Agents — DISABLED

Ruflo swarm is disabled. For large parallel workloads (4+ independent modules), see the **Re-enabling Ruflo** appendix below.

---

## Mid-Execution Bug Protocol — interrupt from ANY phase

**If a bug, test failure, build error, or unexpected behavior is discovered at ANY point during Phase 1 or Phase 2 — STOP immediately and run this protocol. Never attempt an inline fix.**

```
STOP current phase execution.
Step 1 → Skill({ skill: "investigate" })          — diagnose root cause first
Step 2 → Skill({ skill: "superpowers:systematic-debugging" }) — structured fix
Step 3 → return to Phase 2 from the top (verification-before-completion)
```

**Triggers this protocol:**
- `sb-verify` fails (lint error, build failure, test failure)
- `verification-before-completion` reveals evidence that contradicts "done"
- A subagent returns with an error or partial result
- Running the app surfaces unexpected behavior
- Any `console.error`, network failure, or runtime exception observed

**Never:** inline-patch the failing line without running `investigate` first. The root cause is almost never where the symptom appears.

---

## Phase 2 — Post-Execution Gates

**Run in order after Phase 1 completes. Each step has an explicit outcome — pass, fix-loop, or escalate. Never skip a step because "it's probably fine".**

---

### Step 2.1 — Verification (always, every task)

```
Skill({ skill: "superpowers:verification-before-completion" })
```

**IRON LAW: evidence before assertions. No completion claims without running this.**

| Result | Action |
|--------|--------|
| PASS | Continue to Step 2.2 |
| FAIL (test failure, build error, runtime exception) | → Mid-Execution Bug Protocol → back to Step 2.1 |

---

### Step 2.2 — Security Audit (conditional)

**Run if:** feature touches auth, payments, RLS, user data, encryption, or sessions.

```
Skill({ skill: "cso" })
```

| Finding severity | Action |
|-----------------|--------|
| P0/P1 — data leak, broken auth, RLS bypass | → Mid-Execution Bug Protocol → back to Step 2.1 |
| P2 — code-level issue (unsafe query, missing validation) | Fix inline → `sb-verify` → back to Step 2.2 (max 2 cycles; escalate if still failing) |
| P3/P4 — hardening suggestion, future improvement | Add to TODOS.md → continue to Step 2.3 |

---

### Step 2.3 — Performance (conditional)

**Run if:** PWA, mobile rendering, data-heavy query, network call, or animation changed.

```
Skill({ skill: "benchmark" })
```

| Result | Action |
|--------|--------|
| No regression | Continue to Step 2.4 |
| Regression detected | Fix inline → `sb-verify` → back to Step 2.3 |

---

### Step 2.4 — Code Review (conditional)

**Run if:** Single Subagent or SPARC was the execution path. Skip after SDD (SDD has 2N+1 built-in reviews).

```
Skill({ skill: "review" })
// optionally: Skill({ skill: "codex" }) for complex logic — second model opinion
```

| Finding severity | Action |
|-----------------|--------|
| CLEAN — no issues | Continue to Step 2.5 |
| P1 — logic bug, data corruption, security hole | → Mid-Execution Bug Protocol → back to Step 2.1 |
| P2 — code quality (dead code, N+1, stale comment, missing test) | Fix inline → `sb-verify` → back to Step 2.4 (max 1 re-review; if still P2 after fix, escalate to user) |
| P3/P4 — style, naming, future improvement | Add to TODOS.md → continue to Step 2.5 |

---

### Step 2.5 — Design Audit (conditional)

**Run if:** any JSX, TSX, or CSS file was changed.

```
Skill({ skill: "sb-design-audit" })
```

| Finding | Action |
|---------|--------|
| CLEAN | Continue to Step 2.6 |
| Blocking (wrong design token, missing `formatINR`, broken Zustand selector, touch target < 44px) | Fix inline → `sb-verify` → back to Step 2.5 |
| Non-blocking (minor warning) | Note in commit message → continue to Step 2.6 |

---

### Step 2.6 — Learning Capture (always, after all gates pass)

**Every task produces something worth remembering or confirming. Capture it before shipping.**

Run these in order:

1. **Did the Mid-Execution Bug Protocol fire?**
   → Append the root cause to `learnings.md` — format: `[date] context: task — lesson`
   → Add to the relevant skill's `## Lessons Learned` (sb-react-patterns, sb-tds-rules, etc.)

2. **Did any gate find a non-obvious issue?**
   → Append to `learnings.md` if it would surprise a future dev

3. **Was a new domain rule, invariant, or gotcha discovered?**
   → Add to the relevant domain skill's `## Lessons Learned`
   → Update `docs/BUSINESS_LOGIC.md` if it's a business rule (G-domain gate)

4. **Log session outcome** (required — this feeds `sb-skill-distill`):
   Append one line to `docs/session-outcomes.jsonl`:
   ```json
   {
     "date": "YYYY-MM-DD",
     "branch": "<current branch>",
     "session_summary": "<2-4 words>",
     "phase_used": "<direct|single-subagent|subagent-driven|sparc>",
     "skills_invoked": ["<list>"],
     "bug_protocol_triggered": false,
     "build_passed": true,
     "tests_passed": true,
     "outcome": "success|partial|blocked"
   }
   ```

5. **If nothing non-obvious happened** — still write the outcome line (step 4). Skip learnings.md.

> This step is what makes the skill system smarter over time. Skipping it is technical debt.

---

### Step 2.7 — QA (conditional)

**Run if:** user explicitly asked to test the live app, or verification-before-completion passed but you're uncertain about integration.

```
Skill({ skill: "qa" })        // find AND fix bugs
Skill({ skill: "qa-only" })   // report bugs only, no fixing
```

| Result | Action |
|--------|--------|
| No bugs | Continue to Step 2.8 |
| Bugs found (qa fixes them) | Re-run Step 2.1 (verification) to confirm fixes |

---

### Step 2.8 — Ship Gate (when feature is ready to land)

**All gates above must have passed before this runs.**

```
Skill({ skill: "release-health-gates" })
  → Skill({ skill: "superpowers:finishing-a-development-branch" })
  → Skill({ skill: "ship" }) or Skill({ skill: "land-and-deploy" })
```

If more plan tasks remain — stop here, do NOT ship mid-plan. Return to Phase 1 for the next task.

> There is no "trivial" escape hatch. Every step in Phase 2 runs for its condition.
> The fix loops in Steps 2.2–2.5 have explicit max-cycle limits to prevent infinite loops.
> Step 2.6 (Learning Capture) runs after all gates — never skip it.

---

## Phase 3 — Post-Ship

**Run after `ship` or `land-and-deploy` completes. This is where the pipeline closes the loop on quality, ops, and knowledge.**

| When | Gate | What it does |
|------|------|-------------|
| **Always, after every prod deploy** | `Skill({ skill: "canary" })` | Watches prod for errors/regressions after deploy; do NOT mark the feature done until canary passes |
| UI-heavy feature deployed | `Skill({ skill: "design-review" })` | Live visual audit via browser — checks the actual rendered app, not just the diff |
| Any new or changed user-facing feature | `Skill({ skill: "document-release" })` | Updates user-facing docs and changelog post-ship; complements `changelog-writer` (which is dev-facing) |
| End of sprint — NOT after every commit | `Skill({ skill: "retro" })` | Sprint-level retrospective: what shipped, what was hard, what to change next sprint |
| End of sprint — after retro, when 5+ sessions have accumulated | `Skill({ skill: "sb-skill-distill" })` | Reads all Lessons Learned + session-outcomes.jsonl + gstack learnings; promotes repeated patterns into routing rules; makes skills smarter sprint-over-sprint |

**Chaining context:** Pass to each Phase 3 skill:
- The deploy URL (for canary + design-review to target)
- The feature name and PR number (for document-release to scope)
- The sprint summary from `sb-doc-sync` (for retro context)

> Phase 3 is the ops lane. Most teams skip it — that's why prod incidents happen.
> `canary` + `document-release` are the minimum for every prod deploy.
> `retro` runs once per sprint. Never per-commit.

---

## Skill Dependency Reference

This table shows which skills auto-invoke which, so you can understand the full chain before starting.

```
sb-orchestrate
  Pre-routing → investigate + systematic-debugging (bug path)
  CLAUDE.md ─► [domain skills fire here, before sb-orchestrate is invoked]
               sb-graph-navigate (unconditional first step — named symbol lookup)
               frontend-design / ui-ux-pro-max / emilkowal-animations (UI work)
               owasp-security   (auth/crypto/payments)
               sb-react-patterns (any JSX/Zustand)
               sb-invoice-tax   (tax/invoice domain)
               sb-deal-build    (deals domain)
               architecture-decision (arch choices + ADR)
  Phase 0 ──► design-consultation → brainstorming → writing-plans
  Phase 0 ──► sparc:orchestrator (complex refactors)
  Phase 1 ──► test-driven-development (TDD gate — any logic)
  Phase 1/2 ► Mid-Execution Bug Protocol (bug found during running)
               └──► investigate + systematic-debugging → loop back to Phase 2
  Phase 2 ──► Step 2.1: verification-before-completion (IRON LAW — always first)
               └── FAIL → Mid-Execution Bug Protocol → back to Step 2.1
  Phase 2 ──► Step 2.2: cso (auth/payments/RLS features)
               ├── P0/P1 → Mid-Execution Bug Protocol → back to Step 2.1
               └── P2 → fix → sb-verify → back to Step 2.2 (max 2 cycles)
  Phase 2 ──► Step 2.3: benchmark (perf-sensitive changes)
               └── regression → fix → sb-verify → back to Step 2.3
  Phase 2 ──► Step 2.4: review (Single Subagent / SPARC only; skip after SDD)
               ├── P1 → Mid-Execution Bug Protocol → back to Step 2.1
               ├── P2 → fix → sb-verify → back to Step 2.4 (max 1 re-review)
               └── P3/P4 → TODOS.md → continue
  Phase 2 ──► Step 2.5: sb-design-audit (any JSX/CSS change)
               ├── blocking → fix → sb-verify → back to Step 2.5
               └── non-blocking → note → continue
  Phase 2 ──► Step 2.6: Learning Capture (ALWAYS — feeds sb-skill-distill)
               └── learnings.md + session-outcomes.jsonl + domain skill Lessons Learned
  Phase 2 ──► Step 2.7: qa / qa-only (conditional — user-requested or integration uncertainty)
               └── bugs found → re-run Step 2.1
  Phase 2 ──► Step 2.8: release-health-gates → finishing-a-development-branch → ship / land-and-deploy
               └── only when ALL steps above passed AND no more plan tasks remain
  Phase 3 ──► canary             (post-deploy monitoring — always)
  Phase 3 ──► design-review      (live visual audit — UI features)
  Phase 3 ──► document-release   (docs/changelog post-ship — always)
  Phase 3 ──► retro              (sprint-level retrospective — not per-commit)
  Phase 3 ──► sb-skill-distill  (sprint-level learning engine — after retro, every 5+ sessions)

sb-session-end
  Step 1 ──► sb-verify
  Step 2 ──► sb-doc-sync
  Step 3 ──► sb-commit

sb-invoice-tax
  ──────────► sb-gst-calc        (GST calculation)
  ──────────► sb-tds-rules       (TDS rules)
  ──────────► sb-gstin-validate  (GSTIN validation)

sb-deal-build
  ──────────► sb-deal-stages     (pipeline state)
  ──────────► sb-deal-calc       (financials)
  ──────────► sb-invoice-tax     (deal → invoice)
```

---

## When to Proactively Suggest Swarm

Mention swarm as an option when ALL of these are true and offer to re-enable it:
- Task has **4+ completely independent deliverables** (e.g. 3 new pages + migration + test suite simultaneously)
- No shared files between modules
- Estimated sequential time **>2 hours**

Say: *"This task has [N] independent streams that would benefit from swarm coordination. Want me to re-enable ruflo so we can run them in parallel? It saves time but uses more agents."*

---

## Memory & Learning Layer — claude-flow (already enabled)

`claude-flow` is already wired (`"enabledMcpjsonServers": ["claude-flow"]` in `.claude/settings.local.json`). The following tools are live right now — no enabling needed:

| Tool | Used by | Purpose |
|------|---------|---------|
| `mcp__claude-flow__agentdb_pattern-store` | sb-skill-distill | Persist learned patterns across sprints |
| `mcp__claude-flow__agentdb_pattern-search` | sb-skill-distill | Retrieve stored patterns for distillation |
| `mcp__claude-flow__hooks_intelligence_trajectory-end` | sb-session-end Step 2.5 | Log session outcome with outcome metrics |
| `mcp__claude-flow__hooks_intelligence_stats` | sb-skill-distill (enhanced) | Quantitative attention weights over routing decisions |
| `mcp__claude-flow__memory_store` / `memory_retrieve` | Any skill | Cross-session key-value memory |

**"Swarm disabled" only refers to:** `swarm_init`, `agent_spawn`, `task_orchestrate` — coordination tools that spawn parallel agents. Those stay disabled (save ~2,500 context tokens/turn).

The memory tools above have no per-turn cost and are safe to use. If any `mcp__claude-flow__*` call fails, it means the server isn't responding — skip gracefully and fall back to file-based equivalents.

---

## Re-enabling Ruflo/Swarm (future use)

When swarm is truly needed, restore these two lines in `.claude/settings.local.json`:

```json
"enabledMcpjsonServers": ["claude-flow"],
"enableAllProjectMcpServers": true
```

Then restart Claude Code. Skills that work again after re-enabling:
- `swarm-orchestration`, `swarm-advanced` — multi-agent swarm coordination
- `agentdb-*`, `reasoningbank-*` — advanced cross-session pattern learning
- `browser` — ruflo browser automation

To disable again, remove both lines and restart.

---

## Model Tiering Quick Reference

| Task type | Model |
|-----------|-------|
| mem-search, Explore, research lookups | haiku |
| sb-verify (lint / build / test runner) | haiku |
| SPARC: specification, reviewer, tester phases | haiku |
| Feature implementation, store logic, architecture | sonnet |
| Security review, design system judgment | sonnet |

---

## Context Hygiene

Run `/compact` when:
- Finishing a plan task before starting the next
- Context > 80k tokens

Run `/clear` when:
- Switching between unrelated feature areas (deals → settings → invoice)
- Starting a completely fresh task

---

## Cost Mental Model

| Pattern | Agents | Context cost |
|---------|--------|-------------|
| Direct | 0 | cheapest |
| Single subagent | 1 cold start | low |
| subagent-driven (N tasks) | N cold starts | N × low |
| SPARC (1 feature) | 5–7 cold starts | medium-high |
| Parallel agents | N cold starts | high |
| Swarm (re-enabled) | 6–15 cold starts | highest |

When in doubt: **prefer fewer, better-specified agents over more agents.**

---

## Feedback Protocol

Update rules governed by `sb-skill-feedback` skill. Summary:
- **Never change:** the Pre-Routing classifier table or phase numbers — CLAUDE.md and other skills reference these
- **Safe to add:** new pre-routing task types, new rows in CLAUDE.md's auto-invoke table (domain signals live there now), new model tier rows, new `## Lessons Learned` entries
- **Breaking changes:** require version bump + user approval + migration note

Current version: 1.3 (Execution Economy layer added: I/O batching, expanded fast path, targeted mid-session tests, skill/subagent budgets, Phase 3 suspended pre-alpha, runtime-evidence preference)

## Lessons Learned

<!-- Entries added after each invocation where a new edge case, canonical pattern, or rule clarification was discovered. -->
<!-- Format: - [YYYY-MM-DD] context: <task> — <one sentence lesson>. -->
- [2026-05-20] skill gap audit: sb-orchestrate had a Pre-Routing bug path for incoming bug tasks but no interrupt path for bugs found mid-execution (during Phase 1 or when Phase 2 verification fails) — added Mid-Execution Bug Protocol section with explicit `investigate` + `systematic-debugging` routing and a loop-back to Phase 2.
- [2026-05-20] skill gap audit: the same "stop, fix" gap existed in sb-verify, sb-session-end, and sb-commit failure paths — all updated to route to `investigate` + `systematic-debugging` before any fix attempt; skill gap audits should propagate fixes to all downstream skills, not just the entry point.
- [2026-05-20] eng audit v2: pipeline had no post-ship phase — canary, design-review, document-release, retro were all installed but unwired; added Phase 3 to close the ops lane; also added cso + benchmark to Phase 2 (pre-implementation owasp-security ≠ post-implementation security audit), codex as second-opinion option, and 8 new Pre-Routing rows (qa-only, land-and-deploy, canary, retro, codex, health) to match full gstack skill set.
- [2026-05-20] eng audit: dual routing tables (CLAUDE.md auto-invoke + sb-orchestrate Phase 0.5) were identical and diverging independently — removed Phase 0.5 table from sb-orchestrate; CLAUDE.md now owns domain routing, sb-orchestrate owns execution orchestration only; also removed unreachable SPARC section from Phase 1, collapsed Parallel Agents to a stub, added tiny-task fast path to Pre-Routing, and broadened sb-react-patterns trigger in CLAUDE.md to catch all JSX pages.
- [2026-06-02] token audit: Phase 2 `review` was firing after `subagent-driven-development` creating a 4th review pass (SDD already runs spec+quality review per task + final review = 2N+1 reviews). Added dedup guard: skip `review` in Phase 2 when SDD was the execution path. Also: SDD was used for plans with ≤2-file tasks — moved Single Subagent preference above SDD with explicit file-count trigger. Added mandatory test coverage rule to SDD code quality reviewer (fail if logic added without tests).
- [2026-07-03] credit audit: the full gate chain (~15–25 skill invocations + subagent cold starts + mid-session full-suite runs + Phase 3 ops skills with zero prod users) made even small improvements expensive, while the 2026-07-02 go-live audit proved the all-static chain still shipped P0 payment bugs — added Execution Economy section (v1.3): batch I/O, fast path for ≤2-file/≤40-line changes, targeted tests mid-session, skill budget, Phase 3 suspended until closed alpha, prefer 1 runtime verify over stacked static reviews.
- [2026-06-04] flow audit: Phase 2 was a flat table — review/cso/sb-design-audit findings had no fix path; after any gate found an issue there was nothing to do. Rewrote Phase 2 as ordered steps 2.1–2.8 with explicit P1/P2/P3 routing per finding severity, max-cycle fix loops (2.2 max 2 cycles, 2.4 max 1 re-review), and a mandatory Step 2.6 Learning Capture that feeds learnings.md + session-outcomes.jsonl + domain skill Lessons Learned before every ship.
