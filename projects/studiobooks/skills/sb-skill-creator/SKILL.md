---
name: "sb-skill-creator"
description: "StudioBooks skill lifecycle manager — AUTOMATICALLY invoke when creating any new skill for this project. Runs gap analysis and impact assessment first, then delegates to the skill-creator plugin for drafting, testing, and iterative improvement, then wires the finished skill into dotclaude + CLAUDE.md. Never create a StudioBooks skill without running this — it prevents duplicate skills, low-impact skills, and skills that don't get wired into the auto-invocation chain."
auto-invokes:
  - skill-creator   # plugin — handles drafting, test cases, eval loop, description optimisation
  - sb-skill-audit  # verify the new skill doesn't duplicate existing ones
  - sb-commit       # commit the finished skill to dotclaude
---

# sb-skill-creator — StudioBooks Skill Lifecycle Manager

Three stages before you write a single line of skill content:
**Analyse → Build (via skill-creator) → Wire**

---

## Stage 1 — Gap Analysis

Before writing anything, answer these questions. Low-quality skills eat context budget on every session — don't skip this.

**1. Does it already exist?**

```powershell
# Project skills
Get-ChildItem "C:\Users\Work\StudioBooks\.claude\skills\" -Directory | Select-Object Name
# Global skills
Get-ChildItem "C:\Users\Work\.claude\skills\" -Directory | Select-Object Name
```

Then query the skills graph:
```bash
graphify query "<skill topic>" --budget 500
```

If a close match exists → propose extending it via `sb-skill-feedback` instead.

**2. What exact problem does it solve?**
- What decision does Claude currently get wrong without this skill?
- Is it domain knowledge (facts/rules) or a workflow (sequence of steps)?
- Can you name a specific session where this skill would have prevented a mistake?

**3. Project-specific or global?**

| Condition | Location |
|-----------|----------|
| StudioBooks domain: GST, deal stages, Zustand patterns, invoice rules | `dotclaude/projects/studiobooks/skills/` |
| Useful across all projects: animations, security, design | Use the existing global skill — don't duplicate |
| Needs a new global skill | Discuss with user first; place in `dotclaude/skills/` |

---

## Stage 2 — Impact Assessment

Rate the skill before building it. Only proceed if **at least 2** of these are true:

| Dimension | Question |
|-----------|----------|
| **Trigger frequency** | Fires at least once per typical work session? |
| **Error prevention** | Prevents a class of bugs or wrong decisions (not just one-off)? |
| **Token savings** | Replaces a Grep/Read sweep? Saves >2,000 tokens per invocation? |
| **Dependency value** | Becomes a sub-skill that unlocks other skills (e.g. feeds sb-orchestrate Phase 0.5)? |
| **Knowledge decay** | Content stays valid for >3 months without manual updates? |

If it doesn't pass: log the idea in `learnings.md` and stop.

---

## Stage 3 — Design the Dependency Map

Before delegating to `skill-creator`, declare the full dependency chain. This is what gets written into frontmatter and CLAUDE.md.

```
<new-skill>
  invokes ──► <sub-skill-1>   when: <condition>
  invokes ──► <sub-skill-2>   when: <condition>
  triggers from ──► sb-orchestrate Phase 0.5  (if domain skill)
  triggers from ──► CLAUDE.md trigger table   (always)
```

Also write the exact CLAUDE.md row you'll add:
```
| <trigger phrase or condition> | `<skill-name>` — <one-line why> |
```

And the sb-orchestrate Phase 0.5 row (if this is a domain skill):
```
| <domain signal> | `Skill({ skill: "<name>" })` | <why> |
```

---

## Stage 4 — Build with skill-creator

Now invoke the `skill-creator` plugin. It handles the full build loop:

```
Skill({ skill: "skill-creator" })
```

It will:
1. Interview you about the skill's purpose, edge cases, and output format
2. Write a draft `SKILL.md`
3. Generate 2–3 realistic test prompts and run them
4. Show you an eval viewer with quantitative benchmarks + qualitative outputs
5. Iterate based on your feedback until you're satisfied
6. Optimise the `description` field for triggering accuracy

**StudioBooks-specific context to give skill-creator during its interview:**

- The skill lives at: `dotclaude/projects/studiobooks/skills/<name>/SKILL.md`
- After it's done, it must be synced to `.claude/skills/` via sync.ps1
- The `description` must include "AUTOMATICALLY invoke when..." if it should auto-fire
- The `auto-invokes` frontmatter must list every skill this one calls
- Use three-tier structure: Quick rules (≤20 lines) → Decision tables → Reference

---

## Stage 5 — Wire into the Project

Once `skill-creator` produces a finished skill, do these steps in order:

### 5a. Place in dotclaude

If `skill-creator` wrote the file somewhere else, move/copy to:
```
C:\Users\Work\dotclaude\projects\studiobooks\skills\<name>\SKILL.md
```

### 5b. Add `auto-invokes` frontmatter

Ensure the finished skill's frontmatter declares all downstream skills:
```yaml
---
name: "<skill-name>"
description: "... AUTOMATICALLY invoke when <trigger>..."
auto-invokes:
  - <sub-skill>   # reason
---
```

### 5c. Add trigger row to CLAUDE.md

Add to the **Auto-invoked skills** table in `StudioBooks/CLAUDE.md`:
```markdown
| <trigger condition> | `<skill-name>` — <one-line why> |
```

### 5d. Update skill dependency map in CLAUDE.md

If this skill has `auto-invokes`, update the dependency map section:
```markdown
<skill-name> ──► <sub-skill-1> | <sub-skill-2>
```

### 5e. Add to sb-orchestrate Phase 0.5 (if domain skill)

If the new skill handles a domain that should fire before any implementation, add a row to Phase 0.5 in `dotclaude/projects/studiobooks/skills/sb-orchestrate/SKILL.md`:
```markdown
| <domain signal> | `Skill({ skill: "<name>" })` | <why> |
```

### 5f. Update dotclaude README

Add to the StudioBooks skills table in `dotclaude/README.md`:
```markdown
| `<skill-name>` | <one-line description> |
```

### 5g. Sync and verify

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Work\StudioBooks\.claude\sync.ps1"
Get-ChildItem "C:\Users\Work\StudioBooks\.claude\skills\<name>"
```

### 5h. Commit

Invoke `sb-commit` with type `feat`:
```
feat(skills): add <skill-name> — <one-line description>
```
Stage only: the new `SKILL.md` + updated `CLAUDE.md` + updated `dotclaude/README.md`.

---

## Completion Checklist

- [ ] Gap confirmed — no duplicate found in project or global skills
- [ ] Impact passes threshold — at least 2 of 5 dimensions met
- [ ] Dependency map written before building
- [ ] `skill-creator` ran the full eval loop (draft → test → iterate)
- [ ] Description optimised by `skill-creator`'s optimisation step
- [ ] Frontmatter has `name`, `description` with "AUTOMATICALLY", `auto-invokes`
- [ ] CLAUDE.md trigger row added
- [ ] Skill dependency map updated (if has `auto-invokes`)
- [ ] sb-orchestrate Phase 0.5 updated (if domain skill)
- [ ] dotclaude README updated
- [ ] Synced and verified in `.claude/skills/`
- [ ] Committed to dotclaude via sb-commit

---

## Anti-patterns

| Don't | Do instead |
|-------|-----------|
| Use `skill-builder` (generic template only) | Use `sb-skill-creator` → wraps `skill-creator` with full eval loop |
| Skip the eval loop and just write SKILL.md | Always run `skill-creator` — it tests and iterates |
| Create directly in `.claude/skills/` | Start in `dotclaude/projects/studiobooks/skills/` |
| Skip `auto-invokes` frontmatter | Fill it in — it's how the graph tracks dependencies |
| Build a skill that fires once a month | Log it in `learnings.md` instead |
