---
name: "sb-verify"
description: "StudioBooks verification gate — invoke before any git commit and as part of sb-session-end. TWO MODES: targeted (default, per-commit — runs only tests matching changed files, no lint/build) and full (lint + build + entire suite — session-end, pre-PR, or on request). Composable: sb-commit calls targeted mode; sb-session-end calls full mode. Do NOT invoke after every individual file edit — batch to commit time."
model: haiku
---

# sb-verify — Verification Gate

## What This Skill Does
Runs verification checks and reports a structured status. Acts as the shared quality gate used by `sb-commit` and `sb-session-end`.

**Two modes — pick by moment, not by mood:**

| Mode | When | Runs |
|------|------|------|
| `targeted` (default) | Every mid-session commit (via `sb-commit`) | Only vitest files matching the changed files. No lint (husky `lint-staged` lints staged files at commit), no build (CI + Vercel both build). |
| `full` | Session-end (via `sb-session-end`), before any PR/push, on explicit request, or when config/deps changed | lint → build → entire test suite (current behavior since v1.0) |

**Why tiered (2026-07-11 decision, user-approved):** the old always-full gate ran lint + `vite build` + the entire ~1654-test suite before *every* commit, then again at session-end, then again in CI, then Vercel built a 4th time — a 3-commit session re-verified identical code ~5×. The full suite still runs ≥1× per session (session-end) + in CI on every push, which is what actually catches cross-store mock drift (see learnings.md 2026-07-10: "a full-suite run is the only thing that catches this" — once per session, not once per commit). **Do not "fix" targeted mode back to full — that redundancy was removed deliberately.**

---

## Mode: targeted (default)

### Step T1 — Derive changed files
```bash
git diff --name-only HEAD
git diff --cached --name-only
```
Union the two lists (working tree + staged).

### Step T2 — Map changed files to test files
- A changed test file (`tests/**/*.test.*`) → include itself.
- `src/<area>/<Name>.jsx|js` → `tests/<area>/<Name>*.test.*` (tests/ mirrors src/).
- Changed store/service/hook (`src/store/`, `src/lib/services/`, `src/hooks/`) → include its own test file plus any test files already in the diff.
- Escalate to **full mode** instead if the diff touches: `vite.config.js`, `package.json`/`package-lock.json`, `eslint.config.js`, `src/test/setup.js`, or `tailwind.config.js` — config changes have unbounded blast radius.

### Step T3 — Run targeted tests
```bash
npx vitest run <matched test files>
```
If **zero** test files match (docs-only, config-only, asset-only change): skip tests entirely and report `tests: skipped (no matching test files)`.
On failure: **STOP. Invoke `investigate` then `superpowers:systematic-debugging` before attempting any fix. Never inline-patch without diagnosing root cause first.**

> No lint step in targeted mode — husky `lint-staged` runs ESLint on the staged files during `git commit` and blocks on failure. No build step — CI (`ci.yml` perf-budget job) and Vercel both run `npm run build` on push.

---

## Mode: full

### Step 1 — Lint
```bash
npm run lint
```
Expected: zero errors. Warnings are acceptable.
On failure: **STOP. Invoke `investigate` then `superpowers:systematic-debugging` before attempting any fix. Never inline-patch without diagnosing root cause first.**

### Step 2 — Build
```bash
npm run build
```
Expected: `dist/` created, no TypeScript or Vite errors.
On failure: **STOP. Invoke `investigate` then `superpowers:systematic-debugging`. Build errors often have a root cause one layer above the reported line.**

### Step 3 — Tests
```bash
npm run test -- --run
```
Expected: all tests pass. Note the exact count (e.g. "1654 passed").
On failure: **STOP. Invoke `investigate` then `superpowers:systematic-debugging`. Only delete a test if the code it covered was intentionally removed — verify this first.**

---

## Reporting Format

On success, report exactly this block so composing skills can parse it:

```
✅ VERIFY PASSED
  mode:   <targeted|full>
  lint:   <clean | deferred to lint-staged>
  build:  <ok | deferred to CI/Vercel>
  tests:  <N> passed, <M> skipped  (or: skipped — no matching test files)
```

If any step fails, report:

```
❌ VERIFY FAILED at <step>
  Error: <first error line>
  Action required: invoke investigate → systematic-debugging → fix → re-run verify
```

---

## Rules

- Targeted mode is the default. Full mode fires at session-end, pre-PR/push, on explicit request, or on the config-file escalation in Step T2.
- Full mode order is fixed: lint → build → test. If lint fails, don't proceed to build (saves time).
- Always report the test count in full mode — it's used to track regression across sessions.
- Don't filter or suppress warnings. Report them.
- Never run two vitest processes in parallel (vite.config.js comment: RAM-bound, GC death spiral).

---

## Composability

This skill is designed to be invoked by other skills:
- **`sb-commit`** calls this in **targeted** mode before staging files.
- **`sb-session-end`** calls this in **full** mode as the first step (skip-if-clean rules live there).
- Can also be invoked standalone: `/sb-verify` (targeted) or `/sb-verify full`

---

## Feedback Protocol

Update rules governed by `sb-skill-feedback` skill. Summary:
- **Never change:** the `✅ VERIFY PASSED` / `❌ VERIFY FAILED` reporting format strings — downstream skills parse these exactly
- **Safe to add:** new sub-checks, new examples, new `## Lessons Learned` entries
- **Breaking changes:** require version bump + user approval + migration note in `## Breaking Change Log`

Current version: 2.0

## Breaking Change Log

- **2.0 (2026-07-11, user-approved dev-pipeline optimization):** split single always-full gate into `targeted` (default, per-commit) + `full` (session-end/pre-PR) modes. Report block gained a `mode:` line; `lint:`/`build:` may now read "deferred". Rationale: quadruple verification redundancy (per-commit + session-end + CI + Vercel). Full-suite safety preserved at session-end + CI.

## Lessons Learned

<!-- Entries added after each invocation where a new edge case, canonical pattern, or rule clarification was discovered. -->
<!-- Format: - [YYYY-MM-DD] context: <task> — <one sentence lesson>. -->
- [2026-05-20] skill gap audit: sb-orchestrate review — "STOP. Fix the issue." on failure is insufficient; without explicit routing to `investigate` + `systematic-debugging`, the fix path is ad-hoc and the debugging skills never get invoked from failure points.
