---
name: "sb-deal-build"
description: "StudioBooks deal feature builder — AUTOMATICALLY invoke for any deal, brand deal, pipeline, kanban, DealForm, DealDetail, drag-drop, or deal CRUD work. Routes to authoritative sub-skills. Never build deal features without reading these rules first — the stage machine and financial formulas have invariants that are easy to break."
model: haiku
auto-invokes:
  - sb-deal-stages   # Pipeline state machine (10 stages, valid transitions)
  - sb-deal-calc     # Deal financial calculation formulas
  - sb-invoice-tax   # When deal involves invoice creation
  - sb-react-patterns # All deal UI is React + Zustand
---

# sb-deal-build — Deal Feature Builder

## What This Skill Does
Entry point for all deal-related feature work. Reads authoritative sub-skills first, then encodes the component and data layer patterns specific to this codebase.

---

## Routing — Always Invoke These First

| Work area | Sub-skill to invoke |
|-----------|-------------------|
| Stage transitions, pipeline, kanban, stage validation | **`sb-deal-stages`** |
| Earned income, pending payments, overdue, dashboard stats | **`sb-deal-calc`** |
| Invoice creation from a deal, GST on deal amount | **`sb-invoice-tax`** |

Invoke the relevant sub-skill(s) BEFORE writing any code.

---

## Data Model

**Table:** `deals` in Supabase  
**Source of truth for type:** `src/store/dealStore.js`

Core fields:
```js
{
  id, user_id, brand_name, stage,       // identity
  amount, tds_applicable,               // financial
  go_live_date, payment_received_date,  // dates
  notes, contact_id,                    // relations
  created_at, updated_at
}
```

**Missing fields = Supabase NULL**, not empty string. Always use `?? ''` when reading optional strings.

---

## Store Pattern — dealStore.js

All CRUD in `src/store/dealStore.js`. Never call `supabase` from a component or page.

| Action | Store function |
|--------|---------------|
| Create | `createDeal(dealData)` — NOTE: the DB function is `addDeal` (known naming inconsistency, do not "fix" it) |
| Update | `updateDeal(id, patch)` — optimistic + revert on error |
| Delete | `deleteDeal(id)` — shows confirmation modal via `uiStore` |
| Stage change | `updateDeal(id, { stage: newStage })` — validate transition via sb-deal-stages first |
| Fetch | `fetchDeals()` — called on auth, not on demand |

**Read-only guard:** All mutations must call `getIsReadOnly()` first. If `true`, throw or show upgrade modal — never write to Supabase.

---

## Kanban Board (DealKanban)

File: `src/pages/Deals/DealKanban.jsx`

Drag-drop uses browser Drag API (no library). State is local to the board — drag start stores `draggedDealId`. On drop:
1. Get new stage from column drop target
2. Validate transition via stage machine rules
3. Call `updateDeal(id, { stage })`
4. Optimistic update: move card immediately, revert on error

Do NOT use React state for the drag — use `useRef` for `draggedDealId` to avoid extra renders.

---

## DealForm (Create/Edit Modal)

File: `src/pages/Deals/DealForm.jsx`

Controlled form — all fields in local state. On submit:
- Create flow: `createDeal(formData)` → close modal → toast success
- Edit flow: `updateDeal(id, patch)` → close modal → toast success

Read-only mode: if `getIsReadOnly()` — render all fields as `disabled`, show read-only banner at top (use `Input` with `readOnly` prop, not `disabled` — `disabled` grays out fields which looks broken on mobile).

Contact autocomplete reads from `contactStore.contacts`. Do not fetch contacts inline — assume they're loaded.

---

## DealDetail (Single Deal Page)

File: `src/pages/Deals/DealDetail.jsx`

- Stage selector: shows current stage + forward/back buttons. Enforce transition rules.
- Payment date field: only visible when `stage === 'paid'`.
- Invoice button: only visible when `stage === 'invoice_sent'` — navigates to `/invoices/new?dealId=<id>`.
- Delete: bottom of page, shows confirmation, then `deleteDeal(id)` → navigate to `/deals`.

---

## Mobile-First Patterns

- Cards in kanban: tap to open DealDetail (no long-press drag on mobile — swipe to reveal stage actions instead)
- DealForm: full-screen modal on mobile (`h-full rounded-none` on `<dialog>`), sheet-style on tablet
- Stage labels: abbreviated on xs screens (e.g. "In Prod" not "In Production")

---

## Composability

- **Routes to:** `sb-deal-stages`, `sb-deal-calc`, `sb-invoice-tax`
- Does not duplicate their rules — read them before coding

---

## Feedback Protocol

Update rules governed by `sb-skill-feedback` skill. Summary:
- **Never change:** `createDeal`/`addDeal` naming note — it's a known inconsistency to NOT fix
- **Safe to add:** new component patterns, new mobile hints, new `## Lessons Learned` entries
- **Breaking changes:** require version bump + user approval

Current version: 1.0

## Lessons Learned

<!-- Format: - [YYYY-MM-DD] context: <task> — <one sentence lesson>. -->
