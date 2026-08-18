# Category Search Card Alignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align the full-desktop category search field with the 348px supporting recipe-card column while preserving tablet and mobile widths.

**Architecture:** Add a desktop-only grid-track override to the category header. Keep the existing mobile stack and 320px tablet track unchanged.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4

---

### Task 1: Add the desktop search-track override

**Files:**
- Modify: `components/recipe/CategoryPageLayout.tsx:118`

1. Retain `sm:grid-cols-[minmax(0,1fr)_320px]`.
2. Add `lg:grid-cols-[minmax(0,1fr)_348px]`.
3. Run `git diff --check` and `./node_modules/.bin/tsc --noEmit --pretty false`.
4. Measure desktop, tablet, and mobile alignment in the browser.
5. Run the production build; report any unrelated content error separately.
6. Commit directly on `master` with repository hooks disabled.
