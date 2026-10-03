# Remove Image Enhancement Costs Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove every cost and pricing reference from the recipe image enhancement script without changing its enhancement, retry, approval, or progress-count behavior.

**Architecture:** Centralize progress-state construction in a small helper that copies only supported non-cost fields from saved JSON. Delete cost configuration, calculations, return fields, accumulation, summaries, and prose from the operational flow.

**Tech Stack:** Node.js, Node test runner.

---

### Task 1: Specify cost-free behavior

**Files:**
- Modify: `scripts/enhance-recipe-images.test.js`

1. Replace the cost-reporting expectation with assertions that the script contains no cost or pricing references.
2. Add a test that legacy progress data is rebuilt without unsupported fields while preserving counts and attempts.
3. Run `node --test scripts/enhance-recipe-images.test.js`; expect failure against the current cost-tracking script.

### Task 2: Remove cost tracking

**Files:**
- Modify: `scripts/enhance-recipe-images.js`

1. Remove cost-related configuration and prose.
2. Remove per-attempt cost calculations and result `cost` fields.
3. Replace progress initialization/loading with a helper that keeps only supported non-cost state.
4. Remove cost estimates, accumulation, and summaries.
5. Export the state helper and guard `main()` so tests can import it safely.
6. Run `node --test scripts/enhance-recipe-images.test.js`; expect all tests to pass.

### Task 3: Verify the script

**Files:**
- Verify: `scripts/enhance-recipe-images.js`
- Verify: `scripts/enhance-recipe-images.test.js`

1. Search the script case-insensitively for cost, price, pricing, dollar amounts, and “cheaper”; expect no matches.
2. Run `node --check scripts/enhance-recipe-images.js`.
3. Run the image-enhancement tests and `git diff --check` for the two modified files.
4. Inspect the diff to ensure the user’s model-name edits remain intact.
