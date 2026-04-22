---
name: new-draft
description: Convert messy pasted Baker Beanie recipe drafts into clean `content/recipes/<slug>.mdx` draft files. Use when the user mentions `new-draft`, asks for the old Claude `/new-draft` workflow, or pastes a recipe that should be parsed, cleaned, validated, and written as a draft recipe with Baker Beanie frontmatter.
---

# New Draft

Parse the user's pasted recipe text directly. Do not use `scripts/new-draft.js`.

Follow this workflow exactly.

## 1. Extract recipe details

Identify:
- Recipe name. This is required. If missing, ask the user before creating the file.
- Ingredients. Parse them into a list if present.
- Directions. Parse them into a list if present.
- Categories. These are required. If missing, ask the user before creating the file.
- Servings. This is required. Keep it lowercase, for example `serves 4` or `makes 12`. If missing, ask the user before creating the file.

Validate categories against this canonical list:

- `breakfast`
- `mains`
- `treats`
- `salad`
- `snacks`
- `sauces`
- `grains`
- `bread`
- `cakes`
- `pasta`
- `soup`
- `desserts`

Before writing the file:
- Lowercase and trim each category.
- Auto-correct these singular or plural mismatches:
  - `salads` -> `salad`
  - `cake` -> `cakes`
  - `dessert` -> `desserts`
  - `soups` -> `soup`
  - `breads` -> `bread`
  - `pastas` -> `pasta`
  - `main` -> `mains`
  - `treat` -> `treats`
  - `snack` -> `snacks`
  - `sauce` -> `sauces`
  - `grain` -> `grains`
- If a category is still invalid after correction, warn the user, show the valid options, and ask whether they want to proceed with a different category before creating the file.
- Report any auto-corrections that were made.

If ingredients or directions are missing, create the file with empty arrays and tell the user to fill them in.

## 2. Clean and normalize the text

Strip problematic characters:
- Remove carriage returns.
- Remove NBSP (`\u00A0`).
- Remove zero-width spaces (`\u200B`, `\uFEFF`).
- Replace smart quotes with straight quotes.
- Remove em dashes and en dashes when they are only being used as list markers.
- Preserve Unicode fractions such as `½`, `⅓`, `¼`, `¾`, and `⅔`.

Parse ingredient and direction items from any of these formats:
- Bullet lists using `•`, `-`, `*`, `–`, or `—`
- Numbered lists such as `1.`, `1)`, `1:`, or `Step 1:`
- Plain newline-separated lines

Remove the bullet or numbering prefix and keep the content.

Preserve direction grouping:
- Do not split every sentence into its own direction item.
- Start a new direction item only when the input clearly introduces one through a new line, paragraph break, bullet, numbered step, or obvious phase change.
- Keep multiple sentences together when they were written together as one paragraph.

Fix obvious typos in ingredients and directions when the intent is clear.

Standardize units to match the existing recipe corpus:
- `tablespoon`, `tablespoons`, `Tablespoon`, `tbsps` -> `tbsp`
- `tsp`, `tsps` -> `tsp`
- `grams`, `gram` -> `g`, for example `200 grams` -> `200g`
- `millilitres`, `milliliters`, `ml` -> `ml`, for example `100 millilitres` -> `100ml`
- `litres`, `liters` remain written as `litre` or `litres`
- Keep `cups`, `pinch`, `handful`, `bunch`, and similar units as written unless they need only casing cleanup

Preserve these ingredient conventions exactly:
- `## Heading` inside ingredients is a section heading. Keep the `##` prefix exactly as written.
- `(see recipe)` inside an ingredient triggers site linking. Keep that text exactly as written.

Apply casing rules:
- Title uses sentence case. Capitalize only the first word unless a later word is a proper noun.
- Ingredients that start with a quantity stay lowercase, for example `250g blueberries`.
- Ingredients that do not start with a quantity capitalize the first letter, for example `Zest of 1 lemon`.
- Keep proper nouns capitalized.
- Do not change the casing of `## Heading` text.
- Directions use sentence case and capitalize the first letter of each step.

## 3. Generate the MDX file

Generate the slug from the recipe name:
- Lowercase it.
- Replace spaces and special characters with hyphens.
- Remove leading and trailing hyphens.

Use today's date in `YYYY-MM-DD` format.

Format the file exactly like this:

```md
---
title: "Recipe Name"
date: "YYYY-MM-DD"
categories:
  - category1
  - category2
featured_image: "/images/recipes/slug.jpeg"
servings: "serves X"
ingredients:
  - ingredient 1
  - ingredient 2
directions:
  - Direction step 1.
  - Direction step 2.
draft: true
---
```

Apply these formatting rules:
- Quote the title with double quotes.
- Quote the date with double quotes.
- Write categories as an unquoted YAML list with two-space indentation.
- Quote `featured_image` with double quotes.
- Quote `servings` with double quotes.
- Quote ingredients with single quotes if they contain commas, colons, or other YAML-significant characters.
- Leave simple ingredients unquoted when valid YAML allows it.
- Leave directions unquoted unless they contain YAML-significant characters.
- Ensure each direction ends with a period.
- Keep `draft: true` as a boolean, not a quoted string.
- Do not include `prep_time`, `cook_time`, or `total_time`.
- End the frontmatter with `---` followed by a single blank line.

When ingredients or directions are missing, write:

```md
ingredients: []
directions: []
```

## 4. Write the file

Write the file to `content/recipes/<slug>.mdx` relative to the repo root.

If a file with that slug already exists, stop and ask the user before overwriting it.

## 5. Report back

After creating the file, report:
- The file path that was created
- Any typos that were fixed
- Any units that were standardized
- Any formatting issues that were cleaned up
- A reminder to add an image at `public/images/recipes/<slug>.jpeg`
- A reminder to set `draft: false` when ready to publish
