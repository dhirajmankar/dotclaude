#!/usr/bin/env node
/**
 * Handoff Generator — auto-creates HANDOFF.md at session end,
 * and injects it into SessionStart context so Claude has full continuity.
 *
 * Usage:
 *   node handoff.cjs generate   # Stop/SessionEnd: write HANDOFF.md
 *   node handoff.cjs inject     # SessionStart: print HANDOFF.md to stdout (picked up as context)
 *   node handoff.cjs update-claude  # Update CLAUDE.md "Current Phase" section from git
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '../..');
const HANDOFF_PATH = path.join(PROJECT_ROOT, '.claude', 'HANDOFF.md');
const CLAUDE_MD_PATH = path.join(PROJECT_ROOT, 'CLAUDE.md');

function git(cmd) {
  try {
    return execSync(`git -C "${PROJECT_ROOT}" ${cmd}`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return '';
  }
}

function today() {
  return new Date().toISOString().split('T')[0];
}

// ── generate ────────────────────────────────────────────────────────────────

function generate() {
  const branch = git('rev-parse --abbrev-ref HEAD');
  const recentCommits = git('log --oneline -15');
  const status = git('status --short');
  const lastCommit = git('log -1 --format="%h %s (%ci)"');
  const stash = git('stash list');

  // Read current phase from CLAUDE.md
  let currentPhase = '';
  try {
    const claudeMd = fs.readFileSync(CLAUDE_MD_PATH, 'utf-8');
    const phaseMatch = claudeMd.match(/\*\*Current Phase:\*\*[^\n]*/);
    if (phaseMatch) currentPhase = phaseMatch[0].replace(/\*\*/g, '').trim();
  } catch { /* ok */ }

  // Read any pending tasks from .claude/tasks if exists
  let pendingTasks = '';
  const tasksFile = path.join(PROJECT_ROOT, '.claude', 'TASKS.md');
  if (fs.existsSync(tasksFile)) {
    pendingTasks = fs.readFileSync(tasksFile, 'utf-8').trim();
  }

  const content = `# StudioBooks Session Handoff
> Auto-generated ${today()} — read by Claude at next SessionStart for continuity.

## Current State
- **Branch:** \`${branch}\`
- **Phase:** ${currentPhase || 'See CLAUDE.md'}
- **Last commit:** ${lastCommit}

## Recent Commits (last 15)
\`\`\`
${recentCommits || '(none)'}
\`\`\`

## Uncommitted Changes
\`\`\`
${status || '(working tree clean)'}
\`\`\`
${stash ? `\n## Stashed Work\n\`\`\`\n${stash}\n\`\`\`\n` : ''}
${pendingTasks ? `\n## Pending Tasks\n${pendingTasks}\n` : ''}
## Resume Instructions
At session start, Claude should:
1. Read this file for context on where things were left off
2. Check CLAUDE.md for full project status and pending Tasks list
3. Confirm current branch and any uncommitted changes before starting new work
4. Ask the user what they want to work on if no clear next task is apparent
`;

  fs.mkdirSync(path.dirname(HANDOFF_PATH), { recursive: true });
  fs.writeFileSync(HANDOFF_PATH, content, 'utf-8');
  console.log(`[Handoff] HANDOFF.md updated (branch: ${branch})`);
}

// ── inject ───────────────────────────────────────────────────────────────────

function inject() {
  if (!fs.existsSync(HANDOFF_PATH)) {
    // No handoff yet — print minimal context from git
    const branch = git('rev-parse --abbrev-ref HEAD');
    const lastCommit = git('log -1 --oneline');
    console.log(`[Handoff] No HANDOFF.md yet. Branch: ${branch}, last: ${lastCommit}`);
    return;
  }

  const content = fs.readFileSync(HANDOFF_PATH, 'utf-8');
  // Print so Claude Code injects it into session context via system-reminder
  console.log('=== SESSION HANDOFF (auto-generated, read for context) ===');
  console.log(content);
  console.log('=== END HANDOFF ===');
}

// ── update-claude ─────────────────────────────────────────────────────────────

function updateClaude() {
  // Read CLAUDE.md and update the Current Phase line + completed departments list
  // based on git log. This is a best-effort update — Claude should refine it manually
  // when significant milestones are reached.
  if (!fs.existsSync(CLAUDE_MD_PATH)) return;

  const branch = git('rev-parse --abbrev-ref HEAD');
  const recentCommits = git('log --oneline -20');

  // Write a note about what changed so Claude sees it next session via HANDOFF.md
  // (Actual CLAUDE.md "Current Phase" edits need Claude's judgment — we just flag it)
  const flagPath = path.join(PROJECT_ROOT, '.claude', 'CLAUDE_UPDATE_NEEDED.md');
  fs.writeFileSync(flagPath, `# CLAUDE.md Update Needed\nBranch: ${branch}\nRecent work:\n\`\`\`\n${recentCommits}\n\`\`\`\nPlease update the "Current Phase" section in CLAUDE.md to reflect current progress.\n`, 'utf-8');
  console.log('[Handoff] Flagged CLAUDE.md for update review');
}

// ── main ─────────────────────────────────────────────────────────────────────

const cmd = process.argv[2] || 'inject';

try {
  switch (cmd) {
    case 'generate': generate(); break;
    case 'inject':   inject();   break;
    case 'update-claude': updateClaude(); break;
    default:
      console.log('Usage: handoff.cjs <generate|inject|update-claude>');
  }
} catch (err) {
  // Never crash Claude Code
  try { console.error(`[Handoff] non-critical error: ${err.message}`); } catch (_) {}
}
process.exit(0);
