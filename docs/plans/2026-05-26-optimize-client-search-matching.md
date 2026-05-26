# Optimize Client Search Matching Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make homepage and category-page search feel snappier without changing search results or UI behavior.

**Architecture:** Keep search client-side and keep the existing `RecipeCard` / `RecipeSearchDocument` payload split, but move the matching rules into one shared utility and run filtering against a deferred query value instead of the immediate keystroke value. The matching utility must preserve the current behavior: title and category matches should still be returned first, and ingredient/direction text matches should still be included afterward.

**Tech Stack:** Next.js App Router, React 19, TypeScript

---

### Task 1: Extract a shared recipe search matcher

**Files:**
- Modify: `lib/search.ts`
- Test: `./node_modules/.bin/tsc --noEmit --pretty false`

**Step 1: Write the failing API shape**

Add a shared function signature to `lib/search.ts`:

```ts
import { RecipeSearchDocument } from '@/types/recipe'

export function matchRecipeSearchDocuments(
  documents: RecipeSearchDocument[],
  query: string
): string[] {
  return []
}
```

Behavior requirements:
- normalize the query internally with `normalizeSearchText`
- if the normalized query is shorter than 2 characters, return `[]`
- preserve existing ranking behavior:
  - first collect title/category matches
  - then collect body-text matches for documents not already matched
- return recipe `slug`s in result order

**Step 2: Run typecheck to verify it fails or is incomplete**

Run: `./node_modules/.bin/tsc --noEmit --pretty false`

Expected: PASS or no useful failure yet. This step is mainly to checkpoint the new surface before implementation.

**Step 3: Write the minimal implementation**

Implement the matcher as a single-pass or two-pass utility in `lib/search.ts`.

Reference implementation shape:

```ts
export function matchRecipeSearchDocuments(
  documents: RecipeSearchDocument[],
  query: string
): string[] {
  const normalizedQuery = normalizeSearchText(query)

  if (normalizedQuery.length < 2) {
    return []
  }

  const primaryMatches: string[] = []
  const secondaryMatches: string[] = []

  documents.forEach((document) => {
    if (
      document.titleText.includes(normalizedQuery) ||
      document.categoryText.includes(normalizedQuery)
    ) {
      primaryMatches.push(document.slug)
      return
    }

    if (document.bodyText.includes(normalizedQuery)) {
      secondaryMatches.push(document.slug)
    }
  })

  return [...primaryMatches, ...secondaryMatches]
}
```

**Step 4: Run typecheck to verify it passes**

Run: `./node_modules/.bin/tsc --noEmit --pretty false`

Expected: PASS.

**Step 5: Commit**

```bash
git add lib/search.ts
git commit -m "refactor: add shared recipe search matcher"
```

### Task 2: Move homepage search to deferred matching

**Files:**
- Modify: `components/recipe/SearchableRecipes.tsx`
- Test: `npm run build`

**Step 1: Make the component depend on the shared matcher**

Update imports:

```ts
import { normalizeSearchText, matchRecipeSearchDocuments } from '@/lib/search'
import { useDeferredValue } from 'react'
```

Then create a deferred query value:

```ts
const deferredSearchQuery = useDeferredValue(searchQuery)
```

**Step 2: Run build to verify it fails or catches missing imports/usages**

Run: `npm run build`

Expected: FAIL or warn until all matching logic is switched over.

**Step 3: Write the minimal implementation**

In `components/recipe/SearchableRecipes.tsx`:
- remove the inline duplicated `searchDocuments.filter(...)` matcher
- compute `filteredRecipes` from `matchRecipeSearchDocuments(searchDocuments, deferredSearchQuery)`
- map returned slugs back through `recipeMap`
- keep `showingSearch` based on the immediate `searchQuery` so the UI mode switch still happens as soon as the user types 2+ characters
- keep sessionStorage persistence unchanged
- keep `startTransition` behavior unchanged

Suggested shape:

```ts
const deferredSearchQuery = useDeferredValue(searchQuery)

const filteredRecipes = useMemo(() => {
  if (!shouldSearch) return null

  const matchedSlugs = matchRecipeSearchDocuments(searchDocuments, deferredSearchQuery)

  return matchedSlugs
    .map((slug) => recipeMap.get(slug))
    .filter((recipe): recipe is RecipeCard => Boolean(recipe))
}, [deferredSearchQuery, recipeMap, searchDocuments, shouldSearch])
```

Important:
- `shouldSearch` should still be based on `searchQuery.trim().length >= 2`
- do not change the search results copy or empty-state copy

**Step 4: Run build to verify it passes**

Run: `npm run build`

Expected: PASS.

**Step 5: Commit**

```bash
git add components/recipe/SearchableRecipes.tsx
git commit -m "perf: defer homepage search matching"
```

### Task 3: Move category-page search to deferred matching

**Files:**
- Modify: `components/recipe/CategoryPageClient.tsx`
- Test: `npm run build`

**Step 1: Make the component depend on the shared matcher**

Update imports:

```ts
import { capitalize, matchRecipeSearchDocuments } from '@/lib/search'
import { useDeferredValue } from 'react'
```

Then add:

```ts
const deferredSearchQuery = useDeferredValue(searchQuery)
```

Also remove `normalizeSearchText` import if it is no longer needed directly.

**Step 2: Run build to verify it fails or catches incomplete refactor**

Run: `npm run build`

Expected: FAIL or warn until the local filter logic is fully switched over.

**Step 3: Write the minimal implementation**

In `components/recipe/CategoryPageClient.tsx`:
- replace the inline `searchDocuments.filter(...)` matcher with `matchRecipeSearchDocuments`
- map slugs back through `recipeMap`
- keep `displayRecipes`, scroll restoration, search query persistence, and `Back to Recipes` behavior unchanged
- remove unused imports introduced by the refactor

Suggested shape:

```ts
const deferredSearchQuery = useDeferredValue(searchQuery)

const filteredRecipes = useMemo(() => {
  if (!shouldSearch) return recipes

  const matchedSlugs = matchRecipeSearchDocuments(searchDocuments, deferredSearchQuery)

  return matchedSlugs
    .map((slug) => recipeMap.get(slug))
    .filter((recipe): recipe is RecipeCard => Boolean(recipe))
}, [deferredSearchQuery, recipeMap, recipes, searchDocuments, shouldSearch])
```

**Step 4: Run build to verify it passes**

Run: `npm run build`

Expected: PASS.

**Step 5: Commit**

```bash
git add components/recipe/CategoryPageClient.tsx
git commit -m "perf: defer category search matching"
```

### Task 4: Clean up duplicate and stale search code

**Files:**
- Modify: `components/recipe/SearchableRecipes.tsx`
- Modify: `components/recipe/CategoryPageClient.tsx`
- Modify: `lib/search.ts`
- Test: `./node_modules/.bin/tsc --noEmit --pretty false`

**Step 1: Identify stale code after the matcher extraction**

Check for:
- unused `normalizeSearchText` imports in the client components
- unused `useRouter` import in `components/recipe/CategoryPageClient.tsx`
- any search comments that no longer describe the actual implementation

**Step 2: Run typecheck to verify cleanup targets exist**

Run: `./node_modules/.bin/tsc --noEmit --pretty false`

Expected: PASS or no-op; this is a cleanup checkpoint.

**Step 3: Write the minimal cleanup**

Remove only stale code introduced by the new shared matcher.

Examples:

```ts
import { useState, useMemo, useCallback, useTransition, useEffect, useDeferredValue } from 'react'
```

and remove:

```ts
import { useRouter } from 'next/navigation'
```

if it is unused.

**Step 4: Run typecheck to verify it passes**

Run: `./node_modules/.bin/tsc --noEmit --pretty false`

Expected: PASS.

**Step 5: Commit**

```bash
git add components/recipe/SearchableRecipes.tsx components/recipe/CategoryPageClient.tsx lib/search.ts
git commit -m "chore: clean up shared search matching rollout"
```

### Task 5: Verify search behavior and perceived responsiveness

**Files:**
- Test only: no code changes required

**Step 1: Run static verification**

Run:

```bash
./node_modules/.bin/tsc --noEmit --pretty false
npm run build
```

Expected: PASS.

**Step 2: Run manual QA**

Check:
- `/`
- `/category/mains`

Verify:
- the UI still switches into search mode at 2+ characters
- title matches still appear before ingredient/direction-only matches
- ingredient/direction-only matches still appear
- clearing the search still restores the non-search view
- back navigation still restores the prior query and scroll position

**Step 3: Compare behavior against the previous implementation**

Spot-check queries that exercise each match type:
- title query, e.g. part of a recipe name
- category query, e.g. `mains`
- ingredient query, e.g. `lentils`
- direction query, e.g. `charred`

Expected:
- same visible result set as before
- smoother typing under fast input, especially on the homepage

**Step 4: Optional browser profiling**

If needed, use the React Profiler or browser Performance panel and compare typing in the search field before/after.

Expected:
- less time spent blocking on immediate keystrokes
- filtering work shifted behind the deferred query

**Step 5: Commit**

```bash
git add .
git commit -m "chore: verify deferred search matching"
```

### Notes

- Do not change route structure, card layout, search copy, or result ordering semantics.
- Do not move search to the server in this pass.
- Do not add new test infrastructure in this pass; this repo currently relies on typecheck, production build, and manual QA.
- If this still does not feel fast enough, the next stage after this one should be a prebuilt lightweight search index optimized for prefix and token matching rather than raw substring scans.
