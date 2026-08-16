import assert from 'node:assert/strict'
import test from 'node:test'
import { formatRecipeCount } from './homepage-layout.ts'

test('formats a singular recipe result count', () => {
  assert.equal(formatRecipeCount(1), '1 recipe found')
})

test('formats plural recipe result counts', () => {
  assert.equal(formatRecipeCount(0), '0 recipes found')
  assert.equal(formatRecipeCount(318), '318 recipes found')
})
