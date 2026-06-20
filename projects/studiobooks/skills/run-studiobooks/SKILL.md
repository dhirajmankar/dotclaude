---
name: run-studiobooks
description: Build, run, and drive StudioBooks. Use when asked to start StudioBooks, screenshot its UI, run its dev server, take a screenshot of a page, interact with the running app, or run its test suite.
---

StudioBooks is a React 19 + Vite PWA (creator CRM). Drive it via `.claude/skills/run-studiobooks/driver.mjs` — a Playwright stdin-REPL that starts a headless Chromium, navigates to the Vite dev server, and accepts one-per-line commands.

All paths below are relative to `StudioBooks/`.

## Prerequisites

No extra `apt-get` packages needed. Node 22 and Playwright's Chromium are already in the container:

```bash
node --version   # v22.x
# Playwright is at /opt/node22/lib/node_modules/playwright/
```

## Setup

```bash
npm install
```

Create a stub `.env` if one doesn't exist (required to silence Vite config errors; Supabase auth won't work with stubs, but all UI pages render):

```bash
cat > .env <<'EOF'
VITE_SUPABASE_URL=https://placeholder.supabase.co
VITE_SUPABASE_ANON_KEY=placeholder-anon-key
VITE_RAZORPAY_KEY_ID=rzp_test_placeholder
EOF
```

For real data (auth, deals, invoices), fill in actual Supabase credentials from the project dashboard. The app renders and is fully driveable without them.

## Run (agent path)

Start the dev server in the background, wait for it to be ready, then pipe commands to the driver:

```bash
# Start dev server
npm run dev -- --port 5173 &>/tmp/studiobooks-dev.log &
echo $! > /tmp/studiobooks-dev.pid

# Wait for it (polls; fails loudly after 30s instead of sleeping blindly)
timeout 30 bash -c 'until curl -sf http://localhost:5173 >/dev/null; do sleep 1; done' && echo "ready"

# Drive it
node .claude/skills/run-studiobooks/driver.mjs <<'EOF'
nav /
wait Bill brands
screenshot landing
nav /login
screenshot login
errors
quit
EOF
```

Screenshots land in `/tmp/studiobooks-shots/`.

Stop the server when done:

```bash
kill $(cat /tmp/studiobooks-dev.pid) 2>/dev/null; rm /tmp/studiobooks-dev.pid
```

### Driver command reference

| command | what it does |
|---|---|
| `nav /path` or `nav http://...` | Navigate to route (SPA-safe) |
| `screenshot [name]` | Save PNG, print path. Default name: timestamped. |
| `click <selector>` | Click element by CSS/text selector |
| `fill <selector> <text>` | Fill input (React-safe; dispatches proper input events) |
| `wait <text>` | Wait up to 15s for text to appear on page |
| `text` | Print first 400 chars of visible page text |
| `url` | Print current URL |
| `errors` | Print browser console errors collected since session start |
| `quit` | Close browser and exit 0 |

Commands run sequentially — the next command only runs after the current one resolves. Pass `--port` and `--shots` flags to change defaults.

### Known routes

| Path | Page |
|---|---|
| `/` | Landing/marketing page |
| `/login` | Sign in |
| `/signup` | Create account |
| `/deals` | Brand deal pipeline (auth required) |
| `/invoices` | Invoice management (auth required) |
| `/income` | Income tracker (auth required) |
| `/tax` | TDS/GST tracker (auth required) |
| `/analytics` | Analytics (auth required) |
| `/settings` | User settings (auth required) |

Auth-required routes redirect to `/login` without a Supabase session.

## Run (human path)

```bash
npm run dev   # → http://localhost:5173. Ctrl-C to stop.
```

## Test

```bash
npm test
```

1291 tests across 112 files. Runs in ~50s with `maxWorkers: 8` (configured in `vite.config.js`). All pass against stub `.env`.

**Never run two test processes in parallel** — concurrent forks double RAM and cause GC death spirals (see `vite.config.js` comment on `maxWorkers`).

## Gotchas

- **SPA navigation `ERR_ABORTED`** — using `waitUntil: 'networkidle'` with React Router causes abort errors because Vite's SPA serving responds before React paints. The driver uses `waitUntil: 'commit'` + `waitForLoadState('domcontentloaded')` to avoid this.

- **`errors` reports cert failures with stub `.env`** — `ERR_CERT_AUTHORITY_INVALID` lines appear because Supabase client tries to connect to `placeholder.supabase.co` (invalid cert). These are expected and harmless when running with stub credentials. Ignore them; they don't affect UI rendering.

- **React controlled inputs** — `fill` goes through Playwright's input pipeline and fires React's `onChange`. Do not use `page.evaluate(() => el.value = '...')` — it bypasses React's synthetic event system and leaves the form in an inconsistent state.

- **Vite first-route compile delay** — the first `nav` after starting the dev server can take 5–10s while Vite bundles on demand. `wait <text>` handles this automatically; a bare `sleep` won't.

- **Auth-gated pages** — without real Supabase credentials, any route under `RootRoute` (deals, invoices, income, etc.) redirects to `/login`. To screenshot those pages you need a real `.env` and a valid session (no bypass available without code changes).

## Troubleshooting

- **`EADDRINUSE :5173`**: another dev server is running. `kill $(cat /tmp/studiobooks-dev.pid)` or `pkill -f 'vite.*5173'`.
- **`error: Target page, context or browser has been closed`**: commands ran concurrently and one closed the browser before others completed. The driver serialises via a queue; this only happens if you launch multiple driver processes simultaneously.
- **Blank screenshot / no visible text**: dev server not ready yet. Add `timeout 30 bash -c 'until curl -sf http://localhost:5173 >/dev/null; do sleep 1; done'` before launching the driver.
