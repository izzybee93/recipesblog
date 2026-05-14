# Fix Font Loading And Design Consistency Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current font-loading approach with supported Next.js font loading and centralize typography/color styling so the site feels more consistent, modern, and maintainable.

**Architecture:** Keep the visual identity but reduce it to a small, explicit design system: one body font, one display font, and a shared set of brand tokens/utilities. Load fonts through `next/font` instead of CSS `@import`, expose them through CSS variables on the root layout, and remove component-level inline font/color styling in favor of shared classes and tokens.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS 4, `next/font/google`, `next/font/local`

---

### Task 1: Lock the typography system and supported font sources

**Files:**
- Create: `app/fonts.ts`
- Modify: `app/layout.tsx:1-71`
- Modify: `app/globals.css:1-79`

**Step 1: Decide the minimal font stack**

Use only:

```ts
// Body/UI font:
Raleway

// Display/brand font:
SimplySweetSerif
```

Do not keep the unused Google font imports currently present in `app/globals.css`.

**Step 2: Write the failing validation check**

Run:

```bash
rg -n "@import url\\('https://fonts.googleapis.com" app/globals.css
```

Expected: multiple matches for the current Google font imports.

**Step 3: Add Next.js-managed fonts**

Create `app/fonts.ts` with complete font definitions:

```ts
import { Raleway } from 'next/font/google'
import localFont from 'next/font/local'

export const bodyFont = Raleway({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
  weight: ['400', '500', '600', '700', '800'],
})

export const displayFont = localFont({
  src: '../public/SimplySweet_Serif.ttf',
  display: 'swap',
  variable: '--font-display',
})
```

**Step 4: Wire fonts into the root layout**

Update `app/layout.tsx` so the `<html>` or `<body>` carries both font variables:

```tsx
<html lang="en" suppressHydrationWarning className={`${bodyFont.variable} ${displayFont.variable}`}>
```

or:

```tsx
<body className={`${bodyFont.variable} ${displayFont.variable}`}>
```

Keep the rest of the layout behavior intact for this task.

**Step 5: Remove CSS `@import` font loading**

Delete the Google font `@import` lines from `app/globals.css` and replace the global font declarations with CSS variables:

```css
html,
body {
  font-family: var(--font-body), sans-serif;
}
```

**Step 6: Run the validation check again**

Run:

```bash
rg -n "@import url\\('https://fonts.googleapis.com" app/globals.css
```

Expected: no matches.

**Step 7: Verify the app still builds**

Run:

```bash
npm run build
```

Expected: PASS with static generation succeeding.

**Step 8: Commit**

```bash
git add app/fonts.ts app/layout.tsx app/globals.css
git commit -m "refactor: move site fonts to next font"
```

### Task 2: Introduce shared design tokens and typography utilities

**Files:**
- Modify: `app/globals.css:16-79`

**Step 1: Write the failing inventory check for hard-coded brand styling**

Run:

```bash
rg -n "fontFamily:|rgb\\(140, 190, 175\\)|rgb\\(140,190,175\\)" app components
```

Expected: many inline font and accent-color usages across the component tree.

**Step 2: Expand global tokens**

Keep the existing variables but normalize them as the canonical source:

```css
:root {
  --background: #ffffff;
  --foreground: #222222;
  --accent: rgb(140, 190, 175);
  --accent-strong: rgb(120, 170, 155);
  --muted: #999999;
}
```

Add matching dark-mode values if needed.

**Step 3: Add reusable typography utility classes**

Define a small set of shared utilities in `app/globals.css`, for example:

```css
.font-body {
  font-family: var(--font-body), sans-serif;
}

.font-display {
  font-family: var(--font-display), serif;
}

.text-brand {
  color: var(--accent);
}

.bg-brand {
  background-color: var(--accent);
}

.border-brand {
  border-color: var(--accent);
}
```

If Tailwind 4 utility layers fit better, use them; do not overbuild a full design system yet.

**Step 4: Add shared heading utilities**

Create a minimal display-heading style that can replace repeated inline blocks:

```css
.section-heading {
  font-family: var(--font-display), serif;
  color: var(--accent);
}
```

**Step 5: Re-run the inventory command**

Run:

```bash
rg -n "fontFamily:|rgb\\(140, 190, 175\\)|rgb\\(140,190,175\\)" app components
```

Expected: still many matches, but now there is a clear shared target to migrate to.

**Step 6: Commit**

```bash
git add app/globals.css
git commit -m "style: add shared brand and typography utilities"
```

### Task 3: Replace repeated inline typography and accent styles in shared shell components

**Files:**
- Modify: `components/Header.tsx`
- Modify: `components/AboutFooter.tsx`
- Modify: `components/Footer.tsx` if needed
- Modify: `components/SearchBar.tsx`
- Modify: `components/BackToTop.tsx`

**Step 1: Refactor the header brand typography**

Replace:

```tsx
style={{ fontFamily: 'SimplySweetSerif, serif' }}
style={{ fontSize: '5rem' }}
```

with class-based styling built on the shared display font and responsive typography.

Example target:

```tsx
<div className="font-display ...">
<h1 className="text-5xl md:text-7xl ...">
```

**Step 2: Refactor the homepage about section**

Replace repeated inline accent/font usage in `components/AboutFooter.tsx` with `.font-display`, `.text-brand`, and shared text sizing classes.

**Step 3: Remove imperative input styling from the search bar**

In `components/SearchBar.tsx`, replace:

```tsx
onFocus={() => { e.currentTarget.style.boxShadow = ... }}
onBlur={() => { e.currentTarget.style.borderColor = ... }}
```

with class-driven focus styles:

```tsx
className="... focus:ring-2 focus:ring-[color] focus:border-[color] ..."
```

This must preserve dark-mode behavior instead of forcing a light border color on blur.

**Step 4: Refactor the back-to-top button to token-driven styling**

Replace the inline hover/background mutation in `components/BackToTop.tsx` with shared classes or token-backed CSS.

**Step 5: Run a grep to confirm cleanup in shared shell**

Run:

```bash
rg -n "fontFamily:|style=\\{\\{|rgb\\(140, 190, 175\\)|rgb\\(140,190,175\\)" components/Header.tsx components/AboutFooter.tsx components/SearchBar.tsx components/BackToTop.tsx
```

Expected: inline presentation styling is reduced substantially or eliminated in those files.

**Step 6: Run a build check**

Run:

```bash
npm run build
```

Expected: PASS.

**Step 7: Commit**

```bash
git add components/Header.tsx components/AboutFooter.tsx components/SearchBar.tsx components/BackToTop.tsx
git commit -m "style: normalize shell typography and accent styling"
```

### Task 4: Normalize recipe and category page typography

**Files:**
- Modify: `components/recipe/RecipeLayout.tsx`
- Modify: `components/recipe/SearchableRecipes.tsx`
- Modify: `components/recipe/RecipesByCategory.tsx`
- Modify: `components/recipe/CategoryPageClient.tsx`
- Modify: `components/recipe/CategoryIndex.tsx`
- Modify: `components/recipe/RecipeGridCard.tsx`
- Optional Modify: `components/recipe/RecipeCard.tsx`

**Step 1: Replace repeated display-heading styles**

In these files, replace patterns like:

```tsx
style={{
  fontFamily: 'SimplySweetSerif, serif',
  color: 'rgb(140, 190, 175)',
  fontSize: '4rem'
}}
```

with shared class-based styling such as:

```tsx
className="section-heading text-4xl md:text-6xl ..."
```

**Step 2: Replace hard-coded accent color spans and buttons**

Convert repeated:

```tsx
style={{ color: 'rgb(140, 190, 175)' }}
hover:bg-[rgb(140,190,175)]
```

into consistent utilities or token-based classes.

**Step 3: Normalize recipe title typography**

`components/recipe/RecipeLayout.tsx` currently uses `Raleway` inline for the recipe page title. Decide whether recipe titles belong to the display font or the body font, and apply that consistently.

Recommended:

```tsx
Recipe titles: display font
Card text and metadata: body font
```

**Step 4: Keep layout changes conservative**

Do not redesign spacing or information architecture in this task. Only normalize typography and visual consistency.

**Step 5: Run an inventory check on recipe UI**

Run:

```bash
rg -n "fontFamily:|rgb\\(140, 190, 175\\)|rgb\\(140,190,175\\)" components/recipe
```

Expected: only a small number of justified leftovers remain, or none.

**Step 6: Run a build check**

Run:

```bash
npm run build
```

Expected: PASS.

**Step 7: Commit**

```bash
git add components/recipe/RecipeLayout.tsx components/recipe/SearchableRecipes.tsx components/recipe/RecipesByCategory.tsx components/recipe/CategoryPageClient.tsx components/recipe/CategoryIndex.tsx components/recipe/RecipeGridCard.tsx components/recipe/RecipeCard.tsx
git commit -m "style: unify recipe and category typography"
```

### Task 5: Validate visual consistency and remove stale docs

**Files:**
- Modify: `README.md`
- Optional Modify: `CLAUDE.md`

**Step 1: Replace the default README**

`README.md` still describes a stock `create-next-app` setup. Replace it with:

```md
- project purpose
- local dev commands
- content workflow
- font system
- image workflow
```

**Step 2: Add a short note about the new typography rules**

Document:

```md
- body font = Raleway
- display font = SimplySweetSerif
- use shared brand utilities instead of inline colors/fonts
```

**Step 3: Perform manual visual QA**

Run:

```bash
npm run dev
```

Verify manually on:
- `/`
- one category page such as `/category/mains`
- one recipe page such as `/recipes/cherry-lemon-and-almond-polenta-cake`

Check:
- no flash of unstyled text
- headings use the intended display font consistently
- body copy uses the intended body font consistently
- accent color is visually consistent across buttons, headings, and labels
- search focus styles look correct in both light and dark mode
- card title overlays remain readable

**Step 4: Run final production verification**

Run:

```bash
npm run build
```

Expected: PASS.

**Step 5: Commit**

```bash
git add README.md CLAUDE.md
git commit -m "docs: document typography and design conventions"
```

### Notes And Constraints

- Do not add more fonts while fixing the current inconsistency.
- Do not turn this into a full redesign. The goal is consistency and better loading behavior, not a new brand.
- Prefer supported Next.js primitives (`next/font`) over handwritten font-loading code.
- Keep the accent color as-is unless there is a strong contrast failure discovered during QA.
- There is no established test harness in `package.json`, so verification for this slice should rely on `npm run build`, grep-based cleanup checks, and manual browser QA.
