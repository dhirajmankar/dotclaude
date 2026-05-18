---
name: sb-graph-navigate
description: Graph-first file discovery for StudioBooks. Given a symbol or feature area, uses graphify BFS traversal on the pre-built knowledge graph to return exactly which files to read — 85% cheaper than Glob→Grep→Read. Falls back to smart-explore when graph gives no results.
---

# sb-graph-navigate

Graph-first code navigation. Before exploring any code, query the knowledge graph to get the exact minimal file list in one CLI call.

**When to use:** Any time you're about to open files to understand or modify a named symbol, store, component, or feature. Run this BEFORE smart-explore, Grep, Glob, or Read.

**When NOT to use:** Open-ended "how does the whole auth flow work" architecture questions — use pathfinder or smart-explore for those.

## Step 1: Query the graph

Run this command, substituting your symbol or feature:

```
graphify query "<symbol_or_feature>" --budget 1000
```

Examples:
```
graphify query "invoiceStore" --budget 1000
graphify query "DealForm" --budget 1000
graphify query "TDS calculation" --budget 1000
graphify query "billingStore subscription" --budget 1000
```

## Step 2: Parse the output

The output contains NODE lines with source file paths:

```
NODE invoiceStore.js [src=src/store/invoiceStore.js loc=L1 community=4]
NODE useInvoiceStore [src=src/store/invoiceStore.js loc=L6 community=4]
NODE Invoices() [src=src/pages/Invoices/Invoices.jsx loc=L18 community=4]
NODE InvoiceRegister() [src=src/pages/Invoices/InvoiceRegister.jsx loc=L40 community=4]
```

Extract unique `src=` values from every NODE line. Rank by hit frequency (files appearing in more NODE lines come first — they're the core files for this feature).

**Example parsed result for "invoiceStore":**
```
1. src/store/invoiceStore.js        (2 nodes → core)
2. src/pages/Invoices/Invoices.jsx  (1 node)
3. src/pages/Invoices/InvoiceRegister.jsx (1 node)
```

## Step 3: Read only those files

Read the ranked list top-down. Stop when you have enough to make your change — usually the first 1-2 files. Do not speculatively open more.

If the target is a test-only node (e.g. `invoiceStore.test.js` appears as start node), include the test file only if you're debugging a test failure.

## Fallback

Use smart-explore instead if any of these are true:
- `graphify query` returns 0 nodes
- `graphify-out/graph.json` doesn't exist yet (run `/graphify . --mode deep` to build it)
- The query is an open-ended concept with no named symbol ("how does navigation work", "where is state managed")
- The graph has 254+ isolated nodes (check: INFERRED edges should outnumber EXTRACTED edges; if only EXTRACTED edges appear, the graph is AST-only and likely stale — re-run `/graphify . --mode deep`)

## Token economics

| Approach | Tokens | Use Case |
|----------|--------|----------|
| sb-graph-navigate (this skill) | ~500 | Named symbol → exact files |
| smart-explore smart_search | ~3,000–6,000 | Symbol discovery across codebase |
| Glob → Grep → Read | ~15,000–40,000 | Old default pattern |

**Savings: 85–95% vs default exploration for named symbols.**

## Graph health check

A healthy graph has INFERRED edges (semantic, LLM-generated):
```
EDGE useInvoiceStore --calls [INFERRED context=call]--> Invoices()
```

If you only see EXTRACTED edges, the graph is AST-only (Zustand selectors not resolved). Re-run:
```
graphify . --mode deep
```
This costs ~200–250k tokens one-time but makes the graph accurate for Zustand-heavy code.
