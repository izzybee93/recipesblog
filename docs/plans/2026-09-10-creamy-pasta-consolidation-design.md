# Creamy Pasta Consolidation Design

## Goal

Consolidate “Creamy broccoli pasta” and “Creamy courgette pasta” into one flexible recipe named “Creamy pasta,” following the structure of “Pasta with creamy tofu sauce.”

## Recipe

Use the existing creamy courgette pasta recipe as the retained recipe and rename its file to `creamy-pasta.mdx`. Delete the creamy broccoli pasta recipe.

Structure the ingredients as:

- Shared pasta, olive oil, and black pepper ingredients.
- `## Any veggie:` with 2 chopped courgettes or ½ broccoli, chopped and roasted.
- `## Any additional veggie:` with 150g cooked peas or 60g spinach.
- `## Sauce` with Creamy pasta sauce.

Follow the shared flow used by “Pasta with creamy tofu sauce”: cook the pasta, sauté any raw primary vegetable, prepare and loosen the sauce, then add the pasta, any roasted primary vegetable, and any additional vegetable. This preserves the established cooking method for each option while keeping one concise set of directions.

## Images and Generated Data

Keep the creamy courgette pasta image and rename its production, original, enhanced-approved, and preview variants to `creamy-pasta.jpeg`. Delete all creamy broccoli pasta image variants.

Regenerate `blur-data.json`. Rename the courgette slug and remove the broccoli slug in `enhancement-progress.json`.

Leave `blob-image-mapping.json` unchanged so the next image-upload sync can identify the removed remote objects, upload the renamed image, and update its own tracking state without orphaning old blobs.

## Verification

Verify that all expected renamed files exist, all obsolete local files and site-facing references are absent, the JSON files parse, generated-data entries are correct, and the production build succeeds.
