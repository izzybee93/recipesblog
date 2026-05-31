# Header Modernization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Modernize the Baker Beanie header while preserving the existing SimplySweet display font, bee logo asset, home navigation behavior, colors, URLs, SEO, and site identity.

**Architecture:** Keep the header as a small client component in `components/Header.tsx`, because it owns the existing logo click navigation behavior. Use Tailwind v4 utility classes and the existing `page-shell`, `--accent`, `--background`, and dark-mode tokens from `app/globals.css`. Do not add new content, nav items, marketing copy, animation systems, or decorative backgrounds.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS v4 utilities, `next/image`, existing `navigation-actions` helpers.

---

### Design Direction

Use a quieter editorial masthead instead of a large logo block:

- Keep the words `Baker` and `Beanie` in `font-display`.
- Keep `/bee.png` as the central logo/home target.
- Reduce visual height so the first recipe/category content appears sooner.
- Use whitespace, scale, alignment, and a very light divider rather than decoration.
- Keep touch targets at least 44px.
- Avoid gradients, glass, heavy shadows, extra copy, and new navigation links.

Recommended final layout:

- Desktop: one horizontal masthead row with `Baker`, bee, `Beanie` centered as a single brand mark.
- Mobile: same brand mark wraps gracefully if needed, with smaller logo and type scale.
- Header has a subtle bottom border and predictable vertical rhythm.
- Logo link has visible focus styling, no text underline, and a small 150ms hover scale.

---

### Task 1: Confirm Current Header Behavior

**Files:**
- Read: `components/Header.tsx`
- Read: `lib/navigation-actions.ts`

**Step 1: Verify current click behavior**

Confirm the logo link still calls:

```ts
navigateHomeFromLogo()
```

**Step 2: Confirm constraints**

Do not change:

```tsx
src="/bee.png"
alt="Baker Beanie Logo"
className includes font-display
```

**Step 3: Manual behavior check**

Run:

```bash
npm run build
```

Expected: build passes before the header-only change, giving a baseline.

---

### Task 2: Replace Oversized Header Spacing With Editorial Masthead

**Files:**
- Modify: `components/Header.tsx`

**Step 1: Update header wrapper**

Replace the current wrapper:

```tsx
<header className="page-shell text-center pt-8 pb-6 md:pt-12 md:pb-8">
```

With:

```tsx
<header className="border-b border-[var(--border)]">
  <div className="page-shell py-6 md:py-8">
```

Close the added inner `div` before `</header>`.

**Step 2: Update brand row**

Use:

```tsx
<div className="font-display mx-auto flex max-w-[760px] flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center md:gap-x-6">
```

Expected effect: the brand occupies a controlled reading-width masthead, matching the recipe page measure and avoiding a full-width loose logo layout.

**Step 3: Preserve semantic heading**

Keep the two visible brand words as headings if desired, but use a calmer scale:

```tsx
className="font-normal leading-none text-gray-800 text-[clamp(2.25rem,8vw,4.25rem)] dark:text-white"
```

Apply to both `Baker` and `Beanie`.

---

### Task 3: Refine Logo Scale and Interaction

**Files:**
- Modify: `components/Header.tsx`

**Step 1: Keep logo route behavior**

Keep:

```tsx
<a href="/" onClick={handleLogoClick}>
```

**Step 2: Use a stable touch target**

Use:

```tsx
className="block min-h-12 min-w-12 rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-4 focus:ring-offset-[var(--background)]"
```

**Step 3: Update image dimensions**

Use:

```tsx
<Image
  src="/bee.png"
  alt="Baker Beanie Logo"
  width={128}
  height={128}
  className="h-20 w-20 transition-transform duration-150 hover:scale-[1.03] md:h-28 md:w-28"
  priority
/>
```

Expected effect: logo remains central and recognizable, but the header no longer dominates the first viewport.

---

### Task 4: Check Mobile Wrapping and Header Rhythm

**Files:**
- Modify only if needed: `components/Header.tsx`

**Step 1: Test narrow viewport mentally and visually**

At 320px wide, the brand should either fit as:

```txt
Baker [bee] Beanie
```

or wrap without overlap:

```txt
Baker
[bee] Beanie
```

**Step 2: If overlap appears, tighten only spacing**

Prefer reducing gaps over shrinking the brand too far:

```tsx
gap-x-3 md:gap-x-6
```

Do not add hidden alternate text, abbreviations, or mobile-only copy.

---

### Task 5: Verify Build and Core Pages

**Files:**
- Verify: `components/Header.tsx`
- Verify affected pages: `/`, `/category/bread`, `/recipes/sourdough-bread`

**Step 1: Run production build**

```bash
npm run build
```

Expected: build exits 0, type checks pass, static pages generate.

**Step 2: Start preview server**

```bash
npm run dev
```

Expected: Next server starts on port 3000 or another available port.

**Step 3: Smoke check routes**

```bash
curl -I http://127.0.0.1:3000/
curl -I http://127.0.0.1:3000/category/bread
curl -I http://127.0.0.1:3000/recipes/sourdough-bread
```

If the server selected another port, use that port.

Expected: all return `HTTP/1.1 200 OK`.

**Step 4: Manual visual checks**

Check:

- Header keeps the SimplySweet font.
- Bee logo is unchanged.
- Logo click returns home.
- Header does not overlap search/category/recipe content.
- Focus ring is visible on the logo link.
- No gradients, glass, or heavy shadows were introduced.

---

### Task 6: Commit Header Change Separately

**Files:**
- Commit: `components/Header.tsx`

**Step 1: Review diff**

```bash
git diff -- components/Header.tsx
```

Expected: only header layout and styling changed.

**Step 2: Commit**

```bash
git add components/Header.tsx
git commit -m "refine header masthead"
```
