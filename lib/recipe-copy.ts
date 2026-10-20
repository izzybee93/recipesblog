import { parseRecipeIngredient } from './recipe-ingredients.ts'

interface CopyableRecipe {
  title: string
  servings?: string
  ingredients: readonly unknown[]
  directions: readonly string[]
}

export function recipeClipboardText(recipe: CopyableRecipe): string {
  const ingredients: string[] = []
  for (const value of recipe.ingredients) {
    const ingredient = parseRecipeIngredient(value)
    if (ingredient.kind === 'group') {
      if (ingredients.length) ingredients.push('')
      ingredients.push(ingredient.text)
    } else {
      ingredients.push(`- ${ingredient.text}`)
    }
  }

  return [
    recipe.title, ...(recipe.servings ? [recipe.servings] : []), '', 'Ingredients', ...ingredients, '', 'Directions',
    ...recipe.directions.map((direction, index) => `${index + 1}. ${direction}`),
  ].join('\n')
}
