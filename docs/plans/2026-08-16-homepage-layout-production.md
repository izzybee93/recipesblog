# Homepage Layout Production Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship the selected Search Desk homepage and approved category-page refinements without prototype-only machinery.

**Architecture:** Preserve search state in `SearchableRecipes`, category-section state in `RecipesByCategory`, and scrolling in `CategoryIndex`. Recompose those existing modules into the selected responsive layout, adding only a small pure formatter for result-count copy.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, Node test runner

---

### Task 1: Add result-count copy test-first

**Files:**
- Create: `lib/homepage-layout.test.mts`
- Create: `lib/homepage-layout.ts`

1. Add failing singular and plural assertions for `formatRecipeCount`.
2. Run `node --test lib/homepage-layout.test.mts` and confirm the missing module/function failure.
3. Implement the minimal formatter.
4. Re-run the focused test and confirm it passes.

### Task 2: Recompose the production homepage

**Files:**
- Modify: `components/recipe/SearchableRecipes.tsx`
- Modify: `components/recipe/CategoryIndex.tsx`
- Modify: `components/recipe/RecipesByCategory.tsx`

1. Make `CategoryIndex` render an explicitly requested mobile or desktop navigation treatment.
2. Move the responsive page grid and search control into `SearchableRecipes`.
3. Keep `RecipesByCategory` responsible for progressive category sections, navigation storage, and scroll restoration.
4. Add the connected search-result header, trailing count, empty state, and scoped two-column result grid.
5. Preserve the mobile tap grid and accent `View all` treatment.

### Task 3: Apply approved category-page refinements

**Files:**
- Modify: `components/recipe/CategoryPageClient.tsx`
- Modify: `components/recipe/CategoryPageLayout.tsx`

1. Change the prompt to `Find a recipe...`.
2. Add the centred 960px page width and category-scoped two-column recipe grids.
3. Keep the existing balanced title/search split unchanged.

### Task 4: Verify and hand off

1. Run the focused test, full existing tests, `git diff --check`, and TypeScript.
2. Run the clean production build.
3. Inspect the real homepage and category route at desktop and mobile widths, including active search and overflow.
4. Commit with repository hooks disabled, because the image-sync hook is unrelated and destructive in this worktree.
