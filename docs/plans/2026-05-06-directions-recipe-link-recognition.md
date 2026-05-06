# Directions Recipe Link Recognition Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow recipe pages to recognize `Recipe name (see recipe)` inside direction steps and render the marker as an internal recipe link, matching the existing ingredient-list behavior.

**Architecture:** Keep this as a presentation-layer transform. Frontmatter parsing in `lib/mdx.ts` already delivers `directions` as string arrays, so the change belongs in the recipe UI renderer. To keep inference predictable, support only explicit inline spans where the referenced recipe name appears immediately before `(see recipe)`, such as `butter bean dip (see recipe)` inside a longer sentence.

**Tech Stack:** Next.js 15, React 19, TypeScript, MDX frontmatter via `gray-matter`

---

### Task 1: Confirm and codify the supported syntax

**Files:**
- Modify: `components/recipe/RecipeLayout.tsx`
- Reference: `content/recipes/maple-roasted-carrots.mdx`

**Step 1: Document the direction-link contract in code comments**

Add a short comment above the new helper explaining the supported form:

```ts
// Supports inline recipe references when the recipe name appears
// immediately before "(see recipe)", e.g. "butter bean dip (see recipe)".
// This avoids trying to infer titles from arbitrary prose.
```

**Step 2: Preserve ingredient behavior as the baseline**

Keep the existing ingredient syntax working:

```ts
// Existing supported examples:
// "Tahini dressing (see recipe)"
// "Tahini dressing (optional, see recipe)"
```

**Step 3: Run a quick code search to verify scope**

Run:

```bash
rg -n "see recipe|renderIngredientWithLinks|recipeNameToSlug" components content/recipes
```

Expected: current linkification is isolated to `components/recipe/RecipeLayout.tsx`, and `maple-roasted-carrots.mdx` is the only current directions example.

**Step 4: Commit**

```bash
git add components/recipe/RecipeLayout.tsx
git commit -m "chore: document direction recipe-link syntax"
```

### Task 2: Extract reusable recipe-link helpers

**Files:**
- Modify: `components/recipe/RecipeLayout.tsx`

**Step 1: Write the failing usage mentally before editing**

The current directions renderer cannot handle this:

```tsx
<span>{"Serve topped with butter bean dip (see recipe)."}</span>
```

Expected after implementation: the rendered output contains a Next `Link` for `see recipe` pointing to `/recipes/butter-bean-dip`.

**Step 2: Refactor the current helpers into shared primitives**

Keep `recipeNameToSlug`, and split the linkification into two layers:

```ts
function createRecipeLink(slug: string, label: React.ReactNode): React.ReactNode
function renderIngredientWithLinks(ingredient: string): React.ReactNode
function renderDirectionWithLinks(direction: string): React.ReactNode
```

**Step 3: Keep ingredient parsing explicit**

Retain the current ingredient-specific measurement stripping:

```ts
function extractRecipeName(ingredientText: string): {
  ingredientPart: string
  recipeName: string
}
```

This should remain ingredient-only. Do not reuse measurement stripping for directions.

**Step 4: Verify TypeScript still compiles locally**

Run:

```bash
npm run build
```

Expected: the app still builds after the helper extraction, with no ingredient regressions introduced by the refactor.

**Step 5: Commit**

```bash
git add components/recipe/RecipeLayout.tsx
git commit -m "refactor: extract shared recipe-link rendering helpers"
```

### Task 3: Add inline direction link recognition

**Files:**
- Modify: `components/recipe/RecipeLayout.tsx`

**Step 1: Implement a direction-specific matcher**

Use a regex that finds `Recipe name (see recipe)` inside a longer sentence without consuming the whole sentence:

```ts
const directionRecipePattern =
  /([A-Za-z0-9][A-Za-z0-9\s,&'/-]*?)\s*\((optional,?\s*)?see recipe\)/gi
```

Use the match text immediately before `(see recipe)` as the recipe name candidate. Keep the rest of the sentence unchanged.

**Step 2: Render directions as mixed text + link nodes**

Build the output as an array of text fragments and React nodes:

```tsx
function renderDirectionWithLinks(direction: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  // push plain text before each match
  // push recipe name text
  // push "(" + optional marker + Link("see recipe") + ")"
  // push trailing text
  return <>{parts}</>
}
```

**Step 3: Keep scope intentionally narrow**

Do not attempt any of these in the first pass:

```ts
// Unsupported for now:
// "(see recipe)" with no recipe name immediately before it
// inferring recipe names across sentence boundaries
// linking arbitrary mentions without the explicit marker
```

**Step 4: Replace raw direction rendering**

Update the directions list from:

```tsx
<span>{direction}</span>
```

to:

```tsx
<span>{renderDirectionWithLinks(direction)}</span>
```

**Step 5: Run a build check**

Run:

```bash
npm run build
```

Expected: PASS, and the route for `maple-roasted-carrots` prerenders cleanly.

**Step 6: Commit**

```bash
git add components/recipe/RecipeLayout.tsx
git commit -m "feat: support recipe links in directions"
```

### Task 4: Verify against the real content example

**Files:**
- Reference: `content/recipes/maple-roasted-carrots.mdx`
- Reference: `content/recipes/butter-bean-dip.mdx`

**Step 1: Use the existing recipe as the regression fixture**

Keep this direction unchanged:

```md
- Serve topped with fresh dill and pomegranate seeds. Optionally serve on a bed of butter bean dip (see recipe).
```

**Step 2: Start the app and inspect the rendered page**

Run:

```bash
npm run dev
```

Then open `/recipes/maple-roasted-carrots` and verify:
- the sentence still reads naturally
- only `see recipe` is linked
- the link target is `/recipes/butter-bean-dip`
- the ingredient list still renders existing `(see recipe)` links correctly

**Step 3: Check back-navigation behavior**

Click the directions link and verify the linked recipe page stores the same session-based back destination used by ingredient links.

Expected: Back from `butter-bean-dip` returns to `maple-roasted-carrots`, not always to the homepage.

**Step 4: Commit**

```bash
git add components/recipe/RecipeLayout.tsx
git commit -m "test: verify direction recipe-link rendering manually"
```

### Task 5: Optional hardening if the first pass feels too heuristic

**Files:**
- Modify: `components/recipe/RecipeLayout.tsx`
- Optional Create: `docs/recipe-link-syntax.md`

**Step 1: Decide whether inference is reliable enough**

If the regex incorrectly captures too much preceding prose, tighten the contract rather than broadening the parser.

Safer fallback options:

```md
Butter bean dip (see recipe)
```

or, if needed later, a more explicit authoring syntax such as:

```md
[Butter bean dip] (see recipe)
```

**Step 2: Document the authoring rule**

If you had to tighten the allowed syntax, add a short author note near the recipe workflow docs so future drafts use the supported format consistently.

**Step 3: Re-run verification**

Run:

```bash
npm run build
```

Expected: PASS after any syntax tightening.

**Step 4: Commit**

```bash
git add components/recipe/RecipeLayout.tsx docs/recipe-link-syntax.md
git commit -m "docs: clarify supported recipe-link syntax"
```

### Feasibility Summary

This is possible without changing the recipe schema, MDX loader, or content model.

The low-risk implementation is:
- keep ingredients on the current parser path
- add a separate inline renderer for directions
- only support explicit `Recipe name (see recipe)` spans inside a direction

The only meaningful risk is ambiguous title extraction from arbitrary prose. For the current real example in `maple-roasted-carrots.mdx`, the direction text is explicit enough that this approach should work.
