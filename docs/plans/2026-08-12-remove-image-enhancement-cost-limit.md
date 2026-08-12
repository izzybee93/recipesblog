# Remove Image Enhancement Cost Limit Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove the image-enhancement script's hard cost cap while retaining informational cost estimates and accumulated-cost reporting.

**Architecture:** Keep the existing sequential enhancement workflow, progress persistence, and retry protection unchanged. Remove only the cost-limit configuration, warning, and loop-breaking behavior, guarded by a source-level regression test because the interactive script is not structured for import without executing its CLI.

**Tech Stack:** Node.js CommonJS, built-in `node:test`, JavaScript.

---

### Task 1: Remove cost-cap behavior

**Files:**
- Create: `scripts/enhance-recipe-images.test.js`
- Modify: `scripts/enhance-recipe-images.js`

**Step 1: Write the failing test**

Add a `node:test` regression test that reads `scripts/enhance-recipe-images.js` and asserts that it contains no `maxCostLimit`, `Cost limit reached`, limit-warning text, or cost-limit loop break while still containing the estimated-cost and total-cost reporting labels.

**Step 2: Run the test to verify it fails**

Run: `node --test scripts/enhance-recipe-images.test.js`

Expected: FAIL because the script still includes `maxCostLimit` and hard-stop messaging.

**Step 3: Write the minimal implementation**

Remove `CONFIG.maxCostLimit`, the pre-run limit display/warning, and the post-image hard-stop block. Preserve estimated cost, spent-so-far, total estimated cost, progress cost, final total cost, and `maxRetriesPerImage`.

**Step 4: Run verification**

Run: `node --test scripts/enhance-recipe-images.test.js`

Expected: PASS.

Run: `node --check scripts/enhance-recipe-images.js`

Expected: exit 0.

Run: `git diff --check -- scripts/enhance-recipe-images.js scripts/enhance-recipe-images.test.js`

Expected: exit 0.
