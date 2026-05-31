---
name: "sb-verify"
description: "StudioBooks verification gate — invoke before any git commit and as part of sb-session-end. Runs lint, build, and full test suite in order. Composable: sb-commit and sb-session-end call this first — never skip. Do NOT invoke after every individual file edit — batch to session-end."
model: haiku
---

# sb-verify — Verification Gate

## What This Skill Does
Runs the three mandatory checks in order and reports a structured status. Acts as the shared quality gate used by `sb-commit` and `sb-session-end`. Never skip — even for docs-only changes, run at minimum the lint + build.

---

## Execution Steps

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
Expected: all tests pass. Note the exact count (e.g. "323 passed").  
On failure: **STOP. Invoke `investigate` then `superpowers:systematic-debugging`. Only delete a test if the code it covered was intentionally removed — verify this first.**

---

## Reporting Format

After all three pass, report exactly this block so composing skills can parse it:

```
✅ VERIFY PASSED
  lint:   clean
  build:  ok
  tests:  <N> passed, <M> skipped
```

If any step fails, report:

```
❌ VERIFY FAILED at <step>
  Error: <first error line>
  Action required: invoke investigate → systematic-debugging → fix → re-run verify
```

---

## Rules

- Run in this exact order: lint → build → test. Don't skip steps.
- If lint fails, don't proceed to build (saves time).
- Always report the test count — it's used to track regression across sessions.
- Don't filter or suppress warnings. Report them.

---

## Composability

This skill is designed to be invoked by other skills:
- **`sb-commit`** calls this before staging files.
- **`sb-session-end`** calls this as the first step.
- Can also be invoked standalone: `/sb-verify`

---

## Feedback Protocol

Update rules governed by `sb-skill-feedback` skill. Summary:
- **Never change:** the `✅ VERIFY PASSED` / `❌ VERIFY FAILED` reporting format strings — downstream skills parse these exactly
- **Safe to add:** new sub-checks, new examples, new `## Lessons Learned` entries
- **Breaking changes:** require version bump + user approval + migration note in `## Breaking Change Log`

Current version: 1.0

## Lessons Learned

<!-- Entries added after each invocation where a new edge case, canonical pattern, or rule clarification was discovered. -->
<!-- Format: - [YYYY-MM-DD] context: <task> — <one sentence lesson>. -->
- [2026-05-20] skill gap audit: sb-orchestrate review — "STOP. Fix the issue." on failure is insufficient; without explicit routing to `investigate` + `systematic-debugging`, the fix path is ad-hoc and the debugging skills never get invoked from failure points.
