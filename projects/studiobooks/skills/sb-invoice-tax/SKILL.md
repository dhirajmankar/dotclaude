---
name: "sb-invoice-tax"
description: "StudioBooks invoice + tax knowledge hub — AUTOMATICALLY invoke for any invoice, GST, TDS, GSTIN, SAC code, supply type, Section 194J/192/392/393, Form 16A, or tax threshold work. Routes to the authoritative sub-skill for the exact domain. Never guess tax rules — always route through here."
model: haiku
auto-invokes:
  - sb-gst-calc       # GST calculation rules and supply type decision
  - sb-tds-rules      # TDS deduction rules (Income Tax Act 2025)
  - sb-gstin-validate # GSTIN format + checksum validation
---

# sb-invoice-tax — Invoice & Tax Knowledge Hub

## What This Skill Does
Routes to the correct sub-skill for the specific tax or invoice domain. Each sub-skill is the authoritative source for its area. Pick the right one based on the task.

---

## Routing Table

| Task | Sub-skill to invoke |
|------|-------------------|
| TDS rate, threshold (₹50,000), Section 194J/192, Form 16A, tds_records | **`sb-tds-rules`** |
| GST calculation, supply type, CGST/SGST/IGST split, GST rate, invoice GST fields | **`sb-gst-calc`** |
| GSTIN format validation, checksum, PAN extraction from GSTIN | **`sb-gstin-validate`** |
| SAC code, invoice number format (INV2026001), invoice template, PDF print | Read authoritative rules below |
| Multiple of the above | Invoke ALL relevant sub-skills before coding |

---

## SAC Codes — StudioBooks Authoritative List

| Service | SAC Code | GST Rate |
|---------|----------|----------|
| Social media content creation | 998361 | 18% |
| Photography / videography | 998384 | 18% |
| Audio/music production | 998391 | 18% |
| Brand promotion / influencer marketing | 998366 | 18% |
| Consulting / advisory | 998311 | 18% |
| Writing / editorial content | 998363 | 18% |

Source: `src/constants/sacCodes.js`. Never hardcode — always import.

---

## Invoice Number Format

Format: `INV{YYYY}{NNN}` where:
- `YYYY` = calendar year (NOT financial year)
- `NNN` = 3-digit zero-padded sequence, resets every January 1

Examples: `INV2026001`, `INV2026002`, `INV2027001`

The sequence is tracked in Supabase — read `invoiceStore.js` for the auto-increment query.

---

## Supply Type Decision Tree

```
Creator and brand in same state?
  → YES: CGST (9%) + SGST (9%) = 18% total
  → NO:  IGST (18%)
  → Can't determine (no GSTIN): show both lines as "CGST + SGST" (default)
```

Creator state comes from `profile.state`. Brand state from GSTIN digits 1-2.
If brand GSTIN starts with same 2 digits as creator's state code → intrastate.

---

## Tax Exemptions

- GST does NOT apply if creator is unregistered (no GSTIN) AND annual turnover < ₹20L
- TDS does NOT apply if total payments from a single brand in FY < ₹50,000
- No TDS option exists: the "No TDS" rate in the dropdown handles this case

---

## Form 16A Reconciliation Context

Form 16A is issued by the brand (deductor), NOT the creator. The creator:
- Cannot issue Form 16A — only receive it
- Needs to match Form 16A amounts against `tds_records` rows by financial year + brand
- The TDS Tax Centre page (`src/pages/TaxCentre/`) shows this reconciliation view

---

## Composability

- **Routes to:** `sb-tds-rules`, `sb-gst-calc`, `sb-gstin-validate`
- These sub-skills have the authoritative calculation rules — never duplicate them here

---

## Feedback Protocol

Update rules governed by `sb-skill-feedback` skill. Summary:
- **Never change:** SAC code table values, supply type formula, invoice number format — these are legal-grade
- **Safe to add:** new SAC codes, new exemption rules, new `## Lessons Learned` entries
- **Breaking changes:** require version bump + user approval + migration note in `## Breaking Change Log`

Current version: 1.0

## Lessons Learned

<!-- Format: - [YYYY-MM-DD] context: <task> — <one sentence lesson>. -->
- [2026-05-20] distillation: promoted from learnings.md session 3 — TDS records should auto-populate when an invoice is marked paid (invoice.status = 'paid' + tds_amount > 0), not via a manual "Log TDS" form; the form is only for pre-StudioBooks historical backfill; deferred creation on payment keeps data consistent and removes user burden.
- [2026-05-20] distillation: promoted from learnings.md session 3 — TDS threshold is ₹50,000 per FY (IT Act 2025 update, effective April 1 2026); Section 194J → Section 392 (10%), Section 194C → Section 393 (1%); never hardcode tax thresholds or section numbers without checking sb-tds-rules first.
- [2026-06-04] distillation: gstack pitfall fy-card-empty-income-table — source FY gross income from paid invoices (`invoiceStore.fyTotal`), not the secondary income log table; the income log may be empty for accounts created before the auto-logging feature shipped.
