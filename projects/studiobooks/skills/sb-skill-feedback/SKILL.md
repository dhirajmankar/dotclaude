---
name: "sb-skill-feedback"
description: "StudioBooks skill update protocol — invoke before proposing any change to an existing sb-* skill. Defines immutable zones (never touch), addable zones (always safe), and the breaking-change protocol (requires user approval + version bump). Also invoked automatically after any skill is used, to decide whether a Lessons Learned entry should be added."
---

# sb-skill-feedback — Skill Update Protocol

## What This Skill Does
Skills that improve without rules break other skills and ship wrong code. This skill is the contract that governs how all `sb-*` skills evolve. Before editing any skill file, read this first.

---

## Zone 1 — Immutable (NEVER change)

These elements are contracts that other skills and code depend on. Changing them silently breaks downstream skills without any error.

| What | Why immutable | Example |
|------|--------------|---------|
| Reporting format strings | `sb-commit` and `sb-session-end` pattern-match on `✅ VERIFY PASSED` | Renaming to `✅ CHECKS PASSED` breaks gate logic |
| Step numbers (`Step 1`, `Step 2`...) | Skills cross-reference steps ("run Step 3 first") | Renumbering breaks those references |
| Frontmatter `name:` field | This is the slash-command identifier | `sb-verify` → `sb-check` breaks all invocations |
| Trigger phrases in `description:` | CLAUDE.md and system prompt match on these exact phrases | Removing "AUTOMATICALLY invoke" breaks auto-fire |
| Stage names in `sb-deal-stages` | They are live database values | Renaming `paid` → `complete` breaks all Supabase queries |
| Formula implementations in `sb-deal-calc` | Code is written against these exact formulas | Changing `tds_applicable ? d.amount * 0.9` breaks earnedThisMonth display |
| TDS threshold values in `sb-tds-rules` | Invoices already sent use these values | Retroactively changing threshold invalidates existing invoices |

**Rule: if the element is referenced by code, another skill, or CLAUDE.md — it is immutable.**

---

## Zone 2 — Addable (always safe)

These changes only grow the skill. Existing behaviour is unaffected.

| What | Rules |
|------|-------|
| New bullet under an existing rule | Never remove the existing bullet; add below it |
| New row in a reference table | Only append; never delete rows |
| New `## Lessons Learned` entry | Append only — never delete entries |
| New step at the END of a sequence | Do not insert in middle; only append |
| New code example | Show BOTH old and new if replacing an example — label them `// Before` and `// After` |
| Clarifying a vague rule | Add a sub-bullet explaining the edge case; do not rewrite the rule |

---

## Zone 3 — Breaking Change Protocol

When a rule MUST change in a way that affects code already written under the old rule:

### Step 1 — Do NOT edit the existing rule text

### Step 2 — Add a `## Breaking Change Log` section at the bottom (before Lessons Learned)

```markdown
## Breaking Change Log

- [2026-05-16] v2.0: TDS threshold changed from ₹30,000 to ₹50,000.
  Reason: Budget 2025 amendment effective April 1, 2025.
  Migration: Update Income.jsx warning threshold and any hardcoded ₹30,000 references.
  Old rule: Preserved in `sb-tds-rules` v1 archived at memory/skill_v1_archive/.
```

### Step 3 — Bump version in frontmatter

Add or update `version:` field:
```yaml
---
name: "sb-tds-rules"
version: "2.0"
description: "..."
---
```

### Step 4 — Get user approval before writing the file

Do NOT make a breaking change unilaterally. Tell the user:
> "This change to `sb-tds-rules` would affect code already using the old rule. I'll add it as a v2.0 breaking change. Approve?"

### Step 5 — Update CLAUDE.md if trigger phrases changed

---

## Post-Invocation Update Decision

After a skill is used in a session, ask: did anything happen that the skill doesn't currently cover?

**Add a Lessons Learned entry if YES to any of these:**
- An edge case was hit that isn't documented
- A code pattern was used that should become canonical
- A rule was ambiguous and required judgment to apply
- A step in the sequence was skipped for a valid reason (document when skipping is acceptable)
- A downstream tool or file changed in a way that affects this skill

**Skip the entry if:**
- The skill worked exactly as documented, no surprises
- The task was too simple to produce generalizable learning

### Lessons Learned Format
```markdown
## Lessons Learned

- [YYYY-MM-DD] context: <short task description> — <one sentence lesson>. Rule added: see [Section Name].
```

Only add. Never remove or edit existing entries.

---

## Skill Audit Trigger

After creating a new skill or adding a new CLAUDE.md trigger row, invoke `sb-skill-audit` to verify the full skill graph is consistent.

---

## Feedback Protocol

This skill is itself governed by Zone 3 (breaking change protocol) for any changes to immutable zone definitions or zone 2 rules.

Current version: 1.0

## Lessons Learned

<!-- Entries added after each invocation where a new edge case, canonical pattern, or rule clarification was discovered. -->
<!-- Format: - [YYYY-MM-DD] context: <task> — <one sentence lesson>. -->
