---
name: ui-ux-mindset
description: "AUTOMATICALLY invoke when working on any UI layout, visual styling, color decisions, component animations, dashboard design, or frontend implementation touching .jsx/.tsx/.css. Enforces Kole Jain's strategic 4-question pre-design framework, content-first edge-case design, 60-30-10 color rule with exact hex values, 5 vibe-coding anti-patterns, and provides all 11 ready-to-paste micro-animation CSS recipes."
metadata:
  author: KoleJain-DeepSynthesis
  version: "2.0.0"
  source: docs/UI_UX_MINDSET_GUIDE.md
---

# UI/UX Mindset & Execution Skill (Kole Jain) v2.0

> "Think of web design not as art, but as a story." — Kole Jain

---

## Tier 1 — Quick Rules

Answer these **4 questions before writing any JSX/CSS/Tailwind**:

1. **Business Goal:** What is the owner trying to maximize? (e.g., capture leads, increase paid signups, reduce support tickets)
2. **User Goal:** What core action does the user need to complete? (e.g., find pricing, compare plans, export data)
3. **Friction:** What questions/confusions will the user face? What UI element resolves each? (e.g., contrast backings on icons, helper tooltips for jargon)
4. **Emotion/Tone:** How should the user feel? (professional+secure for finance, excited+creative for design tools, calm+focused for writing)

**Intersecting Goal Rule:** Business Goal ∩ User Goal = highest visual weight on the page. Place above the fold, dominant color, primary CTA styling.

**Color Quick Rules (never deviate):**
- Never pure `#FFFFFF` or `#000000` — eye strain. Light canvas: `#F8F9FA`. Dark canvas: `#0F0F11`.
- 60% canvas / 30% cards+panels+borders / 10% accent (CTAs + active states only).
- Dark mode elevation = luminescence: cards must be *lighter* than the canvas background.
- Semantic colors are reserved: Red = destructive only. Yellow/Orange = warning only. Green = success only.

**Vibe-coding Quick Fixes:**
- Emojis in UI → swap for Lucide/Phosphor/Radix SVG icons
- Infinite scroll → "Load More" button (lets users reach the footer)
- Sparse flyout/popover → modal dialog with accordion for advanced options
- Action buttons per list row → triple-dot menu popover
- Letter-avatar gradient circles → account card + settings popover

---

## Tier 2 — Decision Tables

### Anti-pattern → Correct Pattern

| Vibe-coding pattern | Correct pattern |
|---|---|
| Emojis (🚀🔒📈) in sidebar/buttons/badges | SVG icons: Lucide, Phosphor, or Radix |
| Repeating KPI grid across multiple pages | Doughnut charts; left-aligned account card; settings collapsed to popover |
| Action buttons visible on every list row | Triple-dot `•••` menu → popover actions |
| Status text chips cluttering tables | Colored dot indicators (8px circle, semantic color) |
| Sparse flyout/popover for forms | Modal dialog; accordion hides advanced options by default |
| Pure white background `#FFFFFF` | Off-white: `#F8F9FA` or `#FAF9F6` |
| Pure black text `#000000` | Dark slate `#1A1A1A` for body; `#64748B` for secondary labels |
| Infinite scroll | "Load More" button — users must be able to reach the footer |
| Brand color for destructive actions (Delete) | Red — semantic destructive, never brand color |
| Inverted colors for dark mode | Dark canvas + semi-transparent white overlays: `rgba(255,255,255,0.05)` |
| Beautiful stock image placeholders | Design with the actual data the app will show (tables, real content) |
| Icon directly on user-uploaded image | Semi-transparent circular backing behind icon to guarantee contrast |

### Micro-animation Selector

| Use case | Recipe # | Key technique |
|---|---|---|
| Primary CTA / submit button | #1 Button Hover/Press | Masked text slide + `scale(0.95)` on `:active` |
| Keyboard shortcut display component | #2 Keyboard Shortcuts | `translateY(2px)` + `border-bottom` shrink on press |
| Success / error / info feedback | #3 Toast Notification | Spring pop: `translateY(30px)→0` + `scale(0.95)→1` |
| User avatar / team member card | #4 Name Tag Hover | Spring: `cubic-bezier(0.25, 1.4, 0.5, 1)` — stiffness 636, dampening 24 |
| Premium / featured / highlighted card | #5 Shimmer Stroke | Conic-gradient rotation with pause/play toggle control |
| Help icon / info button tooltip | #6 Delayed Tooltip | **1000ms** enter delay; **0ms** exit — prevents flicker |
| Inline content / metadata reveal | #7 Text Pop-out | `max-width: 0 → 160px` with `overflow: hidden` |
| Upload progress / loading bar | #8 Progress Bar | Linear mask + shimmer overlay animation |
| Tips / onboarding / hint cards | #9 Card Swipe Stack | `rotate(12deg) translateX(110%)` swipe-away |
| Global / page search bar | #10 Search Morph | `width: 42px → 260px` on `:focus` + icon `scale(0.85)` |
| Pricing plan feature comparison | #11 Upgrade Slider | `translateY(-24px)` swap on `:hover` |

### Color System Reference

| Role | Light Mode | Dark Mode |
|---|---|---|
| 60% Canvas | `#F8F9FA` or `#FAF9F6` | `#0F0F11` or `#0A0A0C` |
| 30% Cards/panels | `#F1F5F9` + `1px solid #E2E8F0` | `rgba(255,255,255,0.05)` over dark base |
| 10% Accent (CTAs) | Brand color | Brand color (desaturated slightly) |
| Body text | `#1A1A1A` | `#F8FAFC` |
| Secondary labels | `#64748B` | `#94A3B8` |
| Hover state | Slightly lighter/brighter | Slightly lighter/brighter |
| Active/press state | Slightly darker | Slightly darker |
| Disabled | Grayscale / desaturated | Grayscale / desaturated |
| Destructive | `#EF4444` (Red) | `#EF4444` (Red) |
| Warning | `#F59E0B` (Amber) | `#F59E0B` (Amber) |
| Success | `#10B981` (Emerald) | `#10B981` (Emerald) |

### Progressive Disclosure Checklist

| Element | Pattern |
|---|---|
| Navigation (grows over time) | Collapsible hamburger/mobile menu with animated entrance |
| Search bar | Collapsed to icon; expands smoothly on click/focus (#10 Search Morph) |
| Long lists / feeds | "Load More" button — never infinite scroll |
| Settings / billing / account links | Collapsed into a click-triggered popover menu in sidebar |
| Advanced form options | Accordion, collapsed by default |

---

## Tier 3 — CSS Recipe Reference

All 11 micro-animation recipes. Ready to paste, adapt to Tailwind or CSS Modules as needed.

---

### Recipe #1 — Button Hover/Press (Masked Text Slide + Active Scale)

On hover, primary text slides out and secondary label slides in. On click, button scales down.

```css
.btn-micro {
  padding: 12px 24px;
  background: #0f172a;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  overflow: hidden;
  position: relative;
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s ease;
}

.btn-text-wrapper {
  display: flex;
  flex-direction: column;
  height: 20px;
  overflow: hidden;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.btn-text-primary,
.btn-text-secondary {
  height: 20px;
  line-height: 20px;
  display: block;
}

.btn-text-secondary { color: #38bdf8; }

.btn-micro:hover .btn-text-wrapper { transform: translateY(-20px); }
.btn-micro:active { transform: scale(0.95); }
```

```html
<button class="btn-micro">
  <span class="btn-text-wrapper">
    <span class="btn-text-primary">Get Started</span>
    <span class="btn-text-secondary">Let's Go!</span>
  </span>
</button>
```

---

### Recipe #2 — Keyboard Shortcuts (Physical Key Press Simulation)

Visual `<kbd>` elements that react to actual keypresses with a press-in animation.

```css
.kbd-key {
  padding: 6px 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 600;
  font-size: 0.85rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-bottom: 3px solid #cbd5e1;
  border-radius: 6px;
  color: #1e293b;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  transition: transform 0.05s ease, border-bottom-width 0.05s ease;
  user-select: none;
}

.kbd-key.kbd-active {
  border-bottom-width: 1px;
  transform: translateY(2px);
  background: #f1f5f9;
}
```

```js
document.addEventListener('keydown', (e) => {
  const el = document.getElementById(`key-${e.key.toLowerCase()}`);
  if (el) el.classList.add('kbd-active');
});
document.addEventListener('keyup', (e) => {
  const el = document.getElementById(`key-${e.key.toLowerCase()}`);
  if (el) el.classList.remove('kbd-active');
});
```

---

### Recipe #3 — Toast Notification (Spring Pop)

Slides up from bottom-right with spring overshoot. Auto-dismisses after 3s.

```css
.toast-wrapper {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  background: #0f172a;
  color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.15);
  z-index: 9999;
  opacity: 0;
  transform: translateY(30px) scale(0.95);
  transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275),
              opacity 0.3s ease;
}

.toast-wrapper.toast-active {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.toast-indicator {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 8px #10b981;
}
```

```js
function showToast(el) {
  el.classList.add('toast-active');
  setTimeout(() => el.classList.remove('toast-active'), 3000);
}
```

---

### Recipe #4 — Name Tag on Hover (Spring Avatar — Figma Spring)

Hovering avatar reveals name tag with spring physics matching Figma: stiffness `636`, dampening `24` → `cubic-bezier(0.25, 1.4, 0.5, 1)`, duration `500ms`.

```css
.avatar-tag-container { position: relative; display: inline-block; cursor: pointer; }

.avatar-circle {
  width: 56px; height: 56px;
  border-radius: 50%;
  border: 2px solid #ffffff;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  overflow: hidden;
  transition: transform 0.2s ease;
}

.avatar-circle img { width: 100%; height: 100%; object-fit: cover; }

.avatar-tag-container:hover .avatar-circle { transform: scale(1.05); }

.avatar-tag-wrapper {
  position: absolute;
  bottom: 115%;
  left: 50%;
  transform: translateX(-50%) translateY(12px);
  opacity: 0;
  pointer-events: none;
  /* Figma Spring: Stiffness 636, Dampening 24 */
  transition: transform 0.5s cubic-bezier(0.25, 1.4, 0.5, 1),
              opacity 0.3s ease;
}

.avatar-badge {
  padding: 6px 12px;
  background: #0f172a;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 500;
  border-radius: 20px;
  white-space: nowrap;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
}

.avatar-tag-container:hover .avatar-tag-wrapper {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
```

---

### Recipe #5 — Shimmer Stroke (Conic-Gradient Border + Pause Control)

Rotating conic-gradient card border that appears on hover. Includes a pause/play toggle button.

```css
.glow-card {
  position: relative;
  padding: 1px; /* stroke width */
  background: #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
}

.glow-card::before {
  content: '';
  position: absolute;
  top: -50%; left: -50%;
  width: 200%; height: 200%;
  background: conic-gradient(
    from 0deg,
    transparent 20%,
    #8b5cf6 40%,
    #d946ef 60%,
    transparent 80%
  );
  animation: rotate-conic 4s linear infinite;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.glow-card:hover::before { opacity: 1; }
.glow-card.shimmer-paused::before { animation-play-state: paused; }

.glow-card-content {
  position: relative;
  background: #ffffff;
  padding: 24px;
  border-radius: 11px;
  z-index: 1;
}

@keyframes rotate-conic { to { transform: rotate(360deg); } }
```

---

### Recipe #6 — Delayed Tooltip (1000ms Flicker Buffer)

Tooltip enters only after 1000ms hover — prevents accidental flicker as mouse passes over. Hides instantly (0ms) on leave.

```css
.info-tooltip {
  position: absolute;
  top: 120%;
  left: 50%;
  transform: translateX(-50%) translateY(4px);
  width: 220px;
  padding: 10px 14px;
  background: #1e293b;
  color: #ffffff;
  border-radius: 8px;
  font-size: 0.75rem;
  pointer-events: none;
  opacity: 0;
  /* Exit: instant (0ms delay) */
  transition: opacity 0.15s ease 0s, transform 0.15s ease 0s;
}

/* Enter: 1000ms buffer before appearing */
.info-trigger-container:hover .info-tooltip {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
  transition: opacity 0.2s ease 1000ms,
              transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) 1000ms;
}
```

---

### Recipe #7 — Text Hover Pop-out (Inline Word Reveal)

Hovering a specific word expands hidden inline text using `max-width` transition.

```css
.popout-hidden {
  display: inline-block;
  max-width: 0;
  opacity: 0;
  overflow: hidden;
  white-space: nowrap;
  transition: max-width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
              opacity 0.2s ease;
  vertical-align: bottom;
}

.popout-word:hover .popout-hidden {
  max-width: 160px;
  opacity: 1;
}
```

```html
<p>
  Our studio creates
  <span class="popout-word" style="font-weight:600; color:#4f46e5; cursor:pointer;">
    custom apps
    <span class="popout-hidden"> (built with cursor)</span>
  </span>
  for startups.
</p>
```

---

### Recipe #8 — Progress Bar (Linear Mask + Shimmer Sheen)

Progress bar with animated shimmer overlay. Control width via inline style.

```css
.linear-progress {
  width: 100%;
  height: 8px;
  background: #f1f5f9;
  border-radius: 9999px;
  overflow: hidden;
  border: 1px solid #cbd5e1;
}

.linear-progress-fill {
  height: 100%;
  background: #8b5cf6;
  border-radius: 9999px;
  position: relative;
  transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.linear-progress-fill::after {
  content: '';
  position: absolute;
  top: 0; left: 0;
  height: 100%;
  width: 100px;
  background: linear-gradient(
    90deg,
    rgba(255,255,255,0) 0%,
    rgba(255,255,255,0.4) 50%,
    rgba(255,255,255,0) 100%
  );
  animation: shine-bar 2.5s infinite linear;
}

@keyframes shine-bar {
  0%   { transform: translateX(-100px); }
  100% { transform: translateX(300px); }
}
```

---

### Recipe #9 — Card Swipe Stack (Deck Animation)

Three-card depth stack. Hovering swipes the top card away and pulls the next card forward.

```css
.card-deck { position: relative; width: 300px; height: 180px; }

.deck-card {
  position: absolute;
  width: 100%; height: 100%;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  display: flex; align-items: center; justify-content: center;
  font-weight: 500;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
              opacity 0.3s ease;
}

/* Default stack depth */
.card-top    { z-index: 3; transform: scale(1) translateY(0); }
.card-middle { z-index: 2; transform: scale(0.95) translateY(8px); }
.card-bottom { z-index: 1; transform: scale(0.9) translateY(16px); }

/* Hover: top card swipes right, middle card promotes */
.card-deck:hover .card-top    { transform: translateX(110%) rotate(12deg); opacity: 0; z-index: 1; }
.card-deck:hover .card-middle { transform: scale(1) translateY(0); z-index: 3; }
.card-deck:hover .card-bottom { transform: scale(0.95) translateY(8px); z-index: 2; }
```

---

### Recipe #10 — Search Bar Expansion (Apple-Style Focus Morph)

Search icon that expands into a full input on focus. Icon scales and fades on expand.

```css
.search-morph-input {
  width: 42px;
  height: 42px;
  padding: 10px 10px 10px 42px;
  border-radius: 9999px;
  border: 1px solid #cbd5e1;
  outline: none;
  font-size: 0.9rem;
  color: transparent;
  background: transparent;
  cursor: pointer;
  transition: width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
              border-color 0.2s ease,
              color 0.2s ease;
}

.search-morph-input:focus {
  width: 260px;
  cursor: text;
  border-color: #6366f1;
  color: #1e293b;
}

.search-morph-icon {
  position: absolute;
  left: 12px; top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  transition: transform 0.3s ease, opacity 0.2s ease;
  z-index: 5;
}

/* Sibling selector: place icon AFTER input in DOM */
.search-morph-input:focus ~ .search-morph-icon {
  transform: translateY(-50%) scale(0.85);
  opacity: 0.6;
}
```

---

### Recipe #11 — Hover for Upgrade Details (Pricing Limits Slider)

Hovering a pricing card swaps the current limit out and the upgraded limit in via translateY.

```css
.price-slider-card {
  padding: 24px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.price-slider-card:hover { border-color: #8b5cf6; }

.limit-display { position: relative; height: 24px; overflow: hidden; }

.limit-base,
.limit-upgrade {
  display: block;
  height: 24px;
  line-height: 24px;
  font-weight: 500;
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
              opacity 0.2s ease;
}

.limit-base    { color: #64748b; opacity: 1; }
.limit-upgrade { color: #8b5cf6; opacity: 0; transform: translateY(24px); }

.price-slider-card:hover .limit-base    { opacity: 0; transform: translateY(-24px); }
.price-slider-card:hover .limit-upgrade { opacity: 1; transform: translateY(-24px); }
```

---

## Content-First Design Rules

- **Never design with placeholder assets.** If the app shows a data table, mock with a data table — not a stock photo.
- **Design for edge cases always:**
  - Long titles → text truncation or graceful wrapping
  - Icons on user-uploaded images → add semi-transparent circular backing for guaranteed contrast
  - Empty states → design the zero-state, not just the happy path
- **Progressive Disclosure:** Only show what the user needs now. Reveal more as required.
