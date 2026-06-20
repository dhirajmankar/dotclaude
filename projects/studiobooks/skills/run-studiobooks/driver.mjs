#!/usr/bin/env node
/**
 * StudioBooks Playwright driver
 *
 * Usage:
 *   node .claude/skills/run-studiobooks/driver.mjs [--port 5173] [--shots /tmp/studiobooks-shots]
 *
 * Pipe commands to stdin (one per line):
 *   nav /login            → navigate to http://localhost:<port>/login
 *   nav http://...        → navigate to absolute URL
 *   screenshot [name]     → save screenshot, print path
 *   click <selector>      → click element
 *   fill <selector> <txt> → fill input (React-safe)
 *   wait <text>           → wait for text to appear on page (15s timeout)
 *   text                  → print first 400 chars of visible page text
 *   url                   → print current URL
 *   errors                → print browser console errors collected so far
 *   quit                  → close browser and exit 0
 *
 * Screenshots land in --shots dir (default /tmp/studiobooks-shots).
 */

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createInterface } from 'node:readline';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const PORT  = process.argv.includes('--port')  ? process.argv[process.argv.indexOf('--port')  + 1] : '5173';
const SHOTS = process.argv.includes('--shots') ? process.argv[process.argv.indexOf('--shots') + 1] : '/tmp/studiobooks-shots';
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ctx     = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page    = await ctx.newPage();

const consoleErrors = [];
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });

let shotN = 0;

function resolve(url) {
  if (url.startsWith('http')) return url;
  return `http://localhost:${PORT}${url.startsWith('/') ? url : '/' + url}`;
}

async function run(cmd) {
  const parts = cmd.trim().split(/\s+/);
  const verb  = parts[0];
  if (!verb || verb.startsWith('#')) return;

  if (verb === 'nav') {
    const target = resolve(parts[1] ?? '/');
    // Use 'commit' for SPA routes (React Router handles navigation client-side;
    // waitUntil:'networkidle' aborts on hash/pushState navigations)
    await page.goto(target, { waitUntil: 'commit' });
    // wait for React to paint
    await page.waitForLoadState('domcontentloaded');
    console.log(`ok → ${page.url()}`);

  } else if (verb === 'screenshot') {
    const name = parts[1] ?? `shot-${++shotN}-${Date.now()}`;
    const file = join(SHOTS, name.endsWith('.png') ? name : name + '.png');
    await page.screenshot({ path: file });
    console.log(`screenshot → ${file}`);

  } else if (verb === 'click') {
    const sel = parts.slice(1).join(' ');
    await page.click(sel);
    console.log(`clicked ${sel}`);

  } else if (verb === 'fill') {
    // fill <selector> <text ...>
    const sel  = parts[1];
    const text = parts.slice(2).join(' ');
    await page.fill(sel, text);
    console.log(`filled ${sel}`);

  } else if (verb === 'wait') {
    const text = parts.slice(1).join(' ');
    await page.waitForFunction(
      t => document.body.innerText.includes(t),
      text,
      { timeout: 15000 }
    );
    console.log(`found "${text}"`);

  } else if (verb === 'text') {
    const t = await page.evaluate(() => document.body.innerText);
    console.log(t.slice(0, 400));

  } else if (verb === 'url') {
    console.log(page.url());

  } else if (verb === 'errors') {
    console.log(consoleErrors.length ? consoleErrors.join('\n') : 'no errors');

  } else if (verb === 'quit' || verb === 'exit') {
    await browser.close();
    process.exit(0);

  } else {
    console.log(`unknown: ${verb}`);
  }
}

// Process commands sequentially — queue so concurrent lines don't race
let queue = Promise.resolve();
const rl = createInterface({ input: process.stdin });
rl.on('line', line => {
  queue = queue.then(() => run(line).catch(e => console.log(`error: ${e.message}`)));
});
rl.on('close', () => {
  queue.then(async () => { await browser.close(); });
});

console.log(`driver ready — port ${PORT}, shots → ${SHOTS}`);
