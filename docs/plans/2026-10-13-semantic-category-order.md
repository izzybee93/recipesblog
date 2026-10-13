# Semantic Category Order Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Display homepage recipe sections, the desktop sidebar, and the mobile/tablet category menu in the same semantic order.

**Architecture:** Define the preferred order in a small shared utility. Compute the available categories once in `SearchableRecipes` and pass that same array to both `CategoryIndex` instances and `RecipesByCategory`. Categories remain derived from published recipe content, with unfamiliar categories appended alphabetically.

**Tech Stack:** Next.js 15, React 19, TypeScript, Node.js built-in test runner.

**Status:** Implemented, with salad before soup as requested.

---

### Proposed order and rationale

Breakfast → Mains → Salad → Soup → Pasta → Grains → Bread → Snacks → Sauces → Treats → Cakes → Desserts.

The current content contains all 12 categories, including 13 published recipes tagged `soup`. The user's proposed list covers the other 11. Keep its sequence and insert soup after salad, as approved, to keep meal categories together, followed by accompaniments and sweets. Retain the existing singular `salad` and `soup` keys.

Two implementation approaches were considered:

- **Recommended:** Compute one ordered list in the parent and supply it to the sections and both menus. This directly keeps their displayed order synchronized.
- Use the same sorting helper independently in the section component and parent. This requires fewer prop changes but still leaves two places deriving the list.

### Task 1: Define the category display order

**Files:**
- Create: `lib/category-order.ts`

**Step 1:** Add the following utility:

```ts
export const CATEGORY_ORDER = [
  'breakfast',
  'mains',
  'salad',
  'soup',
  'pasta',
  'grains',
  'bread',
  'snacks',
  'sauces',
  'treats',
  'cakes',
  'desserts',
] as const

const categoryRanks = new Map<string, number>(
  CATEGORY_ORDER.map((category, index) => [category, index]),
)

export function sortCategories(categories: readonly string[]): string[] {
  return [...categories].sort((left, right) => {
    const leftRank = categoryRanks.get(left) ?? CATEGORY_ORDER.length
    const rightRank = categoryRanks.get(right) ?? CATEGORY_ORDER.length
    return leftRank - rightRank || left.localeCompare(right)
  })
}
```

**Step 2:** Keep the input keys intact. The caller already receives lowercased, trimmed keys from `getRecipesByCategories`. Sort only available categories; the preferred list must not create empty sections or menu entries. New category keys should remain visible at the end in alphabetical order.

### Task 2: Share the ordered array across all three displays

**Files:**
- Modify: `components/recipe/SearchableRecipes.tsx`
- Modify: `components/recipe/RecipesByCategory.tsx`
- Inspect: `components/recipe/CategoryIndex.tsx`

**Step 1:** Import `sortCategories` into `SearchableRecipes` from `@/lib/category-order` and replace its category memo with:

```ts
const categories = useMemo(
  () => sortCategories(Object.keys(recipesByCategory)),
  [recipesByCategory],
)
```

**Step 2:** Keep both existing `CategoryIndex` calls using `categories`. Pass the same array to the section renderer:

```tsx
<RecipesByCategory recipesByCategory={recipesByCategory} categories={categories} />
```

**Step 3:** Add `categories: string[]` to `RecipesByCategoryProps`, destructure it alongside `recipesByCategory`, and remove the local `Object.keys(recipesByCategory).sort()` declaration. Continue slicing and rendering the supplied array.

**Step 4:** Confirm `CategoryIndex` preserves its supplied array order. Its existing `.map()` calls already do this, so it needs no code change. The mobile grid reads left to right, then top to bottom.

**Scope:** Preserve progressive loading, category anchors, smooth scrolling, recipe selection, search, individual category pages, and existing routes. `getAllCategories()` in `lib/mdx.ts` is used for route generation and validation, so its alphabetical enumeration does not need to change for this display update.

### Task 3: Verify the displayed result

**Step 1:** Run `git diff --check` and `./node_modules/.bin/tsc --noEmit --pretty false`. Expected: both exit successfully. Run the existing checks with `node --test lib/*.test.mts`; expected: all pass.

**Step 2:** Exercise the new utility with an ad hoc Node assertion, without adding a dedicated test file for this small display change. For `['desserts', 'drinks', 'mains', 'breakfast', 'soup', 'appetisers']`, expect `['breakfast', 'mains', 'soup', 'desserts', 'appetisers', 'drinks']`; confirm the input array remains unchanged. Also check that empty input yields empty output.

**Step 3:** Run `npm run dev` and inspect the homepage at desktop, tablet, and mobile widths. Expected:

- All 12 section headings follow the proposed order after background rendering finishes.
- Desktop sidebar and mobile/tablet menu match the section sequence exactly.
- The first three rendered sections are Breakfast, Mains, and Salad.
- Clicking early and late categories scrolls to the matching section.
- Search and clearing search still work; clearing restores the semantic order.
- A “View all” link opens the correct category page, and back navigation still restores the homepage position.

**Step 4:** Run `npm run build`; expected: successful production build. If unrelated content or environment errors occur, record the exact failure separately.

**Step 5:** Review the final diff. Implementation should touch only the utility and the two components. Preserve existing uncommitted recipe renames, content edits, blur data changes, and other documents.

### Verification results

- `git diff --check`, TypeScript validation, and all five existing tests passed.
- Ad hoc assertions passed for salad before soup, missing-category handling, alphabetical fallback, input immutability, and empty input.
- `npm run build` succeeded and generated 601 pages.
- Assertions against built homepage HTML confirmed both desktop and mobile/tablet menus follow the complete order, and initial sections are Breakfast, Mains, and Salad.
- Safari confirmed all 12 hydrated section headings and desktop sidebar buttons follow the approved order. Clicking Desserts scrolled to the Desserts section.
- Further responsive visual, search, and back-navigation checks were not completed: Safari automation stopped accepting actions while attempting responsive preview. The in-app browser also rejected loopback URLs with `ERR_BLOCKED_BY_CLIENT`.
