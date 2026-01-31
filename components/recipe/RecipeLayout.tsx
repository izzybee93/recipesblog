'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Recipe } from '@/types/recipe'
import { useState } from 'react'
import RecipePlaceholder from './RecipePlaceholder'
import RecipeFooter from './RecipeFooter'
import RecipeMode from './RecipeMode'
import { getBackupImageUrl } from '@/lib/blob-image'

interface RecipeLayoutProps {
  recipe: Recipe
  blurDataURL?: string
  children: React.ReactNode
}

// Helper function to convert recipe names to slugs
function recipeNameToSlug(recipeName: string): string {
  // Manual mappings for known recipe names that don't match exactly
  const recipeNameMappings: Record<string, string> = {
    'strawberry jam filling': 'strawberry-jam-filling',
    'whipped cream filling': 'whipped-cream-filling',
    'sesame, ginger and lime stir fry sauce': 'sesame-ginger-and-lime-stir-fry-sauce',
    'sesame salad dressing': 'sesame-salad-dressing',
    'meringue drops': 'meringue-drops',
    'miso salad dressing': 'miso-salad-dressing'
  }

  const normalizedName = recipeName.toLowerCase().trim()

  // Check if we have a manual mapping first
  if (recipeNameMappings[normalizedName]) {
    return recipeNameMappings[normalizedName]
  }

  // Fallback to automatic slug generation
  return recipeName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
}

// Helper function to strip measurements from ingredient text to get the recipe name
function extractRecipeName(ingredientText: string): { ingredientPart: string; recipeName: string } {
  // Pattern to match common measurements at the start of ingredient text
  // Matches: "2 tbsp", "1/2 cup", "100g", "2-3 tsp", "1 heaped tbsp", etc.
  const measurementPattern = /^(\d+[\d\/\-–]*\s*(?:heaped|level|large|small|medium)?\s*(?:tbsp|tsp|tablespoons?|teaspoons?|cups?|g|kg|ml|l|oz|lb|pounds?|bunch|bunches|cloves?|slices?|pieces?|sprigs?|handfuls?|pinch(?:es)?|dash(?:es)?|drops?|sheets?|sticks?|rashers?|strips?|wedges?|portions?|servings?|pots?|tins?|cans?|jars?|packets?|bags?|boxes?|bottles?|tubes?|heads?|stalks?|leaves|florets?|ears?)?\s*(?:of\s+)?)/i

  const match = ingredientText.match(measurementPattern)

  if (match) {
    return {
      ingredientPart: match[1].trim(),
      recipeName: ingredientText.slice(match[1].length).trim()
    }
  }

  return {
    ingredientPart: '',
    recipeName: ingredientText
  }
}

// Helper function to render ingredient with recipe links
function renderIngredientWithLinks(ingredient: string): React.ReactNode {
  const seeRecipePattern = /^(.+?)\s*\(see recipe\)$/i
  const match = ingredient.match(seeRecipePattern)

  if (match) {
    const fullText = match[1].trim()
    const { ingredientPart, recipeName } = extractRecipeName(fullText)
    const slug = recipeNameToSlug(recipeName)

    return (
      <React.Fragment>
        {ingredientPart && `${ingredientPart} `}{recipeName} (
        <Link
          href={`/recipes/${slug}`}
          className="hover:underline"
          style={{ color: 'rgb(140, 190, 175)' }}
          onClick={() => {
            // Mark that we're navigating from another recipe
            sessionStorage.setItem('navigationHistory', 'from-recipe')
          }}
        >
          see recipe
        </Link>
        )
      </React.Fragment>
    )
  }

  return ingredient
}

export default function RecipeLayout({ recipe, blurDataURL, children }: RecipeLayoutProps) {
  const router = useRouter()
  const [useFallback, setUseFallback] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Use backup URL if primary fails
  const imageUrl = useFallback
    ? getBackupImageUrl(recipe.featured_image)
    : recipe.featured_image

  // Show placeholder while fallback is loading
  const showPlaceholder = useFallback && !imageLoaded && !imageError

  const handleImageError = () => {
    if (!useFallback) {
      // Try backup URL first
      setUseFallback(true)
      setImageLoaded(false)
    } else {
      // Backup also failed, show placeholder
      setImageError(true)
    }
  }

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  const handleBack = () => {
    // Get the stored navigation path, or default to homepage
    const navHistory = sessionStorage.getItem('navigationHistory') || '/'
    router.push(navHistory)
  }

  return (
    <article className="post max-w-4xl mx-auto px-4 py-8">
      {recipe.draft && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
          <p className="font-bold">Draft Mode</p>
          <p className="text-sm">This recipe is not yet published.</p>
        </div>
      )}

      <div className="mb-6">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-[rgb(140,190,175)] hover:text-white dark:hover:text-white transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Recipes
        </button>
      </div>

      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white" style={{ marginBottom: '24px', fontFamily: 'Raleway, sans-serif' }}>{recipe.title}</h1>
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {recipe.categories.map((category) => (
            <button
              key={category}
              onClick={() => {
                sessionStorage.removeItem('scroll-position-/')
                sessionStorage.setItem('scroll-to-category', category.toLowerCase())
                window.location.href = '/'
              }}
              className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1 rounded text-sm font-medium capitalize hover:bg-[rgb(140,190,175)] hover:text-white transition-colors cursor-pointer border-none"
            >
              {category}
            </button>
          ))}
        </div>
      </header>

      <div className="image mb-8 relative">
        {imageError ? (
          <RecipePlaceholder
            title={recipe.title}
            className="w-full rounded-lg"
            style={{ height: '400px' }}
          />
        ) : (
          <>
            {/* Show placeholder while fallback is loading */}
            {showPlaceholder && (
              <RecipePlaceholder
                title={recipe.title}
                className="w-full rounded-lg absolute inset-0 z-10"
                style={{ height: '400px' }}
              />
            )}
            <Image
              src={imageUrl}
              alt={recipe.title}
              width={1200}
              height={800}
              className={`w-full h-auto rounded-lg transition-opacity duration-300 ${showPlaceholder ? 'opacity-0' : 'opacity-100'}`}
              priority
              placeholder={blurDataURL ? 'blur' : 'empty'}
              blurDataURL={blurDataURL}
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
          </>
        )}
      </div>

      {children && (
        <div className="recipe-body prose prose-lg max-w-none mb-8">
          {children}
        </div>
      )}

      <div className="recipe-contents grid md:grid-cols-2 gap-8">
        <div className="ingredients">
          <h2 className="text-2xl font-semibold dark:text-white" style={{ marginBottom: '16px' }}>Ingredients</h2>

          <div className="recipe-overview mb-4 flex items-center gap-2">
            <svg
              className="w-4 h-4"
              style={{ color: 'rgb(140, 190, 175)' }}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8.1 13.34l2.83-2.83L3.91 3.5c-1.56 1.56-1.56 4.09 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z" />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">{recipe.servings}</span>
          </div>

          <ul className="space-y-2">
            {recipe.ingredients.map((ingredient, index) => {
              // Check if this is a section header using markdown-style syntax (## Header)
              const sectionMatch = ingredient.match(/^##\s+(.+)$/)

              if (sectionMatch) {
                const headerText = sectionMatch[1].trim()
                return (
                  <li key={index} className="mt-4 mb-2">
                    <h3 className="font-semibold text-lg" style={{ color: 'rgb(140, 190, 175)' }}>
                      {headerText}
                    </h3>
                  </li>
                )
              }

              return (
                <li key={index} className="flex items-start">
                  <span className="mr-2" style={{ color: 'rgb(140, 190, 175)' }}>•</span>
                  <span>{renderIngredientWithLinks(ingredient)}</span>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="directions">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold dark:text-white" style={{ marginBottom: '16px' }}>Directions</h2>
            <RecipeMode />
          </div>
          <ol className="space-y-4">
            {recipe.directions.map((direction, index) => (
              <li key={index} className="flex gap-2">
                <span className="font-bold flex-shrink-0" style={{ color: 'rgb(140, 190, 175)' }}>
                  {index + 1}.{' '}
                </span>
                <span>{direction}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <RecipeFooter />
    </article>
  )
}