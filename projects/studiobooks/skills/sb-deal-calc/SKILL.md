---
name: "sb-deal-calc"
description: "StudioBooks deal financial calculations — AUTOMATICALLY invoke when computing or displaying earned income, pending payments, overdue deals, active deal count, upcoming deadlines, or invoice follow-ups. Triggers: 'earned this month', 'pending payment', 'overdue', 'active deals', 'dashboard stats', 'invoice follow-up', 'upcoming deadlines'. Encodes authoritative formulas from useDeals.js — never duplicate these in components."
model: haiku
---

# sb-deal-calc — Deal Financial Calculations

## What This Skill Does
All deal financial calculations have one source of truth: `src/hooks/useDeals.js`. This skill encodes what those formulas are so they are never reimplemented incorrectly in a component, store, or new hook.

**Rule:** Never compute these values outside of `useDeals.js`. Import the hook, use its return values.

---

## earnedThisMonth

Shows **net received** (after TDS deduction when applicable).

```js
deals
  .filter(d => d.stage === 'paid' && isThisMonth(d.payment_received_date))
  .reduce((sum, d) => sum + (d.tds_applicable ? d.amount * 0.9 : d.amount), 0)
```

- Uses `payment_received_date` — not `created_at`, not `go_live_date`
- Financial year boundary: April 1 – March 31
- Display with `formatINR()` from `src/utils/formatCurrency.js`

---

## pendingPayment

Shows **gross pending** (TDS not deducted — payment not yet received).

```js
deals
  .filter(d => d.stage === 'invoice_sent')
  .reduce((sum, d) => sum + d.amount, 0)
```

---

## overduePayments

Returns **array of deal objects** (not a sum). Caller decides whether to show count (badge) or list (detail view).

```js
deals.filter(d =>
  d.stage !== 'paid' &&
  d.payment_expected_date &&
  new Date(d.payment_expected_date) < new Date()
)
```

---

## activeDeals

Count of deals in active work stages (excludes bookends).

```js
deals.filter(d => !['paid', 'inquiry'].includes(d.stage)).length
```

Used for free-tier limit display: "X / 5 active deals". Max is 5 on free tier.

---

## upcomingDeadlines

Next 3 deals by `go_live_date`, excluding completed deals.

```js
deals
  .filter(d => d.go_live_date && d.stage !== 'paid')
  .sort((a, b) => new Date(a.go_live_date) - new Date(b.go_live_date))
  .slice(0, 3)
```

Returns deal objects. Display `go_live_date` with `formatDate()` from `src/utils/formatDate.js`.

---

## invoiceFollowUps

Deals past 7 days since invoice was sent with no payment received.

```js
deals.filter(d =>
  d.stage === 'invoice_sent' &&
  d.invoice_sent_date &&
  daysSince(d.invoice_sent_date) > 7 &&
  !d.payment_received_date
)
```

Used in: Dashboard attention items, WhatsApp nudge button. Returns deal objects.

---

## Universal Rules

- **Always use `formatINR()`** for any displayed currency value. Never format manually.
- **Financial year:** April 1 – March 31 (consistent with `sb-tds-rules`)
- **`earned` = net-of-TDS.** Annual income for ITR is always gross (TDS rules domain — see `sb-tds-rules`).
- **Never compute in JSX.** Extract to `useDeals.js` first, consume as hook return value.
- All date comparisons use `new Date()` — no moment.js, no dayjs (not installed).

---

## Feedback Protocol

Update rules governed by `sb-skill-feedback` skill. Summary:
- **Never change:** formula implementations (they are the authoritative contract)
- **Safe to add:** new derived calculations, new examples, new `## Lessons Learned` entries
- **Breaking changes:** formula changes require version bump + user approval + migration note

Current version: 1.0

## Lessons Learned

<!-- Entries added after each invocation where a new edge case, canonical pattern, or rule clarification was discovered. -->
<!-- Format: - [YYYY-MM-DD] context: <task> — <one sentence lesson>. -->
