# Category Search Width Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the category search field 320px wide and trailing-aligned on tablet and desktop while retaining a full-width stacked mobile field.

**Architecture:** Change only the responsive grid tracks on the category-page header. Use the existing `sm` breakpoint so all widths from 640px upward receive a flexible title column and fixed 320px search column.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4

---

### Task 1: Refine the category header grid

**Files:**
- Modify: `components/recipe/CategoryPageLayout.tsx:118`

1. Replace the proportional `sm:grid-cols-[1fr_1.15fr]` tracks with `sm:grid-cols-[minmax(0,1fr)_320px]`.
2. Run `git diff --check` and `./node_modules/.bin/tsc --noEmit --pretty false`.
3. Verify 320px, tablet, and 1280px layouts in the browser. Confirm width, trailing alignment, stacking, and no overflow.
4. Run `npm run build` and confirm all static pages generate.
5. Commit the component and planning documents with repository hooks disabled.
