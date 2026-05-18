---
name: "sb-orchestrate"
description: "StudioBooks task router — AUTOMATICALLY invoke when starting any implementation task touching >1 file or >1 step. Decides: design first or code directly? Then which execution pattern. Single entry point for ALL multi-step work."
model: haiku
auto-invokes:
  - design-consultation    # Phase 0 — new UI with uncertain design
  - frontend-design        # Phase 0.5 — significant new UI surfaces
  - ui-ux-pro-max          # Phase 0.5 — component/page design decisions
  - emilkowal-animations   # Phase 0.5 — animation/motion work
  - owasp-security         # Phase 0.5 — auth, crypto, payments, security
  - sb-react-patterns      # Phase 0.5 — any JSX/Zustand work
  - sb-design-audit        # Phase 2 — before committing UI files
  - review                 # Phase 2 — after subagent/SPARC work
  - ship                   # Phase 2 — when ready to land
  - sb-skill-creator       # Pre-routing — full skill lifecycle (gap → build → wire)
---

# sb-orchestrate — StudioBooks Task Router

One entry point. Five phases. Every multi-step task flows through here.

---

## Pre-Routing — Task Type Classifier

**First: classify the task type. Some tasks bypass all phases entirely.**

| Task type | Action |
|-----------|--------|
| Bug, error, unexpected behavior, "why is X broken", "this doesn't work" | `Skill({ skill: "investigate" })` → done, stop here |
| New product idea, concept pitch, "should we build X", "what if we add Y" | `Skill({ skill: "office-hours" })` → if approved by CEO review, continue to Phase 0 |
| Strategy, scope, "what should we build", "think bigger", ambition question | `Skill({ skill: "plan-ceo-review" })` → done, stop here |
| Code review, "check my diff", "look at my changes", pre-PR review | `Skill({ skill: "review" })` → done, stop here |
| QA, "does this work", "test the site", "find bugs on the live app" | `Skill({ skill: "qa" })` → done, stop here |
| Ship, deploy, push, "create a PR", "let's land this", "send it" | `Skill({ skill: "ship" })` → done, stop here |
| "Review everything about this plan" | `Skill({ skill: "autoplan" })` → done, stop here |
| Creating a new skill, "add a skill for X", skill development, "build a skill that..." | `Skill({ skill: "sb-skill-creator" })` → done, stop here |
| Everything else (feature, fix, refactor, new page) | → Phase 0 |

---

## Phase 0 — Design Gate

**Ask: Do I know exactly what to build, how it should look, and what the strategy is?**

| Situation | Action |
|-----------|--------|
| New feature or page with significant UI — visual design or UX is uncertain | `Skill({ skill: "design-consultation" })` → then `superpowers:brainstorming` → then `superpowers:writing-plans` → then Phase 0 plan reviews |
| New feature, new page, or architectural decision — needs dialogue with user | `Skill({ skill: "superpowers:brainstorming" })` → then `superpowers:writing-plans` → then Phase 0 plan reviews |
| Large refactor, new service layer, new patterns — design is clear but technically complex | `Skill({ skill: "sparc:orchestrator" })` — handles spec → pseudocode → architecture → refinement → completion autonomously |
| Extending existing patterns, bug fix, known task — no design uncertainty | Skip to Phase 0.5 directly |

### Phase 0 Plan Reviews (after writing-plans, before Phase 0.5)

| Plan type | Review skill |
|-----------|-------------|
| Strategically significant — "is this the right thing to build?" | `Skill({ skill: "plan-ceo-review" })` |
| Technically complex — "does this architecture make sense?" | `Skill({ skill: "plan-eng-review" })` |
| UI-heavy feature — "does this fit the design system?" | `Skill({ skill: "plan-design-review" })` |
| All three apply, or user says "review everything" | `Skill({ skill: "autoplan" })` |

> Skip plan reviews for: simple tasks (copy edits, single store actions, small known patterns).

---

## Phase 0.5 — Domain Skill Auto-Invocation

**Detect the domain(s) of the task and invoke the matching skill(s) BEFORE reading any code or starting implementation. Multiple domains can match simultaneously.**

| Domain signal | Skill to invoke | Why |
|---------------|----------------|-----|
| New page, new component, significant UI redesign, "make this look better", "design the X screen" | `Skill({ skill: "frontend-design" })` | Production-grade aesthetics, avoids AI-slop UI |
| Color/typography choices, layout decisions, UX patterns, "how should this look", any component styling | `Skill({ skill: "ui-ux-pro-max" })` | 50+ styles, 161 palettes, 99 UX guidelines |
| Animation, transition, framer-motion, toast, drawer, gesture, "add motion to", "animate the" | `Skill({ skill: "emilkowal-animations" })` | 43 animation rules, easing, timing, Emil Kowalski patterns |
| Auth, login, password, session, encryption, crypto, payment, Razorpay, "is this secure", RLS, secrets | `Skill({ skill: "owasp-security" })` | OWASP Top 10, secure patterns for financial SaaS |
| Any JSX, any Zustand store, any React hook, any Tailwind UI | `Skill({ skill: "sb-react-patterns" })` | Prevents infinite loops, enforces scalar selectors |
| Reading named symbol, store, component, hook, feature area before implementing | `Skill({ skill: "sb-graph-navigate" })` | 85% token savings vs Grep/Read |
| Invoice, GST, TDS, GSTIN, SAC code, Form 16A, Section 194J | `Skill({ skill: "sb-invoice-tax" })` | Tax rules for Indian creators |
| Deal, pipeline, kanban, stage, brand deal, DealForm, DealKanban | `Skill({ skill: "sb-deal-build" })` | Deal domain model + store patterns |

**Rule:** When in doubt, invoke. A false positive (invoke skill that wasn't needed) costs ~200 tokens. A false negative (miss a domain skill) costs a wrong implementation.

---

## Phase 1 — Execution Pattern

### Direct — inline, no agents

Use when ALL of these are true:
- Bug fix, copy edit, or single-component styling tweak
- Fewer than 3 files touched
- No new store, route, or service

**Just implement inline.**

---

### Single Subagent — 1 Agent call

Use when:
- 3–8 files, implementation is well-understood
- New component or page with a known design
- Extending an existing store action or adding a field

```js
Agent({
  subagent_type: "feature-dev",   // or "sparc-coder"
  prompt: "...<full spec + file paths + existing patterns to follow>..."
})
```

Provide: exact file paths, the existing pattern to follow, what NOT to change.

---

### superpowers:subagent-driven-development — PRIMARY for planned work

Use when:
- A plan file exists at `docs/superpowers/plans/YYYY-MM-DD-<name>.md`
- Tasks are numbered, each ~1 commit
- **Default for all multi-task feature work in StudioBooks**

```js
Skill({ skill: "superpowers:subagent-driven-development" })
```

Keep tasks small: 1 task = 1–2 files = 1 commit. Smaller tasks = cheaper subagents.

---

### SPARC orchestration — architecture unknowns only

Use ONLY when SPARC was not already used in Phase 0 AND:
- Building something genuinely new with multiple valid approaches
- Needs spec → design → code → review phases

```js
Skill({ skill: "sparc:orchestrator" })
```

**Model tiering:**
| Phase | Model |
|-------|-------|
| specification | haiku |
| pseudocode | sonnet |
| architecture | sonnet |
| coder / refinement | sonnet |
| reviewer | haiku |
| tester | haiku |

---

### Parallel Agents — 4+ truly independent modules

Use ONLY when:
- 4+ modules with zero file conflicts and no shared state
- Each touches different files, different store, different component
- Sequential execution would take >2 hours

```js
Skill({ skill: "superpowers:dispatching-parallel-agents" })
```

> Ruflo swarm is currently **disabled** (saves ~2,500 context tokens/turn). For very large parallel workloads, see Re-enable section below.

---

## Phase 2 — Post-Execution Gates

**Run these after Phase 1 completes. Mandatory for subagent/SPARC work.**

| What was built | Gate |
|----------------|------|
| Any subagent or SPARC implementation | `Skill({ skill: "review" })` — code review before shipping |
| UI or frontend changes (JSX, CSS, Tailwind) | `Skill({ skill: "sb-design-audit" })` — design token audit before commit |
| Feature ready to ship | `Skill({ skill: "ship" })` — PR creation + deploy |
| User asks for QA or site testing | `Skill({ skill: "qa" })` — automated browser testing |

> Direct (inline) implementations: `review` is optional if the change is trivial (<5 lines, no logic).

---

## Skill Dependency Reference

This table shows which skills auto-invoke which, so you can understand the full chain before starting.

```
sb-orchestrate
  Phase 0 ──► design-consultation → brainstorming → writing-plans
  Phase 0 ──► sparc:orchestrator (complex refactors)
  Phase 0.5 → frontend-design    (new UI surfaces)
  Phase 0.5 → ui-ux-pro-max      (design decisions)
  Phase 0.5 → emilkowal-animations (motion work)
  Phase 0.5 → owasp-security     (auth/crypto/payments)
  Phase 0.5 → sb-react-patterns  (any JSX/Zustand)
  Phase 0.5 → sb-graph-navigate  (named symbol lookup)
  Phase 0.5 → sb-invoice-tax     (tax/invoice domain)
  Phase 0.5 → sb-deal-build      (deals domain)
  Phase 2 ──► review             (post-subagent)
  Phase 2 ──► sb-design-audit    (post-UI work)
  Phase 2 ──► ship               (ready to land)

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
