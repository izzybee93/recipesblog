import assert from 'node:assert/strict'
import test from 'node:test'
import { parseRecipeIngredient } from './recipe-ingredients.ts'

test('preserves ordinary ingredient text and whitespace exactly', () => {
  assert.deepEqual(parseRecipeIngredient('  ½ tsp salt  '), {
    kind: 'ingredient', text: '  ½ tsp salt  ',
  })
})

test('recognises group headings without trimming their text', () => {
  assert.deepEqual(parseRecipeIngredient('## Sauce'), { kind: 'group', text: 'Sauce' })
  assert.deepEqual(parseRecipeIngredient('## Toppings  '), { kind: 'group', text: 'Toppings  ' })
  assert.deepEqual(parseRecipeIngredient(' ## Sauce'), { kind: 'ingredient', text: ' ## Sauce' })
  assert.deepEqual(parseRecipeIngredient('##Sauce'), { kind: 'ingredient', text: '##Sauce' })
})

test('uses the first key of legacy YAML objects for ingredients and groups', () => {
  assert.deepEqual(parseRecipeIngredient({ 'Salt, to taste': null }), {
    kind: 'ingredient', text: 'Salt, to taste',
  })
  assert.deepEqual(parseRecipeIngredient({ '## Toppings': null }), {
    kind: 'group', text: 'Toppings',
  })
  assert.deepEqual(parseRecipeIngredient({ Flour: 125, Milk: 250 }), {
    kind: 'ingredient', text: 'Flour',
  })
  assert.deepEqual(parseRecipeIngredient({}), { kind: 'ingredient', text: '' })
})

test('preserves legacy coercion for missing and primitive values', () => {
  assert.deepEqual(parseRecipeIngredient(undefined), { kind: 'ingredient', text: '' })
  assert.deepEqual(parseRecipeIngredient(null), { kind: 'ingredient', text: '' })
  assert.deepEqual(parseRecipeIngredient(42), { kind: 'ingredient', text: '42' })
  assert.deepEqual(parseRecipeIngredient(false), { kind: 'ingredient', text: 'false' })
})
