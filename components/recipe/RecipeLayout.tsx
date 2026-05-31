'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Recipe } from '@/types/recipe'
import { useMemo, useState } from 'react'
import RecipePlaceholder from './RecipePlaceholder'
import RecipeFooter from './RecipeFooter'
import RecipeMode from './RecipeMode'
import { getBackupImageUrl } from '@/lib/blob-image'
import {
  navigateToStoredBackDestination,
  storeCategoryEntryNavigation,
  storeRecipeLinkNavigation,
} from '@/lib/navigation-actions'

interface RecipeLayoutProps {
  recipe: Recipe
  knownRecipes?: Array<{
    title: string
    slug: string
  }>
  blurDataURL?: string
  children: React.ReactNode
}

interface RecipeLinkMatcher {
  titleToSlug: Map<string, string>
  directionPattern: RegExp | null
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

function renderRecipeLink(slug: string, linkText: string) {
  return (
    <Link
      href={`/recipes/${slug}`}
      className="hover:underline"
      style={{ color: 'var(--accent)' }}
      onClick={() => storeRecipeLinkNavigation(slug, window.location.pathname)}
    >
      {linkText}
    </Link>
  )
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildRecipeLinkMatcher(
  knownRecipes: Array<{ title: string; slug: string }>
): RecipeLinkMatcher {
  const titleToSlug = new Map<string, string>()
  const knownTitles = knownRecipes
    .map((knownRecipe) => {
      const trimmedTitle = knownRecipe.title.trim()

      if (trimmedTitle) {
        titleToSlug.set(trimmedTitle.toLowerCase(), knownRecipe.slug)
      }

      return trimmedTitle
    })
    .filter(Boolean)
    .sort((left, right) => right.length - left.length)

  if (knownTitles.length === 0) {
    return {
      titleToSlug,
      directionPattern: null
    }
  }

  return {
    titleToSlug,
    directionPattern: new RegExp(
      `(${knownTitles.map((title) => escapeRegExp(title)).join('|')})(\\s*)\\((see recipe)\\)`,
      'gi'
    )
  }
}

function resolveRecipeSlug(recipeName: string, titleToSlug: Map<string, string>): string {
  const canonicalSlug = titleToSlug.get(recipeName.toLowerCase().trim())
  return canonicalSlug ?? recipeNameToSlug(recipeName)
}

// Helper function to strip measurements from ingredient text to get the recipe name
function extractRecipeName(ingredientText: string): { ingredientPart: string; recipeName: string } {
  // Pattern to match common measurements at the start of ingredient text
  // Matches: "2 tbsp", "1/2 cup", "100g", "2-3 tsp", "1 heaped tbsp", etc.
  const measurementPattern = /^([\d½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]+[\d\/\-–]*\s*(?:heaped|level|large|small|medium)?\s*(?:tbsp|tsp|tablespoons?|tsps?|cups?|g(?![a-z])|kg|ml|l(?![a-z])|oz|lb|pounds?|bunch|bunches|cloves?|slices?|pieces?|sprigs?|handfuls?|pinch(?:es)?|dash(?:es)?|drops?|sheets?|sticks?|strips?|wedges?|portions?|servings?|tins?|cans?|jars?|heads?|stalks?|leaves|florets?|ears?)?\s*(?:of\s+)?)/i

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
// Matches "(see recipe)" and "(optional, see recipe)" (with or without comma/space variants)
function renderIngredientWithLinks(ingredient: string, titleToSlug: Map<string, string>): React.ReactNode {
  const seeRecipePattern = /^(.+?)\s*\((optional,?\s*)?see recipe\)$/i
  const match = ingredient.match(seeRecipePattern)

  if (match) {
    const fullText = match[1].trim()
    const isOptional = !!match[2]
    const { ingredientPart, recipeName } = extractRecipeName(fullText)
    const slug = resolveRecipeSlug(recipeName, titleToSlug)

    return (
      <React.Fragment>
        {ingredientPart && `${ingredientPart} `}{recipeName} (
        {isOptional && 'optional, '}{renderRecipeLink(slug, 'see recipe')}
        )
      </React.Fragment>
    )
  }

  return ingredient
}

function renderDirectionWithLinks(
  direction: string,
  matcher: RecipeLinkMatcher
): React.ReactNode {
  if (!matcher.directionPattern) {
    return direction
  }
  const directionPattern = new RegExp(matcher.directionPattern.source, matcher.directionPattern.flags)
  const nodes: React.ReactNode[] = []
  let cursor = 0
  let match: RegExpExecArray | null

  while ((match = directionPattern.exec(direction)) !== null) {
    const markerStart = match.index
    const matchedTitle = match[1]
    const spacing = match[2]
    const linkText = match[3]
    const slug = matcher.titleToSlug.get(matchedTitle.toLowerCase())

    if (!slug) {
      continue
    }

    if (markerStart > cursor) {
      nodes.push(direction.slice(cursor, markerStart))
    }

    nodes.push(matchedTitle)
    nodes.push(spacing)
    nodes.push('(')
    nodes.push(renderRecipeLink(slug, linkText))
    nodes.push(')')
    cursor = markerStart + match[0].length
  }

  if (cursor === 0) {
    return direction
  }

  const remainingText = direction.slice(cursor)
  if (remainingText) {
    nodes.push(remainingText)
  }

  return nodes.map((node, index) => <React.Fragment key={index}>{node}</React.Fragment>)
}

export default function RecipeLayout({ recipe, knownRecipes = [], blurDataURL, children }: RecipeLayoutProps) {
  const [useFallback, setUseFallback] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const recipeLinkMatcher = useMemo(() => buildRecipeLinkMatcher(knownRecipes), [knownRecipes])

  // Use backup URL if primary fails
  const imageUrl = useFallback
    ? getBackupImageUrl(recipe.featured_image)
    : recipe.featured_image

  // Show placeholder while fallback is loading, but only if we do not already
  // have a blur preview.
  const showPlaceholder = !blurDataURL && useFallback && !imageLoaded && !imageError
  // Hide the Image element while loading fallback so alt text doesn't show over the blur
  const hideImage = useFallback && !imageLoaded && !imageError

  const handleImageError = () => {
    if (!useFallback) {
      // Try backup URL first
      setUseFallback(true)
      setImageLoaded(false)
    } else if (!blurDataURL) {
      // Backup also failed; show placeholder only if there is no blur.
      setImageError(true)
    }
  }

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  const handleBack = () => {
    navigateToStoredBackDestination(window.location.pathname)
  }

  return (
    <article className="post mx-auto max-w-[760px] py-6 md:py-8">
      {recipe.draft && (
        <div className="mb-8 border-l-4 border-yellow-500 bg-yellow-100 p-4 text-yellow-700">
          <p className="font-bold">Draft Mode</p>
          <p className="text-sm">This recipe is not yet published.</p>
        </div>
      )}

      <div className="mb-4">
        <button
          onClick={handleBack}
          className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold !no-underline transition-colors hover:bg-[var(--surface)] hover:!no-underline focus:!no-underline active:!no-underline focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          style={{ color: 'var(--accent)' }}
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

      <header className="mb-8 grid grid-cols-1 gap-5 text-center md:mb-10 md:gap-6">
        <h1 className="block font-body !text-[clamp(1.7rem,3.6vw,2.35rem)] font-bold !leading-tight text-gray-800 dark:text-white">{recipe.title}</h1>
        <div className="flex flex-wrap justify-center gap-3">
          {recipe.categories.map((category) => (
            <button
              key={category}
              onClick={() => {
                const categorySlug = category.toLowerCase()
                storeCategoryEntryNavigation(`/category/${categorySlug}`, window.location.pathname)
                window.location.href = `/category/${categorySlug}`
              }}
              className="inline-flex min-h-11 items-center rounded-full bg-[var(--surface)] px-4 py-2 text-sm font-medium capitalize text-gray-600 transition-colors hover:bg-[var(--accent)] hover:text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)] dark:text-gray-300"
            >
              {category}
            </button>
          ))}
        </div>
      </header>

      <div
        className="image relative mb-10 overflow-hidden rounded-xl"
        style={blurDataURL ? {
          backgroundImage: `url(${blurDataURL})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : undefined}
      >
        {imageError ? (
          <RecipePlaceholder
            title={recipe.title}
            className="w-full rounded-xl"
            style={{ height: '400px' }}
          />
        ) : (
          <>
            {/* Show placeholder only when no blur is available. */}
            {showPlaceholder && (
              <RecipePlaceholder
                title={recipe.title}
                className="absolute inset-0 z-10 w-full rounded-xl"
                style={{ height: '400px' }}
              />
            )}
            <Image
              src={imageUrl}
              alt={recipe.title}
              width={1200}
              height={800}
              className={`h-auto w-full rounded-xl transition-opacity duration-300 ${showPlaceholder || hideImage ? 'opacity-0' : 'opacity-100'}`}
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
        <div className="recipe-body prose prose-lg mb-10 max-w-none leading-relaxed">
          {children}
        </div>
      )}

      <div className="recipe-contents grid gap-12 border-t border-[var(--border)] pt-10 md:grid-cols-2">
        <div className="ingredients">
          <div className="mb-6 grid grid-cols-1 gap-5">
            <div className="flex min-h-11 items-center">
              <h2 className="block !text-[1.25rem] !leading-tight font-semibold md:!text-[1.375rem] dark:text-white">Ingredients</h2>
            </div>

            <div className="recipe-overview flex items-center gap-2">
              <svg
                className="w-4 h-4"
                style={{ color: 'var(--accent)' }}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8.1 13.34l2.83-2.83L3.91 3.5c-1.56 1.56-1.56 4.09 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z" />
              </svg>
              <span className="text-gray-700 dark:text-gray-300">{recipe.servings}</span>
            </div>
          </div>

          <ul className="space-y-3">
            {recipe.ingredients.map((rawIngredient, index) => {
              // Coerce to string in case YAML parsed an object (e.g. trailing colon)
              const ingredient = typeof rawIngredient === 'string'
                ? rawIngredient
                : typeof rawIngredient === 'object' && rawIngredient !== null
                  ? Object.keys(rawIngredient)[0] || ''
                  : String(rawIngredient)
              // Check if this is a section header using markdown-style syntax (## Header)
              const sectionMatch = ingredient.match(/^##\s+(.+)$/)

              if (sectionMatch) {
                const headerText = sectionMatch[1].trim()
                return (
                  <li key={index} className="mb-2 mt-6">
                    <h3 className="font-semibold text-lg" style={{ color: 'var(--accent)' }}>
                      {headerText}
                    </h3>
                  </li>
                )
              }

              return (
                <li key={index} className="flex items-start gap-2">
                  <span style={{ color: 'var(--accent)' }}>•</span>
                  <span>{renderIngredientWithLinks(ingredient, recipeLinkMatcher.titleToSlug)}</span>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="directions">
          <div className="mb-6 grid grid-cols-1 gap-5">
            <div className="flex min-h-11 items-center justify-between gap-4">
              <h2 className="!text-[1.25rem] !leading-tight font-semibold md:!text-[1.375rem] dark:text-white">Directions</h2>
              <RecipeMode />
            </div>
          </div>
          <ol className="-mt-2 space-y-5">
            {recipe.directions.map((direction, index) => (
              <li key={index} className="flex gap-3">
                <span className="font-bold flex-shrink-0" style={{ color: 'var(--accent)' }}>
                  {index + 1}.{' '}
                </span>
                <span>{renderDirectionWithLinks(direction, recipeLinkMatcher)}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <RecipeFooter />
    </article>
  )
}
