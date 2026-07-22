---
name: "sb-design-audit"
description: "StudioBooks design audit — AUTOMATICALLY invoke before committing any .jsx, .tsx, or .css file in this project. Never commit UI changes without running this first. Triggers: before staging component files, after editing pages or components, before any PR with UI changes, when a page looks visually broken. Checks stale tokens, broken Zustand selectors, missing formatINR, touch target violations, F1 render-order, motion scroll-safety, and hardcoded animation constants."
model: sonnet
---

# sb-design-audit — Design Audit

## What This Skill Does
Runs 7 automated checks against the StudioBooks codebase and reports violations. Each check maps to a real past incident or known failure mode. Takes ~30 seconds. Run before any UI commit.

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

**Why this exists:** Related bugs, all from framer-motion wrappers interacting badly with the app's single scroll container (`main` in AppLayout.jsx, `overflow-y-auto`): (a) `h-full` on a motion.div or its child collapses the scroll container's `scrollHeight` once framer-motion applies `will-change: transform` — first found 2026-06-15 (Settings.jsx), reintroduced 2026-07-13 when `AnimatedSwitch` wrapped Deals/InvoiceRegister without a matching height class; (b) a `fixed` overlay that isn't escaped via `createPortal` positions against a transformed motion.div ancestor instead of the viewport (`ProfilePickerSheet.jsx`, 2026-07-13); (d) a page's own top-level return wraps its content in a bare `motion.div` with its own `initial`/`animate` — AppLayout.jsx's `AnimatePresence`/`motion.div` around `<Outlet/>` already animates every route transition, so this double-animates and reproduces the exact will-change/scrollHeight bug via a path that doesn't touch `AnimatedSwitch` at all, so (c) never catches it (Tax.jsx/Income.jsx/Notifications.jsx, 2026-07-18 — reported by beta testers as "page not scrollable").

```bash
# (a) h-full as a direct child of an animated wrapper — should be min-h-full
grep -rn "h-full" src/pages/ src/components/ --include="*.jsx" | grep -v "min-h-full"

# (b) fixed-position overlays — check each result has createPortal in the same file
grep -rln "className=\"fixed \|className={\`fixed " src/pages/ src/components/ --include="*.jsx"

# (c) new AnimatedSwitch call sites — flag if wrapping page-level content with no className
grep -rn "<AnimatedSwitch" src/pages/ --include="*.jsx"

# (d) page-root bare motion.div — a page's own top-level return should never
# re-animate; AppLayout already does it for every route. Every hit needs
# manual confirmation it's the page's OWN top-level return (not a nested
# modal/sheet/branch, which legitimately animates on its own).
grep -rln "motion\.div" src/pages/*/*.jsx --include="*.jsx" | xargs -I{} sh -c 'grep -n -A2 "return (" "{}" | grep -q "motion\.div" && echo "{}"'
```

All four are **heuristics** — grep can't see computed layout or confirm whether a `fixed` element is already inside a portaled component (e.g. it's fine if the `fixed` div is itself the child of something the file portals higher up), and (d) can't distinguish a page's top-level return from a nested one on its own — open each flagged file and confirm which return statement matched. For (a): any `h-full` inside a `motion.div`/`AnimatedSwitch`/`AnimatedShow`-wrapped subtree should be `min-h-full` instead. For (b): every file in the result list should call `createPortal(..., document.body)` — if it doesn't, flag it. For (c): any `AnimatedSwitch` wrapping a full page (not just a small loading/error branch) should pass an explicit height `className` (e.g. `min-h-full`). For (d): if the match is the page's own top-level return, convert to a plain `<div>` — reuse the `.page-enter` CSS class (`src/index.css`, a one-shot CSS `@keyframes` animation, already the established pattern for e.g. Notifications.jsx's loading/empty branches) if an entrance animation is genuinely wanted; never framer-motion `initial`/`animate` at a page root.

**Pass:** no unexplained matches  
**Fail (⚠️ review):** list file:line for each candidate, with a one-line note on which of (a)/(b)/(c)/(d) applies

---

## Check 7 — Hardcoded Animation Constants

**Why this exists:** `Drawer.jsx` and `NotificationCenter.jsx` each hand-copied the `IOS_EASE` cubic-bezier value instead of importing it from `src/constants/animation.js` — only `Modal.jsx` actually imported the canonical constant (2026-07-21, ui-bug-batch). A future easing tweak to the shared constant would silently apply to only one of the three files.

```bash
grep -rln "cubic-bezier\|IOS_EASE\s*=" src/pages/ src/components/ --include="*.jsx" | grep -v "constants/animation.js"
```

**Pass:** zero matches (all easing values imported from `src/constants/animation.js`)
**Fail:** list file:line + the duplicated value. Fix: import `IOS_EASE` (or the relevant constant) from `@/constants/animation` instead of inlining it.

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
  Check 7 — Animation constants: ✅ clean  |  ❌ <N> violations

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

Current version: 1.2

## Lessons Learned

<!-- Entries added after each invocation where a new edge case, canonical pattern, or rule clarification was discovered. -->
<!-- Format: - [YYYY-MM-DD] context: <task> — <one sentence lesson>. -->
- [2026-07-13] scroll-and-state-races: added Check 5 (F1 render-order) and Check 6 (motion scroll-safety) after an investigation found the exact `h-full`-inside-motion.div scroll bug fixed 2026-06-15 had silently recurred via a brand-new primitive (AnimatedSwitch) that nobody checked against the old rule, plus a second instance of the same root cause on Tax.jsx's skeleton/error ordering. A fixed bug that only lives in `learnings.md` prose will resurface the next time a new component is built — it needs an automated heuristic check that runs on every UI commit, not just institutional memory.
- [2026-07-18] beta-defect-sweep: Check 6's (a)/(b)/(c) all target `AnimatedSwitch`-adjacent patterns, but Tax.jsx, Income.jsx, and Notifications.jsx each hand-rolled their own page-root `motion.div` with an independent `initial`/`animate` — never touching `AnimatedSwitch` — and slipped through the entire 2026-07-13 sweep undetected. Added (d) to close that gap. Root cause pattern: AppLayout.jsx's route-level `AnimatePresence` already animates every page transition; any page that ALSO animates its own root double-stacks framer-motion's `will-change: transform`, which is the actual scroll-breaking mechanism, not `AnimatedSwitch` specifically. The heuristic needs to key on "is this a page's own top-level return", not "does it use component X" — a check written against one primitive will always miss the same bug expressed through a different primitive.
- [2026-07-22] distillation: promoted from learnings.md ui-bug-batch (2026-07-21) — added Check 7 after finding the `IOS_EASE` easing constant hand-copied into `Drawer.jsx` and `NotificationCenter.jsx` instead of imported from `src/constants/animation.js`; only `Modal.jsx` actually imported it. Copy-pasting a shared constant instead of importing it means a future tweak silently applies to only one of several files — the same "shared value duplicated instead of imported" shape as the IOS_EASE case can recur with any other constant, so this check is intentionally broad (any `cubic-bezier`/`IOS_EASE` literal outside the constants file), not narrowly grep'd to just those two filenames.
