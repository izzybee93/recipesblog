# Reduce Client Search Payload Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reduce the amount of recipe data shipped to the homepage and category pages so client-side search stays responsive without changing the UI.

**Architecture:** Keep full `Recipe` objects for actual recipe pages, but introduce two slimmer server-derived shapes for list/search pages: a small card model for rendering grids and a compact search document for matching queries. Search will continue to run client-side, but against pre-normalized server-built text instead of full `ingredients` and `directions` arrays.

**Tech Stack:** Next.js App Router, React 19, TypeScript, MDX frontmatter via `gray-matter`

---

### Task 1: Define slim recipe list and search types

**Files:**
- Modify: `types/recipe.ts`
- Modify: `components/recipe/RecipeGrid.tsx`
- Modify: `components/recipe/RecipeGridCard.tsx`
- Test: `./node_modules/.bin/tsc --noEmit --pretty false`

**Step 1: Write the failing type change**

Add two new exported interfaces in `types/recipe.ts`:

```ts
export interface RecipeCard {
  title: string
  slug: string
  date: string
  categories: string[]
  featured_image: string
  draft?: boolean
}

export interface RecipeSearchDocument {
  slug: string
  titleText: string
  categoryText: string
  bodyText: string
}
```

Then update `RecipeGrid` and `RecipeGridCard` props to use `RecipeCard` instead of full `Recipe`.

**Step 2: Run typecheck to verify it fails**

Run: `./node_modules/.bin/tsc --noEmit --pretty false`

Expected: FAIL in files still expecting full `Recipe` objects for list/grid/search rendering.

**Step 3: Write the minimal type updates**

Adjust imports and prop types only. Do not change any rendering logic yet.

Example:

```ts
import { RecipeCard } from '@/types/recipe'

interface RecipeGridProps {
  recipes: RecipeCard[]
}
```

**Step 4: Run typecheck to verify it passes or only fails in planned downstream files**

Run: `./node_modules/.bin/tsc --noEmit --pretty false`

Expected: Remaining errors should only point to homepage/category search flow that still passes full `Recipe` shapes.

**Step 5: Commit**

```bash
git add types/recipe.ts components/recipe/RecipeGrid.tsx components/recipe/RecipeGridCard.tsx
git commit -m "refactor: add slim recipe card and search types"
```

### Task 2: Add server-side search normalization and payload builders

**Files:**
- Modify: `lib/search.ts`
- Modify: `lib/mdx.ts`
- Test: `./node_modules/.bin/tsc --noEmit --pretty false`

**Step 1: Add the failing helper signatures**

Add a shared normalization helper to `lib/search.ts`:

```ts
export function normalizeSearchText(str: string): string {
  return removeDiacritics(str.toLowerCase()).replace(/\s+/g, ' ').trim()
}
```

Add new exports in `lib/mdx.ts`:

```ts
export function getRecipeCardsByCategories(includeDrafts = false): Record<string, RecipeCard[]>
export function getRecipeCardsByCategory(category: string, includeDrafts = false): RecipeCard[]
export function getRecipeSearchDocuments(includeDrafts = false): RecipeSearchDocument[]
export function getRecipeSearchDocumentsByCategory(category: string, includeDrafts = false): RecipeSearchDocument[]
```

**Step 2: Run typecheck to verify it fails**

Run: `./node_modules/.bin/tsc --noEmit --pretty false`

Expected: FAIL because the new exports are declared but not fully implemented or imported.

**Step 3: Write the minimal implementation**

In `lib/mdx.ts`, build the new shapes from existing `Recipe` data:

```ts
function toRecipeCard(recipe: Recipe): RecipeCard {
  return {
    title: recipe.title,
    slug: recipe.slug,
    date: recipe.date,
    categories: recipe.categories,
    featured_image: recipe.featured_image,
    draft: recipe.draft,
  }
}

function toRecipeSearchDocument(recipe: Recipe): RecipeSearchDocument {
  return {
    slug: recipe.slug,
    titleText: normalizeSearchText(recipe.title),
    categoryText: normalizeSearchText(recipe.categories.join(' ')),
    bodyText: normalizeSearchText([
      ...recipe.ingredients,
      ...recipe.directions,
    ].join(' ')),
  }
}
```

Rules:
- Deduplicate homepage search documents by `slug` so recipes in multiple categories appear once.
- Keep sorting behavior unchanged.
- Do not change recipe-page helpers like `getRecipeBySlug`.

**Step 4: Run typecheck to verify it passes**

Run: `./node_modules/.bin/tsc --noEmit --pretty false`

Expected: PASS.

**Step 5: Commit**

```bash
git add lib/search.ts lib/mdx.ts
git commit -m "refactor: build slim list payloads and search documents"
```

### Task 3: Move homepage search to slim cards plus compact search docs

**Files:**
- Modify: `app/page.tsx`
- Modify: `components/recipe/SearchableRecipes.tsx`
- Modify: `components/recipe/RecipesByCategory.tsx`
- Test: `npm run build`

**Step 1: Make the homepage prop contract fail**

Change `app/page.tsx` to stop calling `getRecipesByCategories()` and instead call:

```ts
const recipeCardsByCategory = getRecipeCardsByCategories()
const recipeSearchDocuments = getRecipeSearchDocuments()
```

Update `SearchableRecipes` props to:

```ts
interface SearchableRecipesProps {
  recipesByCategory: Record<string, RecipeCard[]>
  searchDocuments: RecipeSearchDocument[]
}
```

**Step 2: Run build to verify it fails**

Run: `npm run build`

Expected: FAIL because `SearchableRecipes` and `RecipesByCategory` still expect full `Recipe` objects.

**Step 3: Write the minimal implementation**

In `SearchableRecipes.tsx`:
- Flatten `recipesByCategory` into unique `RecipeCard[]` as today.
- Build a `Map<string, RecipeCard>` keyed by slug.
- Search only `searchDocuments`.
- Preserve current match priority:
  - title first
  - categories second
  - combined body text last
- Convert matched slugs back into `RecipeCard[]` for `RecipeGrid`.

Suggested matching logic:

```ts
const matchedSlugs = searchDocuments
  .filter((doc) => {
    if (doc.titleText.includes(query)) return true
    if (doc.categoryText.includes(query)) return true
    return doc.bodyText.includes(query)
  })
  .map((doc) => doc.slug)

const matchedRecipes = matchedSlugs
  .map((slug) => recipeMap.get(slug))
  .filter((recipe): recipe is RecipeCard => Boolean(recipe))
```

`RecipesByCategory.tsx` should only receive `RecipeCard[]` by category; no logic change beyond type updates.

**Step 4: Run build to verify it passes**

Run: `npm run build`

Expected: PASS, with homepage route size stable or slightly smaller and no UI changes.

**Step 5: Commit**

```bash
git add app/page.tsx components/recipe/SearchableRecipes.tsx components/recipe/RecipesByCategory.tsx
git commit -m "perf: slim homepage search payload"
```

### Task 4: Move category page search to slim cards plus compact search docs

**Files:**
- Modify: `app/category/[slug]/page.tsx`
- Modify: `components/recipe/CategoryPageClient.tsx`
- Test: `npm run build`

**Step 1: Make the category page prop contract fail**

Change `app/category/[slug]/page.tsx` to load:

```ts
const recipes = getRecipeCardsByCategory(slug)
const searchDocuments = getRecipeSearchDocumentsByCategory(slug)
```

Update `CategoryPageClientProps`:

```ts
interface CategoryPageClientProps {
  recipes: RecipeCard[]
  searchDocuments: RecipeSearchDocument[]
  category: string
}
```

**Step 2: Run build to verify it fails**

Run: `npm run build`

Expected: FAIL because `CategoryPageClient` still searches `ingredients` and `directions` directly on `Recipe`.

**Step 3: Write the minimal implementation**

Mirror the homepage pattern:
- Build `recipeMap` keyed by slug.
- Search `searchDocuments`.
- Return matching `RecipeCard[]`.
- Keep all scroll restoration and navigation behavior unchanged.

Use the same query normalization path as the homepage:

```ts
const query = normalizeSearchText(searchQuery)
```

**Step 4: Run build to verify it passes**

Run: `npm run build`

Expected: PASS.

**Step 5: Commit**

```bash
git add app/category/[slug]/page.tsx components/recipe/CategoryPageClient.tsx
git commit -m "perf: slim category search payload"
```

### Task 5: Verify no UI regression and measure the payload win

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
- one recipe page such as `/recipes/cherry-lemon-and-almond-polenta-cake`

Verify:
- homepage search still finds recipes by title, category, ingredient text, and direction text
- category search still finds recipes by title and recipe text
- category rows and recipe grids look unchanged
- recipe pages are untouched

**Step 3: Compare build output before/after**

Record:
- homepage route size
- category route size
- first-load JS

Expected: first-load JS may stay similar, but the server-to-client serialized page payload should shrink because ingredients and directions are no longer embedded in list/search props.

**Step 4: Optional spot-check with browser devtools**

Inspect the homepage Flight/data payload and confirm `ingredients` / `directions` are absent from homepage and category-page client props.

**Step 5: Commit**

```bash
git add .
git commit -m "chore: verify slim search payload rollout"
```

### Notes

- Do not change recipe-page rendering or `RecipeLayout`.
- Do not change search UX, query length threshold, result ordering, or scroll-restoration behavior.
- Do not add a heavy test framework in this pass. This repo currently relies on typecheck, production build, and manual QA.
- If later profiling shows search is still expensive, the next low-risk step is to defer body-text matching until title/category matching returns zero results.
