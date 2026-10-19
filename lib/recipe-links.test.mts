import assert from 'node:assert/strict'
import test from 'node:test'
import { buildRecipeLinkMatcher, ingredientRecipeParts, directionRecipeParts } from './recipe-links.ts'

const matcher = buildRecipeLinkMatcher([
  { title: 'Strawberry jam filling', slug: 'strawberry-jam-filling' },
  { title: 'Sesame dressing', slug: 'sesame-dressing' },
  { title: 'Guacamole', slug: 'guacamole' },
  { title: 'Red guacamole', slug: 'red-guacamole' },
])

test('ingredient reference links only see recipe, preserving measurement and parentheses', () => {
  assert.deepEqual(ingredientRecipeParts('6 tbsp strawberry jam filling (see recipe)', matcher), [
    { text: '6 tbsp strawberry jam filling (' },
    { text: 'see recipe', slug: 'strawberry-jam-filling' },
    { text: ')' },
  ])
})

test('optional ingredient reference resolves canonical title and preserves its wording', () => {
  assert.deepEqual(ingredientRecipeParts('2 servings sesame dressing (optional, see recipe)', matcher), [
    { text: '2 servings sesame dressing (optional, ' },
    { text: 'see recipe', slug: 'sesame-dressing' },
    { text: ')' },
  ])
})

test('ingredient legacy aliases still resolve when absent from the catalogue', () => {
  const parts = ingredientRecipeParts('200g whipped cream filling (see recipe)', matcher)
  assert.equal(parts.find(part => part.slug)?.slug, 'whipped-cream-filling')
})

test('direction references link in mid-sentence and preserve all surrounding text', () => {
  assert.deepEqual(directionRecipeParts('Serve with guacamole (see recipe) and salsa.', matcher), [
    { text: 'Serve with guacamole (' },
    { text: 'see recipe', slug: 'guacamole' },
    { text: ') and salsa.' },
  ])
})

test('directions resolve multiple references and longest recipe titles', () => {
  const text = 'Use Red guacamole (see recipe) or GUACAMOLE (see recipe).'
  const parts = directionRecipeParts(text, matcher)
  assert.deepEqual(parts.filter(part => part.slug).map(part => part.slug), ['red-guacamole', 'guacamole'])
  assert.equal(parts.map(part => part.text).join(''), text)
  assert.deepEqual(directionRecipeParts(text, matcher), parts)
})

test('plain ingredients and directions stay plain text', () => {
  assert.deepEqual(ingredientRecipeParts('125g plain flour', matcher), [{ text: '125g plain flour' }])
  assert.deepEqual(directionRecipeParts('Mix everything together.', matcher), [{ text: 'Mix everything together.' }])
})
