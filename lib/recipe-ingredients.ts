export interface ParsedRecipeIngredient {
  kind: 'ingredient' | 'group'
  text: string
}

export function parseRecipeIngredient(value: unknown): ParsedRecipeIngredient {
  const text = typeof value === 'string'
    ? value
    : value && typeof value === 'object'
      ? Object.keys(value)[0] ?? ''
      : String(value ?? '')
  const group = text.match(/^##\s+(.+)$/)
  return group
    ? { kind: 'group', text: group[1] }
    : { kind: 'ingredient', text }
}
