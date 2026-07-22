---
name: sb-patterns
description: StudioBooks coding patterns extracted from git history — commit conventions, file workflows, architecture naming, test rules, doc gates. Use before writing any code, commit, or test in this repo.
version: 1.0.0
source: local-git-analysis
analyzed_commits: 200
---

# StudioBooks Patterns

Extracted from 200 commits. These are the actual habits of this codebase — follow them exactly.

## Commit Conventions

### Format
```
type(scope): short description — optional detail
```

- Em-dash `—` separates description from detail
- Scope = page/component name in camelCase: `(deals)`, `(dashboard)`, `(invoices)`, `(billing)`, `(settings)`, `(toast)`, `(layout)`, `(brand)`, `(tests)`, `(test)`, `(a11y)`, `(motion)`, `(hooks)`, `(csp)`, `(ux)`, `(header)`
- Multi-fix on one commit: separate with `; ` → `fix(toast): message; fix(invoices): message`
- Test count on large batches: append `(N tests)` → `fix: description (1291 tests)`

### Types
| Type | Use |
|------|-----|
| `feat` | New feature or component |
| `fix` | Bug fix |
| `fix(test)` | Test-only correction |
| `refactor` | Code reorganization, no behavior change |
| `chore` | Config, docs housekeeping, package updates |
| `docs` | Documentation only |
| `release` | Version bump + changelog |
| `redesign` | Full UI overhaul of a page |
| `revert` | Undo a prior commit |

### Release format
```
release: v0.X.Y — Feature Name
```
Always pairs with: `docs/Changelog.md` + `package.json` version bump + `TODOS.md` update.

### Session doc commits
```
chore: update session docs — [topic description]
```
Files: `docs/CONTEXT.md` + `learnings.md` + `CLAUDE.md`.

## File Structure & Naming

### Pages
```
src/pages/PageName/PageName.jsx            # main page file
src/pages/PageName/components/SubComp.jsx  # sub-components
tests/pages/PageName/PageName.test.jsx     # primary test
tests/pages/PageName/PageName.polish.test.jsx  # visual/UX tests
tests/pages/PageName/SubComp.test.jsx      # sub-component tests
```

### Hooks
```
src/hooks/useXWorkflow.js
src/hooks/useXWorkflow.update.test.js
tests/hooks/useXWorkflow.test.jsx
```

### Stores
```
src/store/xStore.js
tests/store/xStore.test.js
```

### Repositories
```
src/lib/repositories/xRepository.js
tests/lib/repositories/xRepository.test.js
```

### Services
```
src/services/x.js
tests/services/x.test.js
```

### Naming rules
- Components: `PascalCase.jsx` — `BrandLogo.jsx`, `CheckoutModal.jsx`
- Hooks: `useCamelCase.js` — `useInvoiceWorkflow.js`, `useIsMobile.js`
- Stores: `camelCaseStore.js` — `invoiceStore.js`, `billingStore.js`
- Repositories: `camelCaseRepository.js` — `invoiceRepository.js`
- Services: `camelCase.js` — `razorpay.js`

## File Co-Change Workflows

### Adding a feature to a page
1. `src/pages/X/X.jsx` — page logic
2. `src/pages/X/components/NewComp.jsx` — new sub-component (if needed)
3. `tests/pages/X/X.test.jsx` — update tests
4. `tests/pages/X/NewComp.test.jsx` — new component tests

### Adding a hook
1. `src/hooks/useXWorkflow.js`
2. `tests/hooks/useXWorkflow.test.jsx`

### Adding a store action
1. `src/store/xStore.js`
2. `tests/store/xStore.test.js`
3. `docs/STORES.md` (G-store gate)

### Session end (always together)
1. `docs/CONTEXT.md` — key-value session block
2. `learnings.md` — dated discoveries
3. `CLAUDE.md` — Current Phase line only (if sprint shipped)

### Razorpay / payment changes
Always touches: `src/services/razorpay.js` + `src/store/billingStore.js` + `tests/services/razorpay.test.js` + `tests/store/billingStore.test.js`

### Brand/logo changes
Propagates to: `src/components/layout/AppLayout.jsx` + `Sidebar.jsx` + `BrandLogo.jsx` + `BrandLogoFull.jsx` + all auth pages

## Testing Patterns

### Mandatory first-line annotation (ADR-004)
```js
// @vitest-environment node    // stores, utils, services, pure JS
// @vitest-environment jsdom   // components, pages, hooks with render/renderHook
```
Missing = review fail.

### File location
- All tests in `tests/` mirroring `src/`
- Never in `src/`
- `src/test/` = infrastructure only (`setup.js`, `utils.js`)

### Async render rule
Never `render(<X />)` bare on components with async `useEffect`. Use:
```js
await waitFor(() => { ... })
// or
await act(async () => { render(<X />) })
```

### Axe rule
Max 1 axe call per file, on primary render only.

### Test count convention
After a large fix batch, append count in commit message: `(1291 tests)`.

## Documentation Gates

Write at the right moment to the right file. Never ad hoc.

| Gate | When | File |
|------|------|------|
| G-phase | Sprint ships | `CLAUDE.md` Current Phase line + `docs/CONTEXT.md` |
| G-task-done | Task in multi-step plan completes | `docs/PendingWork.md` — `✅ Task N — one line` |
| G-learning | Non-obvious discovery | `learnings.md` — `[date] context: task — lesson` |
| G-context | Session end | `docs/CONTEXT.md` — key-value block |
| G-decision | Architecture choice | `docs/DECISIONS.md` — ADR format |
| G-store | Store shape/action changed | `docs/STORES.md` |

**CLAUDE.md write guard:** receives only Current Phase updates and new skill trigger rows.

## Architecture Laws (Hard — Never Break)

1. **Zustand selectors scalar only:** `useStore(s => s.field)` — object selectors = infinite loops in React 19
2. **Supabase in repositories only:** `src/lib/repositories/` — never from stores, hooks, pages, or components
3. **No repositories in pages/components:** use a workflow hook from `src/hooks/`
4. **Currency:** `formatINR()` from `src/utils/` — never raw `toLocaleString()`
5. **Invoice PDF:** `downloadInvoicePDF(element, filename)` — never `window.print()` for downloads
6. **Cross-store chains:** no `.getState()` on another store inside an action — use workflow hooks

## Sprint Workflow Signals

From commit history, new sprints follow this pattern:
1. `docs(plans)` commit — spec written
2. `feat(X)` batch commits — implementation
3. `fix(test)` + `fix(lint)` cleanup commits
4. `chore: update session docs` commit
5. Merge PR to integration
6. `release: vX.Y.Z` when shipping to master
