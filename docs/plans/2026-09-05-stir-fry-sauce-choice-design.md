# Stir fry sauce choice design

## Scope

Update these recipes to offer the same four stir fry sauce choices as `chickpea-stir-fry.mdx`:

- `tofu-and-vegetable-stir-fry.mdx`
- `tofu-noodle-stir-fry.mdx`
- `veggie-noodle-stir-fry.mdx`

## Recipe changes

Replace each current sauce section with this exact ingredient block:

```yaml
  - '## Any sauce'
  - Almond stir fry sauce (see recipe)
  - Lemon, ginger and ponzu stir fry sauce (see recipe)
  - Miso and ginger stir fry sauce (see recipe)
  - Sesame, ginger and lime stir fry sauce (see recipe)
```

Where a recipe embeds the sesame, ginger and lime sauce ingredients, remove those embedded ingredients. Preserve all unrelated recipe ingredients and instructions.

Update the directions so the cook is explicitly told to make their selected sauce immediately before adding it to the stir fry. Where sauce preparation is currently embedded in the recipe, remove that obsolete preparation step.

## Validation

- Parse all three recipes as frontmatter.
- Assert that each contains the exact sauce-choice block once.
- Assert that each direction list includes `Make the sauce.` before the sauce is added.
- Assert that the former embedded sauce ingredients are absent from the two noodle stir fries.
- Run whitespace validation on the three files.

