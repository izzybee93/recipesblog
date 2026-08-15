import assert from 'node:assert/strict'
import test from 'node:test'
import { selectDailyRecipePicks } from './category-picks.ts'

const recipes = Array.from({ length: 12 }, (_, index) => ({
  slug: `recipe-${index + 1}`,
}))

test('selects the requested number of unique daily recipe picks', () => {
  const picks = selectDailyRecipePicks(recipes, 'Breakfast', '2026-08-15', 3)

  assert.equal(picks.length, 3)
  assert.equal(new Set(picks.map((recipe) => recipe.slug)).size, 3)
})

test('returns the same picks for the same category and day', () => {
  const first = selectDailyRecipePicks(recipes, 'Breakfast', '2026-08-15', 3)
  const second = selectDailyRecipePicks([...recipes].reverse(), 'Breakfast', '2026-08-15', 3)

  assert.deepEqual(second, first)
})

test('does not mutate the recipe collection', () => {
  const originalOrder = recipes.map((recipe) => recipe.slug)

  selectDailyRecipePicks(recipes, 'Breakfast', '2026-08-15', 3)

  assert.deepEqual(recipes.map((recipe) => recipe.slug), originalOrder)
})
