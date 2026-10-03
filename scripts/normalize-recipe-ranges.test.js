const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const test = require('node:test')

const scriptPath = path.join(__dirname, 'normalize-recipe-ranges.js')

test('normalizes numerical ranges to an unspaced en dash', () => {
  const { normalizeRecipeRanges } = require('./normalize-recipe-ranges')
  const source = [
    'servings: "serves 2-3"',
    '  - 2 - 4 tbsp water',
    '  - Bake for 15-20 minutes.',
    '  - Use 1.5 - 2.5 litres.',
    '  - Use ½-1 tsp salt.',
    '',
  ].join('\n')

  assert.equal(
    normalizeRecipeRanges(source),
    [
      'servings: "serves 2–3"',
      '  - 2–4 tbsp water',
      '  - Bake for 15–20 minutes.',
      '  - Use 1.5–2.5 litres.',
      '  - Use ½–1 tsp salt.',
      '',
    ].join('\n'),
  )
})

test('preserves ISO date hyphens', () => {
  const { normalizeRecipeRanges } = require('./normalize-recipe-ranges')
  const source = [
    'date: "2026-10-03"',
    "date: '2025-08-16T15:27:07.294Z'",
    'directions:',
    '  - Rest for 1-2 hours.',
  ].join('\n')

  assert.equal(
    normalizeRecipeRanges(source),
    [
      'date: "2026-10-03"',
      "date: '2025-08-16T15:27:07.294Z'",
      'directions:',
      '  - Rest for 1–2 hours.',
    ].join('\n'),
  )
})

test('CLI rewrites files and check mode reports regressions', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'recipe-ranges-'))
  const recipePath = path.join(directory, 'recipe.mdx')
  fs.writeFileSync(recipePath, 'date: "2026-10-03"\nservings: "serves 2-3"\n')

  const failingCheck = spawnSync(process.execPath, [scriptPath, '--check', recipePath], {
    encoding: 'utf8',
  })
  assert.equal(failingCheck.status, 1)
  assert.match(failingCheck.stderr, /recipe\.mdx/)

  const rewrite = spawnSync(process.execPath, [scriptPath, recipePath], {
    encoding: 'utf8',
  })
  assert.equal(rewrite.status, 0)
  assert.equal(
    fs.readFileSync(recipePath, 'utf8'),
    'date: "2026-10-03"\nservings: "serves 2–3"\n',
  )

  const passingCheck = spawnSync(process.execPath, [scriptPath, '--check', recipePath], {
    encoding: 'utf8',
  })
  assert.equal(passingCheck.status, 0)
})
