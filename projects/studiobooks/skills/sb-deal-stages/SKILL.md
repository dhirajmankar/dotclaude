---
name: "sb-deal-stages"
description: "StudioBooks deal pipeline state machine — AUTOMATICALLY invoke when working on pipeline stages, stage transitions, drag-drop kanban, DealDetail stage progression, or deal status logic. Triggers: 'update stage', 'pipeline', 'kanban', 'deal stages', 'drag-drop', 'stage transition', 'mark as paid'. Encodes the 6 authoritative stages, allowed transitions, required fields per transition, free-tier limits, and the known addDeal/createDeal naming bug."
---

# sb-deal-stages — Deal Pipeline State Machine

## What This Skill Does
Encodes the authoritative 6-stage pipeline contract for StudioBooks. CLAUDE.md and some older docs say 10 stages — those are stale. There are 6 stages. Period.

---

## The 6 Stages (Authoritative)

| Stage | Editorial token | Meaning |
|-------|----------------|---------|
| `inquiry` | `text-foreground-muted` | Initial contact received |
| `negotiating` | `text-amber` | Terms being discussed |
| `confirmed` | `text-sky` | Deal confirmed, brief expected |
| `in_production` | `text-crimson-light` | Content being created |
| `invoice_sent` | `text-amber` | Invoice issued, awaiting payment |
| `paid` | `text-sky` | Payment received, deal closed |

Source of truth: `src/constants/dealStages.js`. Do not hardcode stage strings — always import from there.

---

## Allowed Stage Transitions

```
inquiry       → negotiating
negotiating   → confirmed  | inquiry      (back = fallback)
confirmed     → in_production | negotiating (back = revision)
in_production → invoice_sent | confirmed   (back = revision)
invoice_sent  → paid       | in_production (back = revision)
paid          → (terminal — no transition allowed)
```

**Current state:** drag-drop allows ANY transition — this is a known gap. When building or fixing kanban drag-drop or `DealDetail` stage selector, enforce these rules. Do not block backward moves, but do block `paid → anything`.

---

## Required Fields Before Transition

| Moving TO this stage | Must have |
|---------------------|-----------|
| `invoice_sent` | `amount > 0` AND `go_live_date` set |
| `paid` | `payment_received_date` set |

If required fields are missing, show an inline error instead of allowing the drag. Do not silently allow the transition.

---

## Free Tier Deal Limit

**Max 5 active deals** = deals where `stage NOT IN ['paid', 'inquiry']`

Check in `dealStore.js` using `getActiveDealCount()` before `createDeal()`. Do not add this check in components — it belongs in the store only.

When limit hit: show upgrade prompt (use `billingStore.openUpgradeModal()`), do not silently fail.

---

## Known Bug — addDeal vs createDeal

`src/hooks/useDeals.js` line 8 calls `addDeal()`.  
`src/store/dealStore.js` exports `createDeal()`.  
**These do not match — it is a runtime bug.**

Whenever touching `useDeals.js`, fix this import: change `addDeal` → `createDeal` in the import statement and all call sites within that file.

---

## Legacy Stage Migration

The old 10-stage system mapped to 6:

| Old stage | Maps to |
|-----------|---------|
| `contract_sent` | `confirmed` |
| `brief_received` | `in_production` |
| `delivered` | `invoice_sent` |
| `approved` | `invoice_sent` |
| `live` | `invoice_sent` |

Migration runs in `Deals.jsx` useEffect. **Do not add new mappings here** — if new legacy data appears, write a Supabase SQL migration instead.

---

## Kanban Column Order

Columns render left-to-right in this exact order:
`inquiry → negotiating → confirmed → in_production → invoice_sent → paid`

The `paid` column is intentionally narrower or collapsed on mobile (3-tap UX — creators rarely need to see paid deals in detail).

---

## Feedback Protocol

Update rules governed by `sb-skill-feedback` skill. Summary:
- **Never change:** stage names (they are DB values), transition table, reporting format strings
- **Safe to add:** new sub-rules, new examples, new `## Lessons Learned` entries
- **Breaking changes:** require version bump + user approval + migration note in `## Breaking Change Log`

Current version: 1.0

## Lessons Learned

<!-- Entries added after each invocation where a new edge case, canonical pattern, or rule clarification was discovered. -->
<!-- Format: - [YYYY-MM-DD] context: <task> — <one sentence lesson>. -->
