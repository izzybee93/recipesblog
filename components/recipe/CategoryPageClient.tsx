'use client'

import { useState, useMemo, useCallback, useTransition, useEffect, useDeferredValue, useRef } from 'react'
import { RecipeCard, RecipeSearchDocument } from '@/types/recipe'
import SearchBar from '@/components/SearchBar'
import RecipeGrid from './RecipeGrid'
import { capitalize, matchRecipeSearchDocuments, normalizeSearchText } from '@/lib/search'
import { getInitialSearchQuery, persistSearchQuery } from '@/lib/search-state'
import { navigateToStoredBackDestination } from '@/lib/navigation-actions'
import {
  clearSavedScrollPosition,
  consumeRestoreScroll,
  getSavedScrollPosition,
} from '@/lib/scroll-state'

interface CategoryPageClientProps {
  recipes: RecipeCard[]
  searchDocuments: RecipeSearchDocument[]
  category: string
}

export default function CategoryPageClient({ recipes, searchDocuments, category }: CategoryPageClientProps) {
  // Only restore search query on back/forward navigation, not explicit clicks
  const [searchQuery, setSearchQuery] = useState(() => getInitialSearchQuery(`/category/${category}`))
  const [, startTransition] = useTransition()
  const deferredSearchQuery = useDeferredValue(searchQuery)
  const queryCacheRef = useRef(new Map<string, string[]>())
  const previousQueryRef = useRef('')
  const previousResultSlugsRef = useRef<string[] | null>(null)

  // Save search query to sessionStorage whenever it changes
  useEffect(() => {
    const path = `/category/${category}`
    persistSearchQuery(path, searchQuery)
  }, [searchQuery, category])

  // Scroll restoration on mount - only when navigating back
  useEffect(() => {
    const path = `/category/${category}`
    const shouldRestore = consumeRestoreScroll(path)

    if (shouldRestore) {
      // Navigating back - restore scroll position if available
      const savedPosition = getSavedScrollPosition(path)
      if (savedPosition !== null) {
        const restoreScrollPosition = () => {
          const maxScroll = document.documentElement.scrollHeight - window.innerHeight

          if (maxScroll >= savedPosition * 0.9 || maxScroll === 0) {
            window.scrollTo(0, savedPosition)
            clearSavedScrollPosition(path)
          } else {
            setTimeout(restoreScrollPosition, 100)
          }
        }

        setTimeout(restoreScrollPosition, 100)
      }
    } else {
      // Navigating forward - start at top
      window.scrollTo(0, 0)
    }
  }, [category])

  // Check if we should show search results (2+ characters)
  const shouldSearch = searchQuery.trim().length >= 2

  const recipeMap = useMemo(() => {
    return new Map(recipes.map((recipe) => [recipe.slug, recipe]))
  }, [recipes])

  // Mirror homepage search behavior: keep exhaustive results, but reuse
  // narrowed cached result sets as the query extends. Title/category matches
  // still rank ahead of body matches.
  const filteredRecipes = useMemo(() => {
    if (!shouldSearch) {
      previousQueryRef.current = ''
      previousResultSlugsRef.current = null
      return recipes
    }

    const normalizedDeferredQuery = normalizeSearchText(deferredSearchQuery)
    const cachedSlugs = queryCacheRef.current.get(normalizedDeferredQuery)

    if (cachedSlugs) {
      previousQueryRef.current = normalizedDeferredQuery
      previousResultSlugsRef.current = cachedSlugs

      return cachedSlugs
        .map((slug) => recipeMap.get(slug))
        .filter((recipe): recipe is RecipeCard => Boolean(recipe))
    }

    const candidateSlugs =
      previousResultSlugsRef.current &&
      previousQueryRef.current &&
      normalizedDeferredQuery.startsWith(previousQueryRef.current)
        ? new Set(previousResultSlugsRef.current)
        : undefined

    const matches = matchRecipeSearchDocuments(searchDocuments, normalizedDeferredQuery, {
      candidateSlugs,
      includeBodyMatches: true,
    })

    const finalSlugs = [...matches.primarySlugs, ...matches.bodySlugs]

    queryCacheRef.current.set(normalizedDeferredQuery, finalSlugs)
    previousQueryRef.current = normalizedDeferredQuery
    previousResultSlugsRef.current = finalSlugs

    return finalSlugs
      .map((slug) => recipeMap.get(slug))
      .filter((recipe): recipe is RecipeCard => Boolean(recipe))
  }, [deferredSearchQuery, recipeMap, recipes, searchDocuments, shouldSearch])

  // Memoize the search handler with transition for non-blocking updates
  const handleSearch = useCallback((query: string) => {
    if (query === '') {
      setSearchQuery('')
    } else {
      startTransition(() => setSearchQuery(query))
    }
  }, [])

  const handleBack = () => {
    navigateToStoredBackDestination(`/category/${category}`)
  }

  const displayRecipes = shouldSearch ? filteredRecipes : recipes
  const categoryName = capitalize(category)

  return (
    <div className="mx-auto py-6 md:py-8">
      {/* Back button */}
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

      {/* Category header */}
      <header className="mb-10 text-center">
        <h1
          className="font-display mb-4 font-bold text-[clamp(2.5rem,7vw,4rem)] leading-none"
          style={{
            color: 'var(--accent)'
          }}
        >
          {categoryName}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
        </p>
      </header>

      {/* Search bar */}
      <SearchBar
        placeholder={`Search ${categoryName.toLowerCase()} recipes...`}
        onSearch={handleSearch}
        initialQuery={searchQuery}
      />

      {/* Search results count (only when searching) */}
      {shouldSearch && (
        <div className="mb-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''} found
          </p>
        </div>
      )}

      {/* Recipe grid or no results message */}
      {displayRecipes.length > 0 ? (
        <RecipeGrid recipes={displayRecipes} />
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-2">No recipes found</p>
          <p className="text-gray-400 text-sm">
            Try searching with different keywords.
          </p>
        </div>
      )}
    </div>
  )
}
