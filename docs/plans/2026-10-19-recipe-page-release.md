# Recipe Page Release Plan

> **For Claude:** Use superpowers:executing-plans to implement this plan task by task. The user has approved the design and requested deployment.

**Goal:** Ship the selected recipe-page design on normal recipe URLs.

**Architecture:** Implement the approved layout in the existing RecipeLayout and RecipeMode components. Preserve the recipe route's metadata and image fallback support; remove unused MDX rendering and recipe-link matching because the selected design uses static lists. Keep all prototype code and comparison history on `codex/prototype-recipe-layouts`, outside the release branch.

**Tech stack:** Next.js 15 App Router, React 19, TypeScript, CSS modules, existing Tailwind theme classes, Screen Wake Lock API.

## 1. Establish a clean release baseline

- Start from fetched `origin/master` in `.worktrees/recipe-page-release`.
- Preserve the main checkout and its unrelated recipe edits.
- Run `node --test lib/*.test.mts scripts/*.test.js` (baseline: 11 passing).
- Run the browser acceptance probe against the original normal recipe route and confirm it fails the selected layout contract before implementation.

## 2. Implement the selected design

- Rewrite `components/recipe/RecipeLayout.tsx`; add `RecipeLayout.module.css`.
- Stack title, original category pills, and a large 3:2 image on all screen sizes. Header width: 760px. Title/category gaps: 24px desktop and 20px mobile; 32px before image.
- Keep desktop ingredients and directions side by side, with sticky ingredients. Stack the sections on mobile, with sticky count-free section links.
- Put 14px servings and the exact original crossed-cutlery icon beside Ingredients. Centre both section heading rows in 44px.
- Keep ingredient lists static, with small accent dots, and static direction lists with accent numbers in surface-coloured circles. Preserve ingredient group headings.
- Place cooking mode and its original info icon at the trailing edge of Directions. Keep the accepted toggle/text spacing (8px), and visible text/info-icon spacing (10px) with a 44px tap area.
- Rewrite `components/recipe/RecipeMode.tsx` for cancellable wake-lock acquisition, release on unmount, and reacquisition after visibility changes. Preserve the chosen colours, tooltip text, keyboard, hover, and tap behaviour. Report unavailable wake lock honestly.
- Retain the site header, footers, category/back navigation, recipe metadata, draft warning, blur previews, primary/backup image fallback, and appropriate responsive image sizes.
- Simplify `app/recipes/[slug]/page.tsx` to render the production layout without unused prose/data. Do not include prototype routes, flags, switchers, or unrelated maintenance changes.

## 3. Verify and review

- Re-run the same browser acceptance probe on normal recipe URLs at desktop and mobile widths. Check header order, original category styling, serving alignment/font/icon, static lists, recipe columns, section links, cooking toggle and tooltip, and image loading.
- Check Crêpes, cookies, a long grouped-ingredient recipe, and a missing-image fallback.
- Run existing Node tests, TypeScript, whitespace checks, and `npm run build`.
- Request independent review of the release diff; fix material findings before publishing.

## 4. Publish and verify

- Commit only the production change, then fast-forward the remote production branch without force-pushing. Keep the prototype branch as the design record.
- Use the existing GitHub/Vercel deployment integration. The local Vercel CLI has no credentials, so it is not the deployment path.
- Verify the normal live recipe URL shows the selected layout after deployment. Report the actual deployment result and any remaining external limitation.

## Verification results

- All 11 existing Node tests pass; production build, lint/type checks, and whitespace checks pass.
- Browser acceptance passed on normal URLs at 1440px, 390px, and 320px. Crêpes, cookies, and grouped teriyaki ingredients retain the chosen layout without horizontal overflow. Servings remain 14px; section headings and servings align.
- Cooking mode acquires a real screen wake lock; the information tooltip opens and closes with Escape.
- Broccoli salad with its local image absent successfully loads the configured GitHub backup image while retaining the 3:2 frame.
- Independent review found one scrolling keyboard-access issue; fixed with a focusable labelled ingredients panel and visible keyboard focus. Explicit list roles preserve list semantics with custom markers.
