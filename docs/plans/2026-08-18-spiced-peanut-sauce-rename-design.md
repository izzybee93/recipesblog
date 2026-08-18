# Spiced peanut sauce rename design

## Goal

Separate the existing spiced sauce from a new, milder Peanut sauce recipe while keeping recipe links, slugs, image paths, and local image assets consistent.

## Design

- Rename the existing `peanut-sauce` recipe to `spiced-peanut-sauce`, including its displayed title, recipe filename, featured-image path, blur-data key, and all local image copies.
- Create a new `peanut-sauce` draft from the current `peanut-dressing` recipe. Preserve its recipe content except for the new title, current date, Peanut sauce image path, `draft: true`, an added `2-4 tbsp water` ingredient, and the appended direction sentence `Add a few more tbsp water as needed.`
- Do not copy the Peanut dressing images. The new draft will reference `/images/recipes/peanut-sauce.jpeg`, and the user will provide that image separately.
- Fully rename the Tempeh and Tofu grain bowl recipes that use `Spiced peanut sauce (see recipe)` so their titles, slugs, filenames, image paths, blur-data keys, local image files, and relevant wording use `spiced-peanut-sauce` consistently.
- Preserve unrelated and pre-existing uncommitted recipe edits.

## Validation

- Confirm the retired recipe slugs and image paths no longer appear outside Git history.
- Confirm the expected renamed and newly created recipe files parse as valid frontmatter.
- Confirm all moved image files retain their original hashes.
- Run the production build.
