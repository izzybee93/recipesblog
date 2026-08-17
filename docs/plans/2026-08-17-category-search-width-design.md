# Category Search Width Design

## Decision

On category pages, keep the search field full width only on mobile. From the existing `sm` breakpoint upward, use a fixed 320px search column aligned to the right edge of the centred 960px category container. Let the category title occupy the remaining width.

## Scope

- Mobile below 640px remains stacked with a full-width field.
- Tablet and desktop use a flexible title column, the existing 24px gap, and a 320px search column.
- Preserve the current vertical alignment, spacing, placeholder, search behaviour, 960px container, and two-card category grid.
- Do not alter the homepage search layout or shared `SearchBar` component.

## Alternatives considered

- Constrain only the search wrapper inside the existing proportional grid. This looks similar but leaves an unnecessarily wide invisible grid track.
- Use a three-column proportional grid. This is conceptually neat but makes the field about 304px after gaps rather than the requested approximate third of the 960px content width.
- A flexible title plus explicit 320px search track expresses the intended relationship directly and is selected.

## Validation

At 1280px and tablet widths of at least 640px, the search field should measure 320px and its right edge should match the category container. At 320px, the title and field should stack and the field should fill the available content width. No state may introduce horizontal overflow.
