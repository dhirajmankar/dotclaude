---
name: "sb-design-audit"
description: "StudioBooks design audit — AUTOMATICALLY invoke before committing any .jsx, .tsx, or .css file in this project. Never commit UI changes without running this first. Triggers: before staging component files, after editing pages or components, before any PR with UI changes, when a page looks visually broken. Checks stale tokens, broken Zustand selectors, missing formatINR, touch target violations, F1 render-order, and motion scroll-safety."
model: sonnet
---

# sb-design-audit — Design Audit

## What This Skill Does
Runs 6 automated checks against the StudioBooks codebase and reports violations. Each check maps to a real past incident or known failure mode. Takes ~30 seconds. Run before any UI commit.

---

## Check 1 — Stale Design Tokens

```bash
grep -rn "navy-\|brand-purple\|brand-coral" src/ --include="*.jsx" --include="*.tsx" --include="*.css"
```

**Pass:** zero matches  
**Fail:** list each file:line + the offending class

**Fix:** Replace with Editorial tokens:
- `navy-*` → `surface-*` (backgrounds) or `foreground`/`foreground-muted` (text)
- `brand-purple` → `crimson` or `crimson-light`
- `brand-coral` → `amber`

**Full token reference:**

| Token | Use |
|-------|-----|
| `bg-surface` | Page background (root) |
| `bg-surface-mid` | Cards |
| `bg-surface-high` | Elevated cards |
| `bg-surface-highest` | Modals, drawers |
| `border-outline` | Default borders |
| `border-outline-subtle` | Dividers, subtle separators |
| `text-foreground` | Primary text |
| `text-foreground-muted` | Secondary / helper text |
| `bg-crimson` / `text-crimson` | Primary actions, buttons, CTAs |
| `text-crimson-light` | Crimson text on dark backgrounds |
| `text-amber` | Eyebrow tags, accent highlights |
| `text-sky` | Informational, tertiary |

**Typography:** `font-serif` (headlines) / `font-sans` (body) / `font-mono` (labels, buttons — UPPERCASE)  
**No box-shadows** — use tonal layering (`surface` → `surface-mid` → `surface-high` → `surface-highest`)  
**Minimum touch target:** `min-h-11 min-w-11` (44×44px)

---

## Check 2 — Broken Zustand Selectors

```bash
grep -rn "useStore.*=>" src/store/ src/pages/ src/components/ --include="*.jsx" --include="*.tsx" | grep -E "useStore\(\s*\(s\)\s*=>\s*\(\{"
```

Also manually scan any file touched this session for this anti-pattern:

```js
// ❌ NEVER — creates new object every render → infinite loop in React 19
const { deals, loading } = useDealStore((s) => ({ deals: s.deals, loading: s.loading }))

// ✅ ALWAYS — separate scalar selectors
const deals = useDealStore((s) => s.deals)
const loading = useDealStore((s) => s.loading)
```

**Pass:** no object selectors found  
**Fail:** list each file:line + show the bad selector

---

## Check 3 — Missing formatINR

```bash
grep -rn "₹\|toLocaleString.*INR\|currency.*INR" src/ --include="*.jsx" --include="*.tsx" | grep -v "formatINR\|DESIGN\|SKILL\|\.md"
```

Any hardcoded INR formatting that bypasses `formatINR()` is a violation.

**Pass:** zero matches  
**Fail:** list file:line. Fix: import `formatINR` from `src/utils/formatCurrency.js` and use it.

---

## Check 4 — Touch Target Violations

Scan files changed this session for interactive elements (`<button>`, `role="button"`, `onClick=`) that lack minimum touch target sizing.

```bash
grep -rn "onClick=" src/pages/ src/components/ --include="*.jsx" | grep -v "className=.*min-h-\|className=.*py-\|className=.*p-[3-9]\|className=.*p-1[0-9]"
```

This is a heuristic — not all matches are violations. Review each match:
- Buttons need `min-h-11` (44px) or `py-3 px-4` minimum
- List row items need `py-3 px-4`
- Icon-only buttons need `w-11 h-11`

**Pass:** all interactive elements have adequate sizing  
**Fail:** list the element + file:line + suggested fix

---

## Check 5 — F1 Render-Order (error-before-loading)

**Why this exists:** Tax.jsx built a consolidated `pageError` + retry banner (row 22, "F1") but the skeleton's `!summaryReady` early return ran BEFORE that banner was ever reached — a failed fetch never sets `hasFetched`, so `summaryReady` stayed false forever and the page was stuck on a permanent skeleton with no way to recover (2026-07-13 investigation, finding T-C). Dashboard/Deals/InvoiceRegister/Analytics got the correct ordering; Tax didn't, because nothing enforced the rule beyond convention.

```bash
grep -rn "if (!.*Ready)\|if (!.*hasFetched)\|if (loading)" src/pages/ --include="*.jsx"
```

This is a **heuristic, not a hard gate** — a grep cannot verify actual render order, only flag candidate early returns. For each match: open the file and check whether an `error`/`ErrorState` reference exists **above** that line (in source order). If the file has no error handling above the loading/skeleton return at all, flag it for manual review — it may be intentional (the page genuinely has no failure mode) or it may be the same bug recurring.

**Pass:** every match has a preceding error check, or is confirmed to have no failure mode  
**Fail (⚠️ review):** list file:line for any match with no error check above it

---

## Check 6 — Motion Scroll-Safety

**Why this exists:** Two related bugs, both from framer-motion wrappers interacting badly with the app's single scroll container (`main` in AppLayout.jsx, `overflow-y-auto`): (a) `h-full` on a motion.div or its child collapses the scroll container's `scrollHeight` once framer-motion applies `will-change: transform` — first found 2026-06-15 (Settings.jsx), reintroduced 2026-07-13 when `AnimatedSwitch` wrapped Deals/InvoiceRegister without a matching height class; (b) a `fixed` overlay that isn't escaped via `createPortal` positions against a transformed motion.div ancestor instead of the viewport (`ProfilePickerSheet.jsx`, 2026-07-13).

```bash
# (a) h-full as a direct child of an animated wrapper — should be min-h-full
grep -rn "h-full" src/pages/ src/components/ --include="*.jsx" | grep -v "min-h-full"

# (b) fixed-position overlays — check each result has createPortal in the same file
grep -rln "className=\"fixed \|className={\`fixed " src/pages/ src/components/ --include="*.jsx"

# (c) new AnimatedSwitch call sites — flag if wrapping page-level content with no className
grep -rn "<AnimatedSwitch" src/pages/ --include="*.jsx"
```

All three are **heuristics** — grep can't see computed layout or confirm whether a `fixed` element is already inside a portaled component (e.g. it's fine if the `fixed` div is itself the child of something the file portals higher up). For (a): any `h-full` inside a `motion.div`/`AnimatedSwitch`/`AnimatedShow`-wrapped subtree should be `min-h-full` instead. For (b): every file in the result list should call `createPortal(..., document.body)` — if it doesn't, flag it. For (c): any `AnimatedSwitch` wrapping a full page (not just a small loading/error branch) should pass an explicit height `className` (e.g. `min-h-full`).

**Pass:** no unexplained matches  
**Fail (⚠️ review):** list file:line for each candidate, with a one-line note on which of (a)/(b)/(c) applies

---

## Reporting Format

```
🎨 DESIGN AUDIT REPORT
  Check 1 — Stale tokens:      ✅ clean  |  ❌ <N> violations
  Check 2 — Zustand selectors: ✅ clean  |  ❌ <N> violations
  Check 3 — formatINR:         ✅ clean  |  ❌ <N> violations
  Check 4 — Touch targets:     ✅ clean  |  ⚠️ <N> to review
  Check 5 — F1 render-order:   ✅ clean  |  ⚠️ <N> to review
  Check 6 — Motion scroll-safety: ✅ clean  |  ⚠️ <N> to review

  <violation details if any>

  Overall: ✅ CLEAN — safe to commit UI changes
         | ❌ FIX REQUIRED — address violations before committing
```

---

## When to Run

- Before any commit that touches `.jsx`/`.tsx`/`.css` files
- After a design system migration
- When a page "looks wrong" — run this before investigating CSS
- As a standalone pre-PR check: `/sb-design-audit`

---

## Composability

- **Leaf skill** — does not call other skills
- **Called by:** nothing automatically; invoke explicitly before UI commits
- **Related:** `DESIGN.md` for the full design spec; `tailwind.config.js` for token definitions

---

## Feedback Protocol

Update rules governed by `sb-skill-feedback` skill. Summary:
- **Never change:** the `🎨 DESIGN AUDIT REPORT` format block's shape/wording conventions — `sb-ui-build` gates on it
- **Safe to add:** new check categories (as new rows within the same report shape), new anti-pattern examples, new `## Lessons Learned` entries
- **Breaking changes:** require version bump + user approval + migration note

Current version: 1.1

## Lessons Learned

<!-- Entries added after each invocation where a new edge case, canonical pattern, or rule clarification was discovered. -->
<!-- Format: - [YYYY-MM-DD] context: <task> — <one sentence lesson>. -->
- [2026-07-13] scroll-and-state-races: added Check 5 (F1 render-order) and Check 6 (motion scroll-safety) after an investigation found the exact `h-full`-inside-motion.div scroll bug fixed 2026-06-15 had silently recurred via a brand-new primitive (AnimatedSwitch) that nobody checked against the old rule, plus a second instance of the same root cause on Tax.jsx's skeleton/error ordering. A fixed bug that only lives in `learnings.md` prose will resurface the next time a new component is built — it needs an automated heuristic check that runs on every UI commit, not just institutional memory.
