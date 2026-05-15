import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { Recipe, RecipeCard, RecipeFrontmatter, RecipeSearchDocument } from '@/types/recipe'
import { transformImagePath } from './blob-image'
import { normalizeSearchText } from './search'

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
    featured_image: frontmatter.featured_image
      ? transformImagePath(frontmatter.featured_image)
      : frontmatter.featured_image,
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

function toRecipeCard(recipe: Recipe): RecipeCard {
  return {
    title: recipe.title,
    slug: recipe.slug,
    date: recipe.date,
    categories: recipe.categories,
    featured_image: recipe.featured_image,
    draft: recipe.draft,
  }
}

function toRecipeSearchDocument(recipe: Recipe): RecipeSearchDocument {
  return {
    slug: recipe.slug,
    titleText: normalizeSearchText(recipe.title),
    categoryText: normalizeSearchText(recipe.categories.join(' ')),
    bodyText: normalizeSearchText([...recipe.ingredients, ...recipe.directions].join(' ')),
  }
}

export function getRecipesByCategory(category: string, includeDrafts = false): Recipe[] {
  const allRecipes = getAllRecipes(includeDrafts)
  return allRecipes
    .filter(recipe =>
      recipe.categories.map(c => c.toLowerCase()).includes(category.toLowerCase())
    )
    .sort((a, b) => a.title.localeCompare(b.title))
}

export function getRecipeCardsByCategory(category: string, includeDrafts = false): RecipeCard[] {
  return getRecipesByCategory(category, includeDrafts).map(toRecipeCard)
}

export function getRecipeSearchDocumentsByCategory(category: string, includeDrafts = false): RecipeSearchDocument[] {
  return getRecipesByCategory(category, includeDrafts).map(toRecipeSearchDocument)
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

export function getRecipeCardsByCategories(includeDrafts = false): Record<string, RecipeCard[]> {
  const recipesByCategory = getRecipesByCategories(includeDrafts)
  const recipeCardsByCategory: Record<string, RecipeCard[]> = {}

  Object.keys(recipesByCategory).forEach((category) => {
    recipeCardsByCategory[category] = recipesByCategory[category].map(toRecipeCard)
  })

  return recipeCardsByCategory
}

export function getRecipeSearchDocuments(includeDrafts = false): RecipeSearchDocument[] {
  const allRecipes = getAllRecipes(includeDrafts)
  const searchDocumentsBySlug = new Map<string, RecipeSearchDocument>()

  allRecipes.forEach((recipe) => {
    if (!searchDocumentsBySlug.has(recipe.slug)) {
      searchDocumentsBySlug.set(recipe.slug, toRecipeSearchDocument(recipe))
    }
  })

  return Array.from(searchDocumentsBySlug.values()).sort((a, b) => a.titleText.localeCompare(b.titleText))
}
