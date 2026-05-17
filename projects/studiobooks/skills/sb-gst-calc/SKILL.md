---
name: "sb-gst-calc"
description: "StudioBooks GST calculation rules — AUTOMATICALLY invoke when computing invoice totals, modifying taxCalc.js, building invoice UI, fixing GST display, or handling supply type logic. Triggers: invoice amount calculation, CGST/SGST/IGST split, place of supply, export of services, SAC code selection. Encodes rounding rules, intra/inter split, zero-rating for exports, and the exact Total Payable formula."
---

# sb-gst-calc — GST Calculation Rules

## What This Skill Does
Encodes the exact GST computation contract for StudioBooks invoices. Wrong GST on an invoice = compliance liability. These rules are authoritative — they override any GST logic inferred from general knowledge.

---

## GST Rate

**Standard rate: 18%** for all content/digital services (SAC 998361–998399).

| SAC Range | Service | Rate |
|-----------|---------|------|
| 998361 | Digital advertising / influencer content | 18% |
| 998371 | Photography | 18% |
| 998372 | Video editing | 18% |
| 998392 | Graphic design | 18% |
| 998313 | Writing/copywriting | 18% |
| 998374 | Music production | 18% |

If a future SAC code falls outside 998300–998399, verify the rate before using 18%.

---

## Supply Type Detection

Compare first 2 characters of creator GSTIN vs client GSTIN (state codes):

```js
const creatorState = creatorGstin.substring(0, 2)
const clientState = clientGstin.substring(0, 2)
const supplyType = creatorState === clientState ? 'intra' : 'inter'
```

Fallback (no client GSTIN): use `profile.home_state_code` vs `"00"` → always `'intra'`.

---

## GST Split Rules

### Intra-state (same state) → CGST + SGST

**CRITICAL — do NOT use `Math.round(gst/2)` twice.** This drops ₹1 on odd GST totals.

```js
// ✅ CORRECT
const cgst = Math.ceil(gst / 2)   // rounds up
const sgst = Math.floor(gst / 2)  // rounds down
// cgst + sgst === gst always true

// ❌ WRONG — current bug in codebase
const cgst = Math.round(gst / 2)
const sgst = Math.round(gst / 2)  // loses ₹1 when gst is odd
```

### Inter-state (different states) → IGST only

```js
const igst = gst  // single line item, no split
const cgst = 0
const sgst = 0
```

---

## Total Payable Formula

```
base          = invoice amount (pre-GST)
gst           = Math.round(base * 0.18)    // when gst_applicable = true
gross         = base + gst                 // = Total Payable on invoice face
tds           = Math.round(gross * tdsRate) // informational only
net_receivable = gross - tds               // what creator actually gets
```

**RULE: Total Payable on the invoice = `gross`. Never subtract TDS from Total Payable.**

TDS lines below Total Payable are informational display only:
```
Total Payable:            ₹11,800
Less: TDS u/s 392 (10%):   ₹1,180
Amount receivable:        ₹10,620
```

---

## Place of Supply

1. First 2 digits of client GSTIN (state code)
2. Fallback: `profile.home_state_code`
3. Error state: if neither present, block invoice from being sent (not just drafted)

Place of supply must appear on the invoice as the state name (not just code). Use `indianStates.js` to map code → name.

---

## Export of Services — Zero-Rated GST

If the brand/client is **outside India**, the service is an export of services:
- GST rate: **0%** (zero-rated under IGST Act 2017, Section 16(3))
- No CGST, SGST, or IGST charged
- Invoice must include: `"Export of Services — Zero Rated Supply u/s 16(3) IGST Act, 2017"`
- Requires a Letter of Undertaking (LUT) filed with GST authorities (inform the creator, don't block the invoice)
- Detection: `invoice.client_country !== 'India'` — add `client_country` field to invoice form

This case is **not yet implemented** in the codebase. When building it, add to `gstUtils.js`:
```js
export function isExportOfService(clientCountry) {
  return clientCountry && clientCountry.trim().toLowerCase() !== 'india'
}
```

---

## SAC Code on Invoice

- Use `profile.primary_sac` if set
- Else default to `'998361'`
- **Always show SAC code on invoice** — mandatory GST compliance field
- If defaulting, show a one-time warning in the UI: "Using default SAC 998361. Update in Settings → Profile if your primary service is different."

---

## Reverse Charge

Always `false` for creators registered under the regular GST scheme. Flag for manual review if:
- Client is an unregistered business (no GSTIN)
- Creator is under Composition Scheme (not yet supported — add a flag when implemented)

Do not add UI for reverse charge toggle in Phase 1.

---

## Composability

- **Leaf skill** — does not call other skills
- **Called by:** `sb-invoice-tax` (Step 3 of invoice tax chain)
- **Standalone use:** invoke when modifying `taxCalc.js`, invoice total display, or supply type detection

---

## Feedback Protocol

Update rules governed by `sb-skill-feedback` skill. Summary:
- **Never change:** the `ceil/floor` CGST/SGST rounding rule, the Total Payable formula, or the zero-rating export rule — these are compliance contracts
- **Safe to add:** new SAC code rows, new supply type edge cases, new `## Lessons Learned` entries
- **Breaking changes:** require version bump + user approval + migration note

Current version: 1.0

## Lessons Learned

<!-- Entries added after each invocation where a new edge case, canonical pattern, or rule clarification was discovered. -->
<!-- Format: - [YYYY-MM-DD] context: <task> — <one sentence lesson>. -->
