import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { Recipe, RecipeFrontmatter } from '@/types/recipe'

const recipesDirectory = path.join(process.cwd(), 'content/recipes')

export function getRecipeSlugs() {
  if (!fs.existsSync(recipesDirectory)) {
    return []
  }
  return fs.readdirSync(recipesDirectory).filter(file => file.endsWith('.mdx'))
}

export function getRecipeBySlug(slug: string): { meta: Recipe; content: string } | null {
  const realSlug = slug.replace(/\.mdx$/, '')
  const fullPath = path.join(recipesDirectory, `${realSlug}.mdx`)
  
  if (!fs.existsSync(fullPath)) {
    return null
  }
  
  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(fileContents)
  
  const frontmatter = data as RecipeFrontmatter
  
  const meta: Recipe = {
    ...frontmatter,
    slug: realSlug,
    ingredients: Array.isArray(frontmatter.ingredients) 
      ? frontmatter.ingredients 
      : frontmatter.ingredients?.split('\n').filter(Boolean) || [],
    directions: Array.isArray(frontmatter.directions)
      ? frontmatter.directions
      : frontmatter.directions?.split('\n').filter(Boolean) || [],
  }
  
  return { meta, content }
}

export function getAllRecipes(includeDrafts = false): Recipe[] {
  const slugs = getRecipeSlugs()
  const recipes = slugs
    .map((slug) => {
      const recipe = getRecipeBySlug(slug)
      return recipe?.meta
    })
    .filter((recipe): recipe is Recipe => {
      if (!recipe) return false
      if (includeDrafts) return true
      return !recipe.draft
    })
    .sort((a, b) => (new Date(b.date).getTime() - new Date(a.date).getTime()))
  
  return recipes
}

export function getRecipesByCategory(category: string, includeDrafts = false): Recipe[] {
  const allRecipes = getAllRecipes(includeDrafts)
  return allRecipes.filter(recipe => 
    recipe.categories.map(c => c.toLowerCase()).includes(category.toLowerCase())
  )
}

export function getAllCategories(): string[] {
  const recipes = getAllRecipes()
  const categories = new Set<string>()
  
  recipes.forEach(recipe => {
    recipe.categories.forEach(category => {
      categories.add(category.toLowerCase())
    })
  })
  
  return Array.from(categories).sort()
}

export function getRecipesByCategories(includeDrafts = false): Record<string, Recipe[]> {
  const allRecipes = getAllRecipes(includeDrafts)
  const recipesByCategory: Record<string, Recipe[]> = {}
  
  allRecipes.forEach(recipe => {
    recipe.categories.forEach(category => {
      const categoryKey = category.toLowerCase().trim()
      if (!recipesByCategory[categoryKey]) {
        recipesByCategory[categoryKey] = []
      }
      // Only add if not already present (avoid duplicates)
      if (!recipesByCategory[categoryKey].find(r => r.slug === recipe.slug)) {
        recipesByCategory[categoryKey].push(recipe)
      }
    })
  })
  
  // Sort recipes alphabetically within each category
  Object.keys(recipesByCategory).forEach(category => {
    recipesByCategory[category].sort((a, b) => a.title.localeCompare(b.title))
  })
  
  return recipesByCategory
}