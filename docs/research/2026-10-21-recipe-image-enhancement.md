# Recipe image enhancement: GPT Image 2.5 research

Researched 21 October 2026 against official OpenAI documentation. Scope: advice for `scripts/enhance-recipe-images.js`; no script changes or paid image requests were made.

## What the script currently does

It edits one original photograph using `gpt-image-2.5-flare`, `quality: 'medium'`, `size: '1536x1024'`, and `n: 1`. It uploads a JPEG resized to fit within 2048 × 2048. Its prompt combines a recipe title and complete ingredient list with instructions to preserve the food, clean the background, and add one or two ingredients around the edges. It specifies neither `output_format` nor `input_fidelity`.

The intended look is professional, inviting, minimalist and visibly homemade. The prompt establishes that intention but leaves lighting, surface material, palette, framing and the amount of added decoration largely to the model.

Inspection of three original/approved pairs during this review found two useful styling observations: the lime-and-chilli-dressing result adds coriander absent from its recipe; the cookie result distributes orange, zest and chocolate across three frame regions. These support testing explicit prop types, individual object limits and one placement zone.

## Verified API facts

- **Variants:** `gpt-image-2.5-sunburst` prioritizes editing precision. `gpt-image-2.5-flare` prioritizes fast everyday image generation. Both accept image inputs. Their dated snapshots are `gpt-image-2.5-sunburst-2026-09-08` and `gpt-image-2.5-flare-2026-09-08`. [Sunburst model](https://developers.openai.com/api/docs/models/gpt-image-2.5-sunburst), [Flare model](https://developers.openai.com/api/docs/models/gpt-image-2.5-flare)
- **Endpoint:** The direct Image API is appropriate for a single-image edit. Responses adds conversational editing, and incurs the mainline model's usage too. [Image generation guide](https://developers.openai.com/api/docs/guides/image-generation)
- **Quality and dimensions:** Both 2.5 variants support `low`, `medium`, `high`, `xhigh`, `max`, and default `auto`. `1536x1024` remains supported. Custom dimensions require multiples of 16, edges ≤3840, aspect ratio ≤3:1, and 655,360–8,294,400 pixels; outputs above 3,686,400 pixels are experimental. [Image prompting guide](https://developers.openai.com/api/docs/guides/image-prompting)
- **Output:** Image API results contain base64 image data; default format is PNG. JPEG and WebP are available, with `output_compression` for those formats. JPEG is faster than PNG. [Image generation guide](https://developers.openai.com/api/docs/guides/image-generation)
- **References and masks:** The edit endpoint permits up to 16 source images. Masks guide edits but do not enforce exact pixel boundaries. [Edit API reference](https://developers.openai.com/api/reference/resources/images/methods/edit), [Image generation guide](https://developers.openai.com/api/docs/guides/image-generation)
- **Pricing:** Standard processing charges both variants $5/million text input tokens, $8/million image input tokens and $30/million image output tokens. Equal token rates do not imply equal per-image costs. Direct Images API requests do not receive cached-input discounts. Use actual `usage` for comparisons; do not reuse an older model's per-image table. [Pricing](https://developers.openai.com/api/docs/pricing), [Image generation guide](https://developers.openai.com/api/docs/guides/image-generation)

## Important uncertainty: `input_fidelity`

Do not automatically add `input_fidelity: 'high'` based on older GPT Image advice. The current edit reference explicitly documents it for GPT Image 1/1.5, limits mini to low, and instructs GPT Image 2 users to omit it. It does not establish GPT Image 2.5 compatibility. The 2.5 parameter table also omits this setting. Leave it unset unless updated documentation or a deliberate compatibility check establishes support. Do not infer that 2.5 defaults to low or inherits GPT Image 2's automatic-high behavior. [Edit API reference](https://developers.openai.com/api/reference/resources/images/methods/edit), [Image prompting guide](https://developers.openai.com/api/docs/guides/image-prompting)

## Prompt techniques supported by the documentation

Describe visible lighting, materials and texture; distinguish permitted changes from preserved details; assign each reference a role; compare outputs after one change at a time. Higher quality does not guarantee improvement. If pixels must remain identical, use compositing: prompting alone cannot ensure it. [Image prompting guide](https://developers.openai.com/api/docs/guides/image-prompting)

## Recommendations and experiments for Baker Beanie

These are design judgments to test, not measured model guarantees.

1. **Give preservation priority.** Define the food's shape, number of portions, arrangement, toppings, crumbs, cut edges and irregular texture as fixed. Preserve the plate or serving dish, camera angle and perspective too. Permit modest exposure, white-balance and tonal changes; that resolves the present tension between “EXACTLY” unchanged food and improved lighting.
2. **Replace vague praise with a visual brief.** Try soft diffused window light, gentle directional shadows, restrained contrast, natural food colors, and a matte warm ivory or pale stone surface. Specify crisp edible texture with no glossy artificial finish. Treat that surface and palette as an initial option, since no visual reference has been chosen.
3. **Reduce the prop instruction.** “One or two ingredients” counts types rather than objects; a sprinkle can still scatter many distracting pieces. Test zero added props first. For a decorated variant, allow one small cluster in one unoccupied corner, with at most two individual pieces. Keep decoration outside the dish and permit no decoration when space is limited.
4. **Separate recipe facts from styling permissions.** Make the photograph authoritative for visible food. The ingredient list provides context, not instructions to reveal hidden ingredients or alter the dish. Prefer an explicit optional prop such as “one strawberry half” to the complete recipe list as a prop-selection menu. Flour, oil, salt and baking powder are usually poor generic edge decoration.
5. **Test a style reference.** Supply image 1 as the food source and image 2 as a reference for light, surface and palette only. Explicitly prohibit copying image 2's food, tableware, props or arrangement. Compare with the text-only brief to determine whether it improves consistency.
6. **Test Sunburst before raising every setting.** First compare Flare medium and Sunburst medium with identical prompts, originals, dimensions and output format. Then compare medium and high for the winning model. Reserve xhigh/max for a demonstrated unresolved detail problem.
7. **Use an actual evaluation set.** Pick six originals covering bread crust, cake crumb, irregular cookies, glossy sauce, a salad, and a cluttered background. Compare food fidelity, clutter, natural texture, shared visual style, latency and cost per approved image. Repeat a few requests to check variability. Reject a beautiful result that invents garnish or changes portions.
8. **Keep retry constraints explicit.** The current retry always starts from the original photograph, so the model cannot see the rejected output. Describe the desired result directly, such as “no herbs outside the glass,” and retain the preservation rules. The no-sprinkles option currently appends a prohibition after the base prompt's instruction to add sprinkles. Build mutually exclusive decoration instructions instead. Passing a nearly acceptable output into a later edit is a separate workflow option, with a risk of accumulated food drift.
9. **Check the actual card crops.** `RecipeGridCard` uses 16:9 on mobile, 4:3 on desktop and 8:3 for featured cards, while the output master is 3:2. Preserve the source angle and allow background extension when needed to fit the master. Inspect each display crop; do not try to force every complete dish into an 8:3 composition.

## Small API/file-handling follow-up

The script saves returned master bytes under a `.jpeg` filename, but the documented API default is PNG. File inspection confirms the approved cookie and dressing masters contain PNG bytes; the sampled salad master is JPEG. Explicitly request `output_format: 'jpeg'` to match current naming, or keep PNG and use a `.png` master filename. The production copy is already explicitly re-encoded to JPEG by Sharp; changing its quality setting is a separate decision.

Retain the current 1536 × 1024 size for the first experiment. Enlarging the output does not inherently establish better preservation. Keep preprocessing fixed while comparing prompts and models; the script's statement that a 2048-pixel input cap “loses nothing” is an implementation assumption, not an API guarantee.
