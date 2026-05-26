# Optimize Raw String Search Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make homepage and category search more efficient while staying with raw string matching and requiring no extra maintenance for new recipes.

**Architecture:** Keep the current client-side `RecipeSearchDocument` approach, but make the matcher more selective and stateful. Search should still use normalized raw strings, but it should 1) split primary vs body matching explicitly, 2) avoid body scans unless needed, 3) reuse previous narrowed result sets when the query extends, and 4) cache query results in memory for the current page session.

**Tech Stack:** Next.js App Router, React 19, TypeScript

---

### Task 1: Extend the shared matcher for phased raw-string search

**Files:**
- Modify: `lib/search.ts`
- Test: `./node_modules/.bin/tsc --noEmit --pretty false`

**Step 1: Write the failing API shape**

Add shared types and function signatures in `lib/search.ts`:

```ts
import { RecipeSearchDocument } from '@/types/recipe'

export interface RecipeSearchMatchBuckets {
  primarySlugs: string[]
  bodySlugs: string[]
}

export interface RecipeSearchOptions {
  candidateSlugs?: Set<string>
  includeBodyMatches?: boolean
}

export function matchRecipeSearchDocuments(
  documents: RecipeSearchDocument[],
  query: string,
  options: RecipeSearchOptions = {}
): RecipeSearchMatchBuckets {
  return { primarySlugs: [], bodySlugs: [] }
}
```

**Step 2: Run typecheck to verify the new API compiles**

Run: `./node_modules/.bin/tsc --noEmit --pretty false`

Expected: PASS or only local usage mismatches after the signature change.

**Step 3: Write the minimal implementation**

Implement the matcher so it:
- normalizes the query internally
- returns empty arrays for normalized queries shorter than 2 characters
- restricts scanning to `candidateSlugs` when provided
- always scans title/category first
- only collects body matches when `includeBodyMatches` is `true`
- never duplicates slugs across buckets

Reference shape:

```ts
export function matchRecipeSearchDocuments(
  documents: RecipeSearchDocument[],
  query: string,
  options: RecipeSearchOptions = {}
): RecipeSearchMatchBuckets {
  const normalizedQuery = normalizeSearchText(query)

  if (normalizedQuery.length < 2) {
    return { primarySlugs: [], bodySlugs: [] }
  }

  const { candidateSlugs, includeBodyMatches = true } = options
  const primarySlugs: string[] = []
  const bodySlugs: string[] = []

  documents.forEach((document) => {
    if (candidateSlugs && !candidateSlugs.has(document.slug)) {
      return
    }

    if (
      document.titleText.includes(normalizedQuery) ||
      document.categoryText.includes(normalizedQuery)
    ) {
      primarySlugs.push(document.slug)
      return
    }

    if (includeBodyMatches && document.bodyText.includes(normalizedQuery)) {
      bodySlugs.push(document.slug)
    }
  })

  return { primarySlugs, bodySlugs }
}
```

**Step 4: Run typecheck to verify it passes**

Run: `./node_modules/.bin/tsc --noEmit --pretty false`

Expected: PASS.

**Step 5: Commit**

```bash
git add lib/search.ts
git commit -m "refactor: add phased raw string search matcher"
```

### Task 2: Add cached and incrementally narrowed homepage search

**Files:**
- Modify: `components/recipe/SearchableRecipes.tsx`
- Test: `npm run build`

**Step 1: Add the state shape for cache and narrowing**

In `components/recipe/SearchableRecipes.tsx`, add refs:

```ts
import { useRef } from 'react'

const queryCacheRef = useRef(new Map<string, string[]>())
const previousQueryRef = useRef('')
const previousResultSlugsRef = useRef<string[] | null>(null)
```

Behavior requirements:
- cache keys should use normalized or deferred query strings consistently
- cache is per-page-session only
- no persistence to localStorage or files

**Step 2: Run build to verify the intermediate state**

Run: `npm run build`

Expected: PASS or only temporary usage warnings if refs are added before logic is complete.

**Step 3: Write the minimal homepage implementation**

Update `filteredRecipes` so it uses this strategy:

1. If `shouldSearch` is false, return `null`.
2. Normalize the deferred query once.
3. If the normalized query is already in `queryCacheRef`, reuse cached slugs.
4. Otherwise:
   - if the new normalized query extends the previous normalized query, restrict the search candidate set to the previous matched slugs
   - run title/category matching first with `includeBodyMatches: false`
   - if primary matches are non-empty, use those immediately and skip body scanning
   - if primary matches are empty, run a second pass with `includeBodyMatches: true` against the same candidate set
   - cache the final slug list
   - update `previousQueryRef` and `previousResultSlugsRef`
5. Map final slugs back through `recipeMap`

Suggested shape:

```ts
const normalizedDeferredQuery = normalizeSearchText(deferredSearchQuery)

const cached = queryCacheRef.current.get(normalizedDeferredQuery)
if (cached) {
  previousQueryRef.current = normalizedDeferredQuery
  previousResultSlugsRef.current = cached
  return cached.map(...)
}

const candidateSlugs =
  previousResultSlugsRef.current &&
  normalizedDeferredQuery.startsWith(previousQueryRef.current)
    ? new Set(previousResultSlugsRef.current)
    : undefined

const primaryMatches = matchRecipeSearchDocuments(searchDocuments, normalizedDeferredQuery, {
  candidateSlugs,
  includeBodyMatches: false,
})

const finalSlugs =
  primaryMatches.primarySlugs.length > 0
    ? primaryMatches.primarySlugs
    : [
        ...matchRecipeSearchDocuments(searchDocuments, normalizedDeferredQuery, {
          candidateSlugs,
          includeBodyMatches: true,
        }).bodySlugs,
      ]
```

Rules:
- keep `showingSearch` and `shouldSearch` based on the immediate `searchQuery`
- keep `startTransition`, `useDeferredValue`, and sessionStorage query persistence unchanged
- keep UI copy unchanged

**Step 4: Run build to verify it passes**

Run: `npm run build`

Expected: PASS.

**Step 5: Commit**

```bash
git add components/recipe/SearchableRecipes.tsx
git commit -m "perf: cache and narrow homepage raw string search"
```

### Task 3: Add cached and incrementally narrowed category-page search

**Files:**
- Modify: `components/recipe/CategoryPageClient.tsx`
- Test: `npm run build`

**Step 1: Add the same in-memory cache and narrowing refs**

In `components/recipe/CategoryPageClient.tsx`, add:

```ts
import { useRef } from 'react'

const queryCacheRef = useRef(new Map<string, string[]>())
const previousQueryRef = useRef('')
const previousResultSlugsRef = useRef<string[] | null>(null)
```

**Step 2: Run build to verify the intermediate state**

Run: `npm run build`

Expected: PASS or only temporary usage warnings until the filtering logic is complete.

**Step 3: Write the minimal category-page implementation**

Mirror the homepage logic exactly:
- use the deferred query
- check the in-memory cache first
- narrow candidate documents when the query extends the prior one
- run title/category pass first
- only run body scanning when no primary matches were found
- cache final slugs and map them back to `RecipeCard[]`

Keep unchanged:
- `Back to Recipes`
- scroll restoration
- query restoration from sessionStorage
- result count UI

**Step 4: Run build to verify it passes**

Run: `npm run build`

Expected: PASS.

**Step 5: Commit**

```bash
git add components/recipe/CategoryPageClient.tsx
git commit -m "perf: cache and narrow category raw string search"
```

### Task 4: Clean up duplication and document the raw-string strategy

**Files:**
- Modify: `lib/search.ts`
- Modify: `components/recipe/SearchableRecipes.tsx`
- Modify: `components/recipe/CategoryPageClient.tsx`
- Test: `./node_modules/.bin/tsc --noEmit --pretty false`

**Step 1: Identify stale comments and duplicated logic**

Check for:
- comments that still describe the old “always scan everything” behavior
- duplicated cache/narrowing helper code that can be extracted into a tiny local helper inside each component or a shared utility if it is identical and low-risk
- any unused imports introduced during the refactor

**Step 2: Run typecheck before cleanup**

Run: `./node_modules/.bin/tsc --noEmit --pretty false`

Expected: PASS.

**Step 3: Write the minimal cleanup**

Acceptable cleanup examples:
- update comments to explain:
  - primary-first search
  - body-match fallback
  - incremental narrowing
- extract a very small local helper inside each component if it reduces duplication without changing behavior

Do not:
- introduce debounce
- add `requestIdleCallback`
- change the UI
- introduce a new indexing/build pipeline

**Step 4: Run typecheck to verify it passes**

Run: `./node_modules/.bin/tsc --noEmit --pretty false`

Expected: PASS.

**Step 5: Commit**

```bash
git add lib/search.ts components/recipe/SearchableRecipes.tsx components/recipe/CategoryPageClient.tsx
git commit -m "chore: document and clean raw string search optimizations"
```

### Task 5: Verify behavior, tradeoffs, and responsiveness

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
- search still activates at 2+ characters
- title/category matches still work
- body-only matches still work when no primary matches exist
- clearing search restores the non-search view
- back navigation still restores the saved query and scroll position

**Step 3: Spot-check the intentional tradeoff**

Test pairs like:
- a title query that also appears in body text
- an ingredient-only query such as `lentils`
- a direction-only query such as `charred`

Expected:
- title/category hits should win and suppress body scanning for that query
- ingredient/direction-only queries should still return results when no primary matches exist

**Step 4: Validate cache and narrowing behavior manually**

Type sequences such as:
- `le` -> `len` -> `lent`
- `to` -> `tof` -> `tofu`
- backspace from a longer query to a shorter one

Expected:
- extending the query should stay correct and should feel a little cheaper
- backspacing should still stay correct because cache hits can satisfy earlier queries

**Step 5: Commit**

```bash
git add .
git commit -m "chore: verify raw string search optimization rollout"
```

### Notes

- This plan intentionally does **not** add debounce.
- This plan intentionally does **not** use `requestIdleCallback`.
- This plan intentionally keeps raw string search and avoids any extra authoring/build workflow for new recipes.
- The main product tradeoff is explicit: body scanning becomes a fallback path rather than always contributing secondary results when primary matches already exist.
- If that tradeoff feels too aggressive in QA, the fallback rule can be softened later to “scan body only for 3+ character queries” while still keeping cache and incremental narrowing.
