---
name: "sb-design-audit"
description: "StudioBooks design audit — AUTOMATICALLY invoke before committing any .jsx, .tsx, or .css file in this project. Never commit UI changes without running this first. Triggers: before staging component files, after editing pages or components, before any PR with UI changes, when a page looks visually broken. Checks stale tokens, broken Zustand selectors, missing formatINR, touch target violations."
---

# sb-design-audit — Design Audit

## What This Skill Does
Runs 4 automated checks against the StudioBooks codebase and reports violations. Each check maps to a real past incident or known failure mode. Takes ~30 seconds. Run before any UI commit.

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

## Reporting Format

```
🎨 DESIGN AUDIT REPORT
  Check 1 — Stale tokens:    ✅ clean  |  ❌ <N> violations
  Check 2 — Zustand selectors: ✅ clean  |  ❌ <N> violations
  Check 3 — formatINR:       ✅ clean  |  ❌ <N> violations
  Check 4 — Touch targets:   ✅ clean  |  ⚠️ <N> to review

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
- **Never change:** the `🎨 DESIGN AUDIT REPORT` format block — `sb-ui-build` gates on it
- **Safe to add:** new check categories, new anti-pattern examples, new `## Lessons Learned` entries
- **Breaking changes:** require version bump + user approval + migration note

Current version: 1.0

## Lessons Learned

<!-- Entries added after each invocation where a new edge case, canonical pattern, or rule clarification was discovered. -->
<!-- Format: - [YYYY-MM-DD] context: <task> — <one sentence lesson>. -->
