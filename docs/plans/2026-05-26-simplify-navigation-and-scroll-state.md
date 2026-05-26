# Simplify Navigation And Scroll State Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Simplify the site’s custom navigation, back-link, search-state, and scroll-restoration code without changing any current UX behavior.

**Architecture:** First centralize the current sessionStorage-driven navigation behavior into one shared client utility layer, then migrate homepage, category, recipe-card, recipe-page, and header interactions onto that layer one entry point at a time. This is a behavior-preservation refactor, not a redesign: every existing “where do I go back to?”, “when is search restored?”, and “when is scroll restored?” rule must be preserved before any further simplification is attempted.

**Tech Stack:** Next.js App Router, React 19, TypeScript, sessionStorage-based client state

---

### Behavior Contract To Preserve

Before implementation, treat these as required invariants:

- Clicking the header bee/logo always goes to `/` and clears homepage search state.
- Clicking a recipe card from `/` stores homepage scroll position and makes `Back to Recipes` on the recipe return to `/`.
- Clicking a recipe card from `/category/<slug>` stores category-page scroll position and makes `Back to Recipes` on the recipe return to that category page.
- Clicking `View all` on the homepage stores homepage scroll position and makes `Back to Recipes` on the category page return to `/`.
- Clicking a category pill on a recipe stores the recipe as the back destination for that category page.
- Clicking `Back to Recipes` on a recipe or category returns to the stored page when available; otherwise it falls back to `/`.
- Back/forward navigation restores the stored search query for `/` and `/category/<slug>`.
- Explicit navigation should not incorrectly resurrect stale search from unrelated pages.
- Scroll restoration still works for homepage, category pages, and refresh/back flows that currently restore it.

### Task 1: Document and centralize sessionStorage key conventions

**Files:**
- Create: `lib/navigation-state.ts`
- Modify: `components/ThemeProvider.tsx`
- Test: `./node_modules/.bin/tsc --noEmit --pretty false`

**Step 1: Write the failing shared API shape**

Create `lib/navigation-state.ts` with typed helpers for the current key patterns:

```ts
export function getNavigationHistoryKey(path: string): string
export function getScrollPositionKey(path: string): string
export function getRestoreScrollKey(path: string): string
export function getSearchQueryKey(path: string): string
export const BACK_NAVIGATION_KEY = 'isBackNavigation'
```

Add simple helpers:

```ts
export function markBackNavigation(): void
export function consumeBackNavigationFlag(): boolean
```

**Step 2: Run typecheck to verify it fails or is incomplete**

Run: `./node_modules/.bin/tsc --noEmit --pretty false`

Expected: PASS or only import/usage gaps once `ThemeProvider` starts to adopt it.

**Step 3: Write the minimal implementation**

Implement the helpers as thin wrappers around the current string formats:

```ts
export function getNavigationHistoryKey(path: string) {
  return `navigationHistory-${path}`
}

export function getScrollPositionKey(path: string) {
  return `scroll-position-${path}`
}

export function getRestoreScrollKey(path: string) {
  return `restoreScroll-${path}`
}

export function getSearchQueryKey(path: string) {
  return `search-query-${path}`
}
```

In `components/ThemeProvider.tsx`, replace the hard-coded `'isBackNavigation'` string with the shared helper/constant only. Do not change behavior yet.

**Step 4: Run typecheck to verify it passes**

Run: `./node_modules/.bin/tsc --noEmit --pretty false`

Expected: PASS.

**Step 5: Commit**

```bash
git add lib/navigation-state.ts components/ThemeProvider.tsx
git commit -m "refactor: centralize navigation storage keys"
```

### Task 2: Centralize homepage/category search-state restoration rules

**Files:**
- Create: `lib/search-state.ts`
- Modify: `components/recipe/SearchableRecipes.tsx`
- Modify: `components/recipe/CategoryPageClient.tsx`
- Test: `./node_modules/.bin/tsc --noEmit --pretty false`

**Step 1: Define the shared search-state API**

Create `lib/search-state.ts` with helpers that encode the current behavior contract:

```ts
export function getInitialSearchQuery(path: string): string
export function persistSearchQuery(path: string, query: string): void
```

Required behavior:
- restore query only on back/forward or matching restore-scroll flows
- clear stale query on explicit forward navigation
- preserve existing path-specific query storage

**Step 2: Run typecheck to verify the new surface**

Run: `./node_modules/.bin/tsc --noEmit --pretty false`

Expected: PASS or only temporary import gaps.

**Step 3: Write the minimal implementation**

Move the current initialization/persistence logic from:
- `components/recipe/SearchableRecipes.tsx`
- `components/recipe/CategoryPageClient.tsx`

into shared helpers that use:
- `consumeBackNavigationFlag()`
- `getRestoreScrollKey(path)`
- `getSearchQueryKey(path)`

Important:
- preserve the homepage special path of `/`
- preserve the category page path shape of `/category/${category}`
- preserve “clear stale query on explicit click navigation”

**Step 4: Run typecheck to verify it passes**

Run: `./node_modules/.bin/tsc --noEmit --pretty false`

Expected: PASS.

**Step 5: Commit**

```bash
git add lib/search-state.ts components/recipe/SearchableRecipes.tsx components/recipe/CategoryPageClient.tsx
git commit -m "refactor: centralize search query restoration rules"
```

### Task 3: Centralize cross-page navigation history writes

**Files:**
- Create: `lib/navigation-actions.ts`
- Modify: `components/Header.tsx`
- Modify: `components/recipe/RecipeGridCard.tsx`
- Modify: `components/recipe/RecipesByCategory.tsx`
- Modify: `components/recipe/RecipeLayout.tsx`
- Test: `./node_modules/.bin/tsc --noEmit --pretty false`

**Step 1: Define shared action helpers**

Create `lib/navigation-actions.ts` with helpers for the current click flows:

```ts
export function navigateHomeFromLogo(): void
export function storeRecipeEntryNavigation(destinationSlug: string, currentPath: string, scrollY: number): void
export function storeCategoryEntryNavigation(categoryPath: string, currentPath: string, scrollY?: number): void
export function storeRestoreScrollForPath(path: string): void
```

Required behavior:
- no routing change yet; `window.location.href` may still be used inside shared helpers if needed
- homepage logo click must still clear homepage search state
- recipe-card click must still store both navigation history and scroll position
- homepage `View all` must still store homepage scroll for return
- recipe category-pill click must still make category back-navigation return to the recipe

**Step 2: Run typecheck to verify the surface compiles**

Run: `./node_modules/.bin/tsc --noEmit --pretty false`

Expected: PASS or temporary usage gaps.

**Step 3: Write the minimal implementation**

Move the following into shared helpers without changing their behavior:
- header logo click logic from `components/Header.tsx`
- recipe-card click logic from `components/recipe/RecipeGridCard.tsx`
- homepage `View all` storage logic from `components/recipe/RecipesByCategory.tsx`
- recipe category-pill storage logic from `components/recipe/RecipeLayout.tsx`
- recipe-to-recipe link history write from `storeRecipeNavigationHistory(...)` in `components/recipe/RecipeLayout.tsx`

The components should become thin callers of these helpers.

**Step 4: Run typecheck to verify it passes**

Run: `./node_modules/.bin/tsc --noEmit --pretty false`

Expected: PASS.

**Step 5: Commit**

```bash
git add lib/navigation-actions.ts components/Header.tsx components/recipe/RecipeGridCard.tsx components/recipe/RecipesByCategory.tsx components/recipe/RecipeLayout.tsx
git commit -m "refactor: centralize navigation history writes"
```

### Task 4: Centralize “Back to Recipes” resolution and scroll-restore intent

**Files:**
- Modify: `lib/navigation-actions.ts`
- Modify: `components/recipe/CategoryPageClient.tsx`
- Modify: `components/recipe/RecipeLayout.tsx`
- Test: `npm run build`

**Step 1: Define the back-navigation helper**

Add to `lib/navigation-actions.ts`:

```ts
export function resolveBackDestination(currentPath: string): string
export function markRestoreScroll(path: string): void
export function navigateToStoredBackDestination(currentPath: string, fallbackPath?: string): void
```

Required behavior:
- if a valid stored path exists, go there
- if not, fall back to `/`
- always mark restore-scroll for the destination before navigating
- preserve current “must start with `/`” guard

**Step 2: Run build to verify temporary gaps**

Run: `npm run build`

Expected: FAIL or warn until both back buttons use the shared helper.

**Step 3: Write the minimal implementation**

Replace the duplicated `handleBack()` logic in:
- `components/recipe/CategoryPageClient.tsx`
- `components/recipe/RecipeLayout.tsx`

with the shared helper.

At this stage, it is acceptable for the helper to continue using `window.location.href`. The goal is de-duplication and correctness preservation first.

**Step 4: Run build to verify it passes**

Run: `npm run build`

Expected: PASS.

**Step 5: Commit**

```bash
git add lib/navigation-actions.ts components/recipe/CategoryPageClient.tsx components/recipe/RecipeLayout.tsx
git commit -m "refactor: centralize back navigation behavior"
```

### Task 5: Centralize scroll restoration reads

**Files:**
- Create: `lib/scroll-state.ts`
- Modify: `components/ThemeProvider.tsx`
- Modify: `components/recipe/RecipesByCategory.tsx`
- Modify: `components/recipe/CategoryPageClient.tsx`
- Test: `npm run build`

**Step 1: Define scroll helpers**

Create `lib/scroll-state.ts`:

```ts
export function saveScrollPosition(path: string, y: number): void
export function getSavedScrollPosition(path: string): number | null
export function clearSavedScrollPosition(path: string): void
export function shouldRestoreScroll(path: string): boolean
export function consumeRestoreScroll(path: string): boolean
```

Behavior requirements:
- keep the current per-path storage shape
- do not change refresh behavior in `ThemeProvider`
- do not remove homepage/category special handling yet

**Step 2: Run build to verify it fails or exposes integration gaps**

Run: `npm run build`

Expected: FAIL or warn until old inline sessionStorage code is replaced.

**Step 3: Write the minimal implementation**

Move direct scroll key reads/writes into helpers used by:
- `components/ThemeProvider.tsx`
- `components/recipe/RecipesByCategory.tsx`
- `components/recipe/CategoryPageClient.tsx`

Preserve the current behavior differences:
- homepage restore waits for visible categories to render
- category page restore happens on mount
- `ThemeProvider` keeps refresh/unload scroll persistence logic

Do not attempt to merge these flows yet if it risks behavior drift. Shared helpers first, orchestration later.

**Step 4: Run build to verify it passes**

Run: `npm run build`

Expected: PASS.

**Step 5: Commit**

```bash
git add lib/scroll-state.ts components/ThemeProvider.tsx components/recipe/RecipesByCategory.tsx components/recipe/CategoryPageClient.tsx
git commit -m "refactor: centralize scroll restoration state"
```

### Task 6: Add a behavior-lock checklist and remove only truly redundant code

**Files:**
- Modify: `components/ThemeProvider.tsx`
- Modify: `components/recipe/SearchableRecipes.tsx`
- Modify: `components/recipe/CategoryPageClient.tsx`
- Modify: `components/recipe/RecipesByCategory.tsx`
- Modify: `components/recipe/RecipeLayout.tsx`
- Modify: `components/Header.tsx`
- Test: `./node_modules/.bin/tsc --noEmit --pretty false`

**Step 1: Identify dead or duplicated logic after centralization**

Look for:
- repeated key-string construction
- repeated sessionStorage read/write branches
- stale comments that no longer match the shared-helper design
- dead local helpers replaced by shared utilities

**Step 2: Run typecheck before cleanup**

Run: `./node_modules/.bin/tsc --noEmit --pretty false`

Expected: PASS.

**Step 3: Write the minimal cleanup**

Only remove code that is clearly redundant after helper adoption.

Do not:
- convert everything to router-native navigation in this plan
- change any destination, fallback, or restore condition
- collapse homepage/category/refresh scroll orchestration if the behaviors differ today

The cleanup goal is clarity, not “maximum abstraction.”

**Step 4: Run typecheck to verify it passes**

Run: `./node_modules/.bin/tsc --noEmit --pretty false`

Expected: PASS.

**Step 5: Commit**

```bash
git add components/ThemeProvider.tsx components/recipe/SearchableRecipes.tsx components/recipe/CategoryPageClient.tsx components/recipe/RecipesByCategory.tsx components/recipe/RecipeLayout.tsx components/Header.tsx
git commit -m "chore: remove redundant navigation state code"
```

### Task 7: Verify the full navigation/scroll matrix manually

**Files:**
- Test only: no code changes required

**Step 1: Run static verification**

Run:

```bash
./node_modules/.bin/tsc --noEmit --pretty false
npm run build
```

Expected: PASS.

**Step 2: Run homepage manual QA**

Verify on `/`:
- typing in search persists while staying on the page
- explicit logo click clears homepage search and goes home
- clicking a recipe card from `/` and using `Back to Recipes` returns to `/`
- scroll position on `/` is restored after returning from a recipe
- clicking `View all` on a category and then `Back to Recipes` on the category page returns to `/` with prior scroll

**Step 3: Run category-page manual QA**

Verify on `/category/mains` (or another category):
- category-page search restores on back/forward
- clicking a recipe card from the category and then `Back to Recipes` on the recipe returns to that category
- category page scroll is restored after returning from a recipe
- `Back to Recipes` on the category page returns to the stored origin or `/` fallback exactly as before

**Step 4: Run recipe-page manual QA**

Verify on a recipe page:
- recipe category pill click still makes the category page’s `Back to Recipes` return to the recipe
- recipe-to-recipe `(see recipe)` links still set the back destination for the destination recipe
- direct recipe visit with no stored history still makes `Back to Recipes` fall back to `/`

**Step 5: Run browser-navigation QA**

Verify:
- browser back/forward restores search queries correctly
- refresh does not lose scroll unexpectedly
- no stale search query appears on unrelated explicit navigation

**Step 6: Commit**

```bash
git add .
git commit -m "chore: verify navigation and scroll behavior lock"
```

### Notes

- This plan is intentionally conservative. It centralizes behavior before attempting any “web-native” routing simplification.
- Do not replace `window.location.href` with router navigation in the same pass unless browser/manual QA proves behavior parity for every flow above.
- If this refactor succeeds cleanly, a later follow-up plan can evaluate whether some of the now-centralized flows can safely move to normal `Link` / router behavior with less sessionStorage state.
