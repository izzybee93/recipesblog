interface CopyableRecipe {
  title: string
  ingredients: readonly unknown[]
  directions: readonly string[]
}

export function recipeClipboardText(recipe: CopyableRecipe): string {
  const ingredients: string[] = []
  for (const value of recipe.ingredients) {
    const text = typeof value === 'string'
      ? value
      : value && typeof value === 'object' ? Object.keys(value)[0] ?? '' : String(value ?? '')
    const group = text.match(/^##\s+(.+)$/)
    if (group) {
      if (ingredients.length) ingredients.push('')
      ingredients.push(group[1])
    } else {
      ingredients.push(`- ${text}`)
    }
  }

  return [
    recipe.title, '', 'Ingredients', ...ingredients, '', 'Directions',
    ...recipe.directions.map((direction, index) => `${index + 1}. ${direction}`),
  ].join('\n')
}
