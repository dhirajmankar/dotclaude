---
name: "sb-gstin-validate"
description: "StudioBooks GSTIN validation rules — AUTOMATICALLY invoke any time code reads, writes, or validates a GSTIN or PAN field: supplier_gstin, client_gstin, profile gst_number, PAN extraction. Triggers: adding GSTIN input, validating tax fields, Settings profile form, invoice save logic. Encodes format rules, checksum algorithm, DPDP data handling, and fallback behaviour for missing GSTINs."
model: haiku
---

# sb-gstin-validate — GSTIN Validation Rules

## What This Skill Does
Encodes the exact GSTIN validation contract for StudioBooks — format, checksum, PAN extraction, when to reject vs. warn, and DPDP-compliant data handling. One wrong GSTIN on a sent invoice creates GST compliance liability for the creator.

---

## GSTIN Structure

```
Format: [2]StateCode + [5]PAN-letters + [4]PAN-digits + [1]PAN-letter + [1]EntityType + [1]"Z" + [1]Checksum
Length: exactly 15 characters, uppercase
```

**Regex (use this exactly):**
```js
/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
```

Input must be uppercased before testing: `gstin.trim().toUpperCase()`

**Examples:**
- Valid: `27AAPFU0939F1ZV` (Maharashtra, individual, F-type entity)
- Invalid: `27AAPFU` (too short), `27aapfu0939f1zv` (lowercase before trim), `27AAPFU0939F1Z` (14 chars)

---

## PAN Extraction

PAN is positions 2–11 (0-indexed): `gstin.substring(2, 12)` — **only call this after the regex passes**.

Never extract PAN from an unvalidated GSTIN — it will return garbage.

---

## Checksum Validation (mod-36 Luhn variant)

GSTN uses a specific checksum on the 15th character. For the app, regex validation is sufficient for user-input scenarios. Full checksum is required only when programmatically generating GSTINs (which this app never does).

If adding server-side validation later, the algorithm is:
- Assign value 0–9 for digits, 10–35 for A–Z
- Multiply positional values by alternating factors, sum, mod 36
- Map result back to char — must match position 15

---

## Validation States

| State | Condition | Action |
|-------|-----------|--------|
| Valid | passes regex | Store as-is (already uppercased) |
| Missing | empty/null | Allow save-as-draft; block "mark as sent" |
| Too short | `< 15 chars` | Show inline error: "GSTIN must be 15 characters" |
| Wrong format | fails regex | Show: "Invalid GSTIN format — check state code and PAN" |
| Partial (state only) | 2-char string like `"27"` | Use only for supply type detection fallback, never store as GSTIN |

**Never block draft saves** — creators may not have client GSTIN at draft stage.  
**Always block "mark as sent"** if `client_gstin` is non-empty but fails validation.

---

## Fallback When Client Has No GSTIN

1. Use creator's `profile.home_state_code` (e.g., `"27"`) for supply type detection only
2. Place of supply = creator's home state
3. `supply_type` = `'intra'` (safe default — if wrong, creator can override)
4. Never store `"27"` as a GSTIN — store `null`

---

## DPDP Act 2025 — Personal Data Rules

GSTIN and PAN are **personal data** under the Digital Personal Data Protection Rules 2025 (Phase 1 active: November 13, 2025).

**Rules for handling GSTIN/PAN in code:**
- Lawful basis: invoice generation — sufficient, no separate consent needed
- Do NOT include GSTIN/PAN in: error logs, analytics events, console.log, toast messages
- Do NOT display full PAN outside of invoice PDF context
- On invoice: mask PAN in UI if showing client details outside of PDF view (show `XXXXX1234A`)
- On account deletion: delete all invoices containing GSTIN/PAN per the 90-day retention policy
- Encryption: bank details are AES-GCM 256 encrypted (Security S1 ✅); GSTIN/PAN on invoices are stored plaintext in Supabase with RLS — acceptable for now, flag for Phase 3 review

---

## Composability

- **Leaf skill** — does not call other skills
- **Called by:** `sb-invoice-tax` (Step 2 of invoice tax chain)
- **Standalone use:** invoke when adding any GSTIN input field, validation logic, or PAN-reading code

---

## Feedback Protocol

Update rules governed by `sb-skill-feedback` skill. Summary:
- **Never change:** the GSTIN regex pattern, PAN extraction `substring(2, 12)`, or DPDP logging rules — these are compliance contracts
- **Safe to add:** new validation state rows, new DPDP rule examples, new `## Lessons Learned` entries
- **Breaking changes:** require version bump + user approval + migration note

Current version: 1.0

## Lessons Learned

<!-- Entries added after each invocation where a new edge case, canonical pattern, or rule clarification was discovered. -->
<!-- Format: - [YYYY-MM-DD] context: <task> — <one sentence lesson>. -->
