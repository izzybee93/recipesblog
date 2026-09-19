---
name: rename
description: Use when a Baker Beanie recipe must be renamed across its title, slug, MDX file, images, generated metadata, links, or other repository references.
---

# Rename a recipe

Rename the complete recipe identity without losing working-tree edits or breaking the image-sync workflow.

## Workflow

1. Read the current MDX and derive the new slug from the requested title: lowercase, replace spaces and special characters with hyphens, then trim leading and trailing hyphens.
2. Run `git status --short` and inspect the focused recipe diff. Preserve existing edits and avoid unrelated files.
3. Inventory the old title and slug in tracked and ignored files. Use `rg -uuu` with exclusions for `.git`, `node_modules`, `.next`, and `out`; use `find` for filenames under `public`.
4. Record every existing target, including:
   - `content/recipes/<slug>.mdx`
   - `public/images/recipes/<slug>.<ext>`
   - `public/images/recipes/originals/<slug>.<ext>`
   - `public/images/recipes-enhanced/{approved,previews}/<slug>.<ext>`
   - exact entries in `blur-data.json` and `enhancement-progress.json`
   - links or textual references elsewhere
5. Confirm every corresponding new path is free. Stop and ask before overwriting any collision.
6. Rename the current working-tree MDX and every image variant that actually exists, preserving directories, extensions, and bytes. Missing variants are valid; never manufacture them.
7. Patch only the recipe identity and references: `title`, `featured_image`, explicit links, the blur-data key, and the exact enhancement-progress slug. Preserve the blur value and all unrelated recipe content.

## Blob mapping invariant

Leave the old entry in `blob-image-mapping.json`. The image uploader needs its stored URL to identify and delete the old remote blob while treating the renamed production image as new. Manually renaming or deleting that entry can skip the upload or orphan the old blob.

Run the blob uploader, backup sync, commit, or deployment only when the user explicitly requests that external workflow and its full mutation scope has been checked.

## Completion checks

- Parse the renamed MDX with `gray-matter`; parse modified JSON files.
- Confirm the title and `featured_image` match the new slug.
- Confirm every discovered old file moved to its corresponding new path and every renamed image is non-empty.
- Search again for the exact old title and slug. The only permitted old-slug occurrence is the unchanged blob mapping entry awaiting sync.
- Run `git diff --check` on edited text files and inspect focused status/diffs to confirm unrelated work is untouched.
- Report renamed files, absent variants, validation results, and the blob-sync caveat.

## Common mistakes

- A normal `rg` search misses ignored images and metadata; use `rg -uuu` and filename searches.
- A missing image variant is not permission to create one.
- Updating `blob-image-mapping.json` by hand defeats its deletion-ledger role.
- Rebuilding or reformatting the recipe expands a rename beyond scope.
