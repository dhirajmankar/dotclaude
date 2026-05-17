---
name: "sb-tds-rules"
description: "StudioBooks TDS rules — AUTOMATICALLY invoke when modifying TDS display, income threshold alerts, tds_records writes, Dashboard earned-amount, or any Section 194J/392 logic. Triggers: TDS rate dropdown, income warning thresholds, Form 16A, quarterly TDS tracking, financial year boundaries. Encodes April 2026 Income Tax Act 2025 section renaming, ₹50,000 threshold, and dual section references for transition period."
---

# sb-tds-rules — TDS Application Rules

## What This Skill Does
Encodes the authoritative TDS rules for StudioBooks — updated for the Income Tax Act 2025 (effective April 1, 2026). This is the single source of truth for TDS thresholds, section numbers, financial year boundaries, and what to record in `tds_records`.

---

## Financial Year Boundary

**Financial year: April 1 – March 31.**

This is the correct boundary. `BUSINESS_LOGIC.md`'s reference to "Jan 1" refers only to invoice number sequence reset — not the financial year. Any TDS threshold, advance tax, or Form 16A calculation uses the Apr–Mar boundary.

```js
// Correct FY detection (already correct in Income.jsx)
const now = new Date()
const fyStart = now.getMonth() >= 3   // April = month index 3
  ? new Date(now.getFullYear(), 3, 1)
  : new Date(now.getFullYear() - 1, 3, 1)
```

---

## TDS Threshold — Updated April 1, 2025

| Threshold | Value | Action |
|-----------|-------|--------|
| **Warning threshold** | ₹45,000 | Show amber alert in Income page: "Approaching TDS threshold" |
| **TDS applies from** | ₹50,000 | Show TDS fields on invoice; `tds_applicable = true` |

**The old ₹30,000 threshold is stale.** Update all references:
- `Income.jsx` warning: ₹28,000 → **₹45,000**
- `BUSINESS_LOGIC.md`: ₹30,000 → **₹50,000**
- `BUSINESS_LOGIC.md` TDS section: update threshold to ₹50,000

---

## TDS Section Numbers — Income Tax Act 2025

The Income Tax Act 2025 (effective April 1, 2026) renumbers all TDS sections:

| Old (pre-2026) | New (IT Act 2025) | Rate | For |
|----------------|-------------------|------|-----|
| Section 194J | **Section 392** | 10% | Professional/technical services — individual creators, freelancers |
| Section 194C | **Section 393** | 1% | Works contract — agencies, contractors |

### Transition Rule (FY 2026-27 and FY 2027-28)

During the transition period, brands may still issue Form 16A with old section numbers. The app must handle both:

**Invoice display (FY 2026-27):**
```
Less: TDS u/s 392, IT Act 2025 (erstwhile 194J) @ 10%     ₹1,180
```

**After FY 2027-28:** drop the "erstwhile" reference.

**In code (`gstUtils.js` `mapTdsSection`):**
```js
// Current (stale):
return rate === 0.1 ? '194J' : '194C'

// Updated (correct from April 2026):
return rate === 0.1
  ? { new: '392', old: '194J', display: 'Sec 392 (erstwhile 194J)' }
  : { new: '393', old: '194C', display: 'Sec 393 (erstwhile 194C)' }
```

---

## TDS Application Logic

1. TDS is deducted by the **brand/payer** — not the creator. Creator cannot "not charge TDS".
2. TDS applies when cumulative payments from one brand in the current FY exceed ₹50,000.
3. Creator selects TDS rate (No TDS / 10% / 1%) on invoice — brand sends Form 16A at year end.
4. Invoice Total Payable = gross (base + GST). TDS lines are informational only (see `sb-gst-calc`).

### TDS Rate Dropdown options:
| Option | Section | When |
|--------|---------|------|
| No TDS | — | Brand hasn't crossed ₹50,000 threshold yet |
| 10% | Sec 392 (erstwhile 194J) | Individual creator providing professional services |
| 1% | Sec 393 (erstwhile 194C) | Agency or works contract arrangement |

---

## tds_records Table — When to Write

The `tds_records` table exists in schema but is **never written to** currently. Write a row to it when:

**Trigger:** Invoice status changes to `'paid'` AND `invoice.tds_amount > 0`

**Row to insert:**
```js
{
  user_id: auth.uid(),
  brand_name: invoice.client_name,
  financial_year: getFY(invoice.payment_received_date),  // e.g., "2026-27"
  quarter: getQuarter(invoice.payment_received_date),    // "Q1"/"Q2"/"Q3"/"Q4"
  gross_amount: invoice.gross_amount,
  tds_amount: invoice.tds_amount,
  tds_section: invoice.tds_section,   // "392" or "393"
  form_16a_received: false             // default; user marks it true manually
}
```

**Quarter mapping (Apr–Mar FY):**
- Q1: April–June
- Q2: July–September
- Q3: October–December
- Q4: January–March

---

## Dashboard "Earned This Month"

```js
// Correct formula
const earned = deals
  .filter(d => d.stage === 'paid' && isThisMonth(d.payment_received_date))
  .reduce((sum, d) => {
    const gross = d.deal_value
    const tds = d.tds_applicable ? Math.round(gross * 0.10) : 0
    return sum + (gross - tds)  // show net received, not gross
  }, 0)
```

Annual income for ITR is always gross. Only the Dashboard "earned" figure shows net-of-TDS.

---

## Advance Tax Thresholds

| Estimated annual income | Action |
|------------------------|--------|
| > ₹2.5L | Quarterly advance tax installments due |
| > ₹5L | ITR filing mandatory |
| > ₹20L | GST registration mandatory |

Quarterly deadlines are in `src/constants/taxDates.js` — always use those constants, never hardcode dates.

---

## Composability

- **Leaf skill** — does not call other skills
- **Called by:** `sb-invoice-tax` (Step 4 of invoice tax chain)
- **Standalone use:** invoke when modifying TDS display, income warning thresholds, `tds_records`, or Dashboard earned calculation

---

## Feedback Protocol

Update rules governed by `sb-skill-feedback` skill. Summary:
- **Never change:** the ₹50,000 TDS threshold, the Section 392/393 section numbers, or the April–March FY boundary — these are statutory facts
- **Safe to add:** new advance tax thresholds, new quarter mapping notes, new `## Lessons Learned` entries
- **Breaking changes:** require version bump + user approval + migration note

Current version: 1.0

## Lessons Learned

<!-- Entries added after each invocation where a new edge case, canonical pattern, or rule clarification was discovered. -->
<!-- Format: - [YYYY-MM-DD] context: <task> — <one sentence lesson>. -->
