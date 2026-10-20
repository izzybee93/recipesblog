import assert from 'node:assert/strict'
import test from 'node:test'
import { recipeClipboardText } from './recipe-copy.ts'

test('copies only the recipe title, yield, ingredients and numbered directions', () => {
  const recipe = {
    title: 'Crêpes',
    ingredients: ['125g plain flour', '250ml oat milk'],
    directions: ['Whisk the batter.', 'Cook each crêpe until golden.'],
    categories: ['breakfast', 'treats'],
    servings: 'makes 10',
    featured_image: '/images/recipes/crepes.jpeg',
    slug: 'crepes',
    prep_time: '5 minutes',
  }
  assert.equal(recipeClipboardText(recipe), [
    'Crêpes', 'makes 10', '', 'Ingredients', '- 125g plain flour', '- 250ml oat milk', '',
    'Directions', '1. Whisk the batter.', '2. Cook each crêpe until golden.',
  ].join('\n'))
})

test('copies the displayed servings wording and range below the title', () => {
  const recipe = {
    title: 'Tomato soup',
    servings: 'serves 4–5',
    ingredients: ['Tomatoes'],
    directions: ['Simmer.'],
  }
  assert.equal(recipeClipboardText(recipe), [
    'Tomato soup', 'serves 4–5', '', 'Ingredients', '- Tomatoes', '', 'Directions', '1. Simmer.',
  ].join('\n'))
})

test('preserves ingredient groups without copying their Markdown heading markers', () => {
  assert.equal(recipeClipboardText({
    title: 'Noodles',
    ingredients: ['200g noodles', '## Sauce', '2 tbsp soy sauce', '## Toppings', 'Sesame seeds'],
    directions: ['Toss together.'],
  }), [
    'Noodles', '', 'Ingredients', '- 200g noodles', '', 'Sauce', '- 2 tbsp soy sauce', '',
    'Toppings', '- Sesame seeds', '', 'Directions', '1. Toss together.',
  ].join('\n'))
})

test('preserves recipe reference wording and measurement characters in copied content', () => {
  assert.equal(recipeClipboardText({
    title: 'Cake & cream',
    ingredients: ['½ tsp salt', '6 tbsp strawberry jam filling (see recipe)'],
    directions: ['Fill with Whipped cream filling (see recipe), then chill.'],
  }), [
    'Cake & cream', '', 'Ingredients', '- ½ tsp salt', '- 6 tbsp strawberry jam filling (see recipe)', '',
    'Directions', '1. Fill with Whipped cream filling (see recipe), then chill.',
  ].join('\n'))
})

test('handles legacy YAML ingredient objects the same way as the recipe page', () => {
  assert.equal(recipeClipboardText({
    title: 'Sauce',
    ingredients: [{ 'Salt, to taste': null }],
    directions: ['Season.'],
  }), 'Sauce\n\nIngredients\n- Salt, to taste\n\nDirections\n1. Season.')
})
