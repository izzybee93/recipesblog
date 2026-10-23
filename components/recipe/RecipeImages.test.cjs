const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const test = require('node:test')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const ts = require('typescript')

// Render the real layout (including Next Image) without a Next server.
const root = path.resolve(__dirname, '../..')
const modules = new Map()
function loadSource(filename) {
  if (modules.has(filename)) return modules.get(filename).exports
  const mod = new Module(filename, module)
  modules.set(filename, mod)
  mod.filename = filename
  mod.paths = Module._nodeModulePaths(path.dirname(filename))
  const requireDependency = mod.require.bind(mod)
  mod.require = specifier => {
    if (specifier.endsWith('.module.css')) return new Proxy({}, { get: (_, key) => key === '__esModule' ? false : key })
    if (specifier.startsWith('@/') || specifier.startsWith('.')) {
      const base = specifier.startsWith('@/')
        ? path.join(root, specifier.slice(2))
        : path.resolve(path.dirname(filename), specifier)
      const source = [base, `${base}.ts`, `${base}.tsx`].find(file => fs.existsSync(file) && fs.statSync(file).isFile())
      if (source && /\.tsx?$/.test(source)) return loadSource(source)
    }
    return requireDependency(specifier)
  }
  mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, filename)
  return mod.exports
}
const RecipeLayout = loadSource(path.join(__dirname, 'RecipeLayout.tsx')).default
const recipe = {
  title: 'Test recipe', slug: 'test-recipe', categories: [],
  featured_image: '/images/recipes/test-recipe.jpeg',
  ingredients: [], directions: [], servings: 'serves 2',
}
function renderPhoto(blurDataURL) {
  const html = renderToStaticMarkup(React.createElement(RecipeLayout, { recipe, knownRecipes: [], blurDataURL }))
  return {
    photo: html.match(/<div class="photo"[^>]*>/)?.[0],
    image: html.match(/<img[^>]*alt="Test recipe"[^>]*>/)?.[0],
  }
}

test('first render has an accent gradient when pre-generated blur is unavailable', () => {
  const { photo } = renderPhoto()
  assert.match(photo, /background-image:linear-gradient\([^;]*var\(--accent\)/)
})

test('first render embeds the pre-generated blur directly in the photo background', () => {
  const blur = 'data:image/png;base64,cHJlZ2VuZXJhdGVk'
  assert.ok(renderPhoto(blur).photo.includes(blur))
})

test('the image stays invisible until loaded, hiding broken-image and alt-text flashes', () => {
  for (const blur of [undefined, 'data:image/png;base64,cHJlZ2VuZXJhdGVk']) {
    const { image } = renderPhoto(blur)
    assert.match(image, /opacity:0(?:;|\")/)
    assert.match(image, /alt="Test recipe"/)
  }
})

const RecipeGridCard = loadSource(path.join(__dirname, 'RecipeGridCard.tsx')).default
const CategoryPageLayout = loadSource(path.join(__dirname, 'CategoryPageLayout.tsx')).default

function renderGridCard(featured_image = recipe.featured_image) {
  return renderToStaticMarkup(React.createElement(RecipeGridCard, { recipe: { ...recipe, featured_image } }))
}

test('home cards have a gradient from the first render and hide images until loaded', () => {
  const html = renderGridCard()
  assert.match(html, /background-image:linear-gradient\([^;]*var\(--accent\)/)
  assert.match(html.match(/<img[^>]*>/)?.[0], /opacity:0(?:;|\")/)
})

test('cards with no image path render the placeholder without an image request', () => {
  const html = renderGridCard('')
  assert.match(html, /background-image:linear-gradient\([^;]*var\(--accent\)/)
  assert.doesNotMatch(html, /<img/)
  assert.match(html, /Test recipe/)
})

test('category feature images start with a gradient and stay hidden until loaded', () => {
  const html = renderToStaticMarkup(React.createElement(CategoryPageLayout, {
    recipes: [recipe], dailyPicks: [recipe], displayRecipes: [recipe], categoryName: 'Breakfast',
    shouldSearch: false, search: null, onBack() {},
  }))
  const feature = html.split('Today&#x27;s picks')[1]?.split('All breakfast recipes')[0] || html
  assert.match(feature, /background-image:linear-gradient\([^;]*var\(--accent\)/)
  assert.match(feature.match(/<img[^>]*alt=""[^>]*>/)?.[0], /opacity:0(?:;|\")/)
})
