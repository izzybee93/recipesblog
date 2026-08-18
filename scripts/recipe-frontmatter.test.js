const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const matter = require('gray-matter')

const recipesDirectory = path.join(__dirname, '..', 'content', 'recipes')

test('all recipe frontmatter is valid YAML', () => {
  const recipeFiles = fs.readdirSync(recipesDirectory).filter(file => file.endsWith('.mdx'))

  for (const recipeFile of recipeFiles) {
    const recipePath = path.join(recipesDirectory, recipeFile)
    const source = fs.readFileSync(recipePath, 'utf8')

    assert.doesNotThrow(
      () => matter(source),
      `${recipeFile} contains invalid frontmatter`,
    )
  }
})
