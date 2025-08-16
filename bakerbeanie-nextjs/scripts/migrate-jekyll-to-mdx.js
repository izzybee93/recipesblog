const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')

const jekyllPostsDir = path.join(__dirname, '../../_posts')
const nextRecipesDir = path.join(__dirname, '../content/recipes')
const jekyllImagesDir = path.join(__dirname, '../../images/recipes')
const nextImagesDir = path.join(__dirname, '../public/images/recipes')

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function parseJekyllRecipe(frontmatter) {
  const recipe = frontmatter.recipe || {}
  
  const ingredients = recipe.ingredients_markdown
    ? recipe.ingredients_markdown
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^\*\s*/, '').trim())
    : []
  
  const directions = recipe.directions_markdown
    ? recipe.directions_markdown
        .split(/\d+\.\s*/)
        .filter(line => line.trim())
        .map(line => line.trim())
    : []

  // Handle categories - split space-separated strings into arrays
  let categories = []
  if (Array.isArray(frontmatter.categories)) {
    categories = frontmatter.categories
  } else if (typeof frontmatter.categories === 'string') {
    categories = frontmatter.categories.split(/\s+/).filter(Boolean)
  } else {
    categories = ['uncategorized']
  }

  return {
    title: frontmatter.title,
    date: frontmatter.date || new Date().toISOString(),
    categories,
    featured_image: frontmatter.featured_image || '',
    servings: recipe.servings || '',
    ingredients,
    directions,
    prep_time: recipe.prep_time,
    cook_time: recipe.cook_time,
    total_time: recipe.total_time,
    draft: false
  }
}

function migratePost(filename) {
  const filePath = path.join(jekyllPostsDir, filename)
  const fileContent = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(fileContent)
  
  const recipe = parseJekyllRecipe(data)
  
  const slug = filename
    .replace(/^\d{4}-\d{2}-\d{2}-/, '')
    .replace(/\.md$/, '')
  
  const mdxFrontmatter = Object.fromEntries(
    Object.entries({
      ...recipe,
      date: recipe.date || filename.match(/^\d{4}-\d{2}-\d{2}/)?.[0] || new Date().toISOString()
    }).filter(([_, value]) => value !== undefined && value !== null)
  )
  
  const mdxContent = matter.stringify(content, mdxFrontmatter)
  
  const outputPath = path.join(nextRecipesDir, `${slug}.mdx`)
  fs.writeFileSync(outputPath, mdxContent)
  
  console.log(`✓ Migrated: ${filename} → ${slug}.mdx`)
  
  return slug
}

function copyImages() {
  if (!fs.existsSync(jekyllImagesDir)) {
    console.log('No images directory found in Jekyll site')
    return
  }

  ensureDirectoryExists(nextImagesDir)
  
  const images = fs.readdirSync(jekyllImagesDir)
  images.forEach(image => {
    const sourcePath = path.join(jekyllImagesDir, image)
    const destPath = path.join(nextImagesDir, image)
    
    if (fs.statSync(sourcePath).isFile()) {
      fs.copyFileSync(sourcePath, destPath)
      console.log(`✓ Copied image: ${image}`)
    }
  })
}

function createSampleRecipe() {
  const sampleRecipe = `---
title: "Sample Recipe (Draft)"
date: "${new Date().toISOString()}"
categories: ["breakfast"]
featured_image: "/images/recipes/sample.jpg"
servings: "serves 4"
ingredients:
  - "2 cups flour"
  - "1 cup milk"
  - "2 eggs"
  - "1 tsp vanilla"
directions:
  - "Mix dry ingredients"
  - "Add wet ingredients"
  - "Cook until golden"
draft: true
prep_time: "10 minutes"
cook_time: "20 minutes"
total_time: "30 minutes"
---

This is a sample recipe to show how MDX content works. You can add any additional content here using Markdown or MDX components.

## Tips

- This recipe is marked as draft
- To publish, change draft: true to draft: false in the frontmatter
- You can use all Markdown features here
`

  const samplePath = path.join(nextRecipesDir, '_draft-sample-recipe.mdx')
  fs.writeFileSync(samplePath, sampleRecipe)
  console.log('✓ Created sample draft recipe')
}

function main() {
  console.log('Starting Jekyll to Next.js migration...\n')
  
  ensureDirectoryExists(nextRecipesDir)
  
  if (fs.existsSync(jekyllPostsDir)) {
    const posts = fs.readdirSync(jekyllPostsDir)
      .filter(file => file.endsWith('.md'))
    
    console.log(`Found ${posts.length} Jekyll posts to migrate\n`)
    
    posts.forEach(migratePost)
    console.log()
  } else {
    console.log('No Jekyll posts directory found')
  }
  
  console.log('Copying images...')
  copyImages()
  console.log()
  
  console.log('Creating sample draft recipe...')
  createSampleRecipe()
  
  console.log('\n✅ Migration complete!')
  console.log('\nNext steps:')
  console.log('1. Review migrated recipes in content/recipes/')
  console.log('2. Update image paths if needed')
  console.log('3. Run: npm run dev')
  console.log('4. Visit http://localhost:3000')
}

main()