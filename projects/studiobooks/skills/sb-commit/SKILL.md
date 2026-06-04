---
name: "sb-commit"
description: "StudioBooks smart commit — ALWAYS use this instead of running git commit directly in this project. Never run git commit manually. Triggers: whenever about to commit, after a task is done, after a bug fix, after any code change that should be saved. Runs sb-verify first, then stages and commits with correct Co-Authored-By footer. Takes a type and message."
model: haiku
---

# sb-commit — Smart Commit

## What This Skill Does
Runs the verification gate, stages the right files, and creates a correctly formatted commit. Prevents dirty commits and ensures the Co-Authored-By footer is never forgotten.

---

## Step 1 — Invoke sb-verify first

**Invoke the `sb-verify` skill using the Skill tool before touching git.**  
If sb-verify reports `❌ VERIFY FAILED`: stop. Invoke `investigate` then `superpowers:systematic-debugging` to diagnose root cause. Never inline-patch the failing line — the symptom is rarely the cause. After fix, re-run sb-verify. Do not stage or commit until verify passes.

---

## Step 2 — Determine what to stage

Ask or infer from context:
- List the files changed for this task (not all dirty files)
- Stage only those files — never use `git add -A` blindly
- Verify staged set with `git diff --cached --stat`

If there are unrelated dirty files, leave them unstaged.

---

## Step 3 — Build the commit message

Format:
```
<type>(<scope>): <message>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

**Types:**
| Type | When |
|------|------|
| `feat` | New feature or component |
| `fix` | Bug fix |
| `chore` | Docs, config, tooling |
| `refactor` | Restructure without behavior change |
| `test` | Tests only |
| `style` | Visual/design changes |

**Scope** (optional, use when helpful):
`deals`, `invoices`, `dashboard`, `auth`, `store`, `design`, `infra`

**Message rules:**
- Lowercase after the colon
- Imperative mood ("add", "fix", "remove" — not "added", "fixes")
- Max 72 chars for the first line
- No period at end

**Examples:**
```
feat(invoices): add template B with CGST/SGST breakdown
fix(auth): catch race condition on signup session init
chore: update CLAUDE.md current phase + session docs
style(deals): replace stale text-gray tokens with outline
test(invoices): add GST calculation edge cases
```

---

## Step 4 — Run the commit

Use HEREDOC format every time:

```bash
git commit -m "$(cat <<'EOF'
<type>(<scope>): <message>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Step 5 — Verify commit landed

```bash
git log --oneline -1
```

Report the commit hash and subject line.

---

## Composability

- **Depends on:** `sb-verify` (invoked at Step 1)
- **Called by:** `sb-session-end` (for docs commits)
- Can be invoked standalone: `/sb-commit feat(deals): add drag-drop kanban`

---

## Feedback Protocol

Update rules governed by `sb-skill-feedback` skill. Summary:
- **Never change:** HEREDOC format, Co-Authored-By line, commit type table
- **Safe to add:** new commit type rows, new scope examples, new `## Lessons Learned` entries
- **Breaking changes:** require version bump + user approval + migration note

Current version: 1.0

## Lessons Learned

<!-- Entries added after each invocation where a new edge case, canonical pattern, or rule clarification was discovered. -->
<!-- Format: - [YYYY-MM-DD] context: <task> — <one sentence lesson>. -->
- [2026-05-20] skill gap audit: sb-orchestrate review — failure paths that say "stop, fix" without routing to debugging skills cause ad-hoc inline patching; explicit `investigate` + `systematic-debugging` routing added.
