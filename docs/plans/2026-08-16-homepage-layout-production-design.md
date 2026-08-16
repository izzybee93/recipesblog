# Homepage Layout Production Design

## Decision

Ship the validated Search Desk direction as the real homepage layout. Keep the existing search algorithm, daily recipe ordering, navigation history, scroll restoration, category links, colours, fonts, themes, and recipe cards. Replace only the homepage composition and the approved category-page spacing.

## Homepage layout

- Desktop browsing uses a 230px sticky category sidebar and a flexible recipe column separated by a 48px gap.
- The search field sits at the top of the recipe column so it remains visually connected to search results.
- `Browse` and `Search` are muted secondary orientation labels.
- Mobile keeps search first, followed by the immediately tappable category grid; no horizontally scrolling picker.
- Category sections retain five daily-shuffled recipes, the featured-first grid, progressive rendering, scroll restoration, and accent-coloured `View all` links.
- Active search uses a centred 960px container. The result heading and recipe count share one trailing-aligned row, with a maximum of two recipe cards per row.

## Category pages

- Centre the whole category experience in a 960px maximum-width container.
- Cap category recipe grids at two columns on desktop without changing the shared grid elsewhere.
- Use `Find a recipe...` as the category search prompt.
- Retain the original balanced title/search header split (`1fr 1.15fr`); the later widening and wordmark-alignment experiments are rejected.

## Production boundary

Do not ship the prototype URL parameter, floating switcher, rejected variants, prototype-only component names, or comparison comments. The real homepage continues to render through `SearchableRecipes`, `CategoryIndex`, and `RecipesByCategory`.

## Validation

- Automated tests cover the result-count copy.
- Existing tests, TypeScript, formatting checks, and the production build must pass.
- Browser checks cover homepage browsing and search at 1280px and 320px, category navigation, result-column count, category-page width, and horizontal overflow.
