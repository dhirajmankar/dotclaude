---
name: "sb-react-patterns"
description: "StudioBooks React patterns — invoke when writing any component, hook, or store interaction. Triggered by: useState, useEffect, useMemo, Zustand store hooks, location.state prefill, navigation items, currency display. Encodes production failures from learnings.md — prevents infinite render loops, ESLint violations, and broken prefill flows specific to this codebase."
---

# sb-react-patterns — StudioBooks React Patterns

## What This Skill Does
Encodes the React patterns that burned time in this specific codebase. These are not general React advice — each one comes from a real incident. Read this before writing any component that uses state, effects, memos, Zustand, or navigation.

---

## Pattern 1 — Router State Prefill: useState initial value, not useEffect

**Incident:** Invoices.jsx used `useEffect` to call `setForm(location.state.prefill)` — ESLint flagged `react-hooks/set-state-in-effect` as a cascading render risk.

```jsx
// ❌ WRONG — ESLint error: react-hooks/set-state-in-effect
const [form, setForm] = useState({})
useEffect(() => {
  if (location.state?.prefill) {
    setForm(location.state.prefill)
  }
}, [location.state])

// ✅ CORRECT — read location.state before useState, use as initial value
const prefill = location.state?.prefill ?? {}
const [form, setForm] = useState(prefill)
useEffect(() => {
  if (location.state?.prefill) window.history.replaceState({}, '')
}, [])
```

**Rule:** `location.state` is available at initialization. Pass it directly to `useState`. The effect only needs to clean the history state — no `setState` calls.

---

## Pattern 2 — useMemo: always inline function, never named reference

**Incident:** `useMemo(getUpcomingTaxDeadline, [])` — ESLint error: "Expected the first argument to be an inline function expression."

```jsx
// ❌ WRONG — ESLint error on named reference
const deadline = useMemo(getUpcomingTaxDeadline, [])

// ✅ CORRECT — always inline arrow
const deadline = useMemo(() => getUpcomingTaxDeadline(), [])
```

**Rule:** The ESLint hooks plugin can't statically analyze a named function reference for dependency completeness. Always wrap in an inline arrow.

---

## Pattern 3 — Zustand Selectors: scalar only, never objects

**Incident:** Object selectors trigger React 19's stricter reference equality check → infinite re-render loop.

```jsx
// ❌ NEVER — new object on every render → infinite loop in React 19
const { deals, loading } = useDealStore((s) => ({ deals: s.deals, loading: s.loading }))

// ✅ ALWAYS — one selector per value
const deals = useDealStore((s) => s.deals)
const loading = useDealStore((s) => s.loading)
```

**Rule:** Object selectors create a new reference every call. React 19 strict mode turns this into an infinite loop. Always destructure into separate `const` selectors.

---

## Pattern 4 — Nav Items: NavItemSoon for planned features, never omit

**Incident:** 4 sidebar links (Tax Centre, Referrals, Calendar, Contacts) were removed as dead stubs — the sidebar looked sparse and users lost trust in the product roadmap.

```jsx
// ❌ WRONG — omitting planned features entirely
// { path: '/tax', icon: <TaxIcon />, label: 'Tax Centre' },  // deleted

// ✅ CORRECT — show as coming-soon stub
<NavItemSoon
  icon={<TaxIcon className="w-5 h-5" />}
  label="Tax Centre"
/>
```

`NavItemSoon` must render: `cursor-default opacity-40` styling + Lock badge + no onClick.

**Rule:** Planned features stay in the nav as locked stubs. They communicate roadmap without routing anywhere. Never delete a nav item — convert it to `NavItemSoon`.

---

## Pattern 5 — Currency: always formatINR(), never inline ₹

```jsx
// ❌ WRONG — hardcoded symbol or toLocaleString
<span>₹{amount}</span>
<span>{amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>

// ✅ CORRECT
import { formatINR } from '@/utils/formatCurrency'
<span>{formatINR(amount)}</span>
```

**Rule:** `formatINR()` handles lakhs formatting and future locale changes. Hardcoded ₹ bypasses this.

---

## Pattern 6 — Store Mutations: always guard with getIsReadOnly()

Every write action in every store must call `getIsReadOnly()` before touching Supabase:

```js
// ✅ Required in every store mutation
const { getIsReadOnly } = useSubscription.getState()
if (getIsReadOnly()) {
  set({ error: 'Upgrade to make changes' })
  return
}
// ... proceed with supabase write
```

**Rule:** Trial users in read-only mode silently fail without this guard. The `isReadOnly` state comes from `useSubscription` — trial expired + plan not paid.

---

## Pattern 7 — No AI Copy: plain human language in all UI text

```jsx
// ❌ WRONG — sounds like a marketing bot
"Effortlessly manage your brand deals"
"Seamlessly track your income"
"Your all-in-one creator platform"

// ✅ CORRECT — what a real person would say
"Your deals, in one place"
"Track what brands owe you"
"Invoicing for creators"
```

Banned phrases: "seamless", "effortlessly", "powerful", "all-in-one", "level up", "game-changer", "your journey", "take control", "built for you", "unlock your potential".

---

## When to Invoke

Invoke this skill before writing any component that uses:
- `useState` — check patterns 1, 3
- `useEffect` — check pattern 1
- `useMemo` / `useCallback` — check pattern 2
- Any Zustand store hook — check pattern 3
- Nav or sidebar items — check pattern 4
- Currency display — check pattern 5
- Store mutation / write action — check pattern 6
- Any UI copy (labels, empty states, headings) — check pattern 7

---

## Composability

- **Leaf skill** — does not call other skills
- **Related:** `sb-design-audit` — runs automated grep versions of patterns 3, 5, 7 during audit
- **Related:** `sb-deal-build` — deal-specific patterns for the pipeline component

---

## Feedback Protocol

Update rules governed by `sb-skill-feedback` skill.
- **Never change:** pattern numbering, ❌/✅ labels on code examples — `sb-design-audit` references these by pattern number
- **Safe to add:** new patterns at the bottom, new clarifications as sub-bullets, new `## Lessons Learned` entries
- **Breaking changes:** require version bump + user approval + migration note

Current version: 1.0

## Lessons Learned

<!-- Entries added after each invocation where a new edge case, canonical pattern, or rule clarification was discovered. -->
<!-- Format: - [YYYY-MM-DD] context: <task> — <one sentence lesson>. -->
