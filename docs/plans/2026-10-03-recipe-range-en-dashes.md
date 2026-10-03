# Recipe Range En Dashes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Use unspaced en dashes for every numerical range and time span in recipe MDX, including future drafts and staged commits.

**Architecture:** A tested Node.js script performs the mechanical rewrite and corpus check while excluding frontmatter date lines. The pre-commit hook invokes it for staged recipes, and the `new-draft` skill declares the same authoring rule.

**Tech Stack:** Node.js built-ins, Node test runner, POSIX shell, MDX.

---

### Task 1: Build the range normalizer test-first

**Files:**
- Create: `scripts/normalize-recipe-ranges.js`
- Create: `scripts/normalize-recipe-ranges.test.js`

1. Write tests for compact and spaced numeric ranges, decimal and Unicode-fraction endpoints, ISO-date preservation, file rewriting, and `--check` failures.
2. Run `node --test scripts/normalize-recipe-ranges.test.js`; expect failure because the normalizer does not exist.
3. Implement the smallest normalizer and CLI that passes those tests.
4. Re-run the test; expect all cases to pass.

### Task 2: Integrate authoring and commit workflows

**Files:**
- Modify: `.agents/skills/new-draft/SKILL.md`
- Modify: `.githooks/pre-commit`

1. Confirm the current skill does not explicitly specify numerical-range punctuation.
2. Add one co-located formatting rule requiring an unspaced en dash while preserving ISO-date hyphens.
3. Invoke the normalizer on staged recipe MDX files in the pre-commit hook before re-staging them.
4. Verify the hook syntax with `sh -n .githooks/pre-commit`.

### Task 3: Normalize and verify the corpus

**Files:**
- Modify: `content/recipes/*.mdx`

1. Run the normalizer over all recipe MDX files.
2. Run it again with `--check`; expect zero remaining ASCII-hyphen numeric ranges outside date lines.
3. Run the normalizer tests, frontmatter tests, and `git diff --check`.
4. Inspect the diff to confirm ISO dates and unrelated working-tree changes are preserved.
