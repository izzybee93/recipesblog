# Category Search Card Alignment Design

## Decision

Align the category-page search field with the supporting recipe-card column in `Today's picks` on full-width desktop. The supporting column is approximately 348px wide within the centred 960px container (`1.7fr 1fr` with a 20px gap), while the current search field is 320px wide.

## Responsive rule

- Mobile below 640px: stacked, full-width search.
- Tablet from 640px: trailing-aligned 320px search.
- Desktop from 1024px: trailing-aligned 348px search, matching the supporting card column below.

Keep the title flexible and preserve all existing spacing, search behaviour, category grids, typography, colours, and themes.

## Alternatives considered

- 350px is visually close but overshoots the card edge by roughly 2px.
- A calculated CSS track could derive the width from the card-grid ratio, but the category container and grid are fixed, so that complexity is unnecessary.
- A fixed 348px desktop track is selected for precise, readable alignment.

## Validation

At a 1280px viewport, the search field and supporting card column should both measure approximately 348px and share left and right edges. At 768px the field should remain 320px. At 320px it should stack and fill the available content width. No breakpoint should introduce horizontal overflow.
