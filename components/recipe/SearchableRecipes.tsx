'use client'

import { useState, useMemo, useCallback, useTransition, useEffect, useDeferredValue, useRef } from 'react'
import { RecipeCard, RecipeSearchDocument } from '@/types/recipe'
import SearchBar from '@/components/SearchBar'
import RecipesByCategory from './RecipesByCategory'
import RecipeGrid from './RecipeGrid'
import { matchRecipeSearchDocuments, normalizeSearchText } from '@/lib/search'
import { getInitialSearchQuery, persistSearchQuery } from '@/lib/search-state'

interface SearchableRecipesProps {
  recipesByCategory: Record<string, RecipeCard[]>
  searchDocuments: RecipeSearchDocument[]
}

export default function SearchableRecipes({ recipesByCategory, searchDocuments }: SearchableRecipesProps) {
  // Only restore search query on back/forward navigation, not explicit clicks
  const [searchQuery, setSearchQuery] = useState(() => getInitialSearchQuery('/'))
  const [, startTransition] = useTransition()
  const deferredSearchQuery = useDeferredValue(searchQuery)
  const queryCacheRef = useRef(new Map<string, string[]>())
  const previousQueryRef = useRef('')
  const previousResultSlugsRef = useRef<string[] | null>(null)

  // Save search query to sessionStorage whenever it changes
  useEffect(() => {
    persistSearchQuery('/', searchQuery)
  }, [searchQuery])

  // Get all recipes in a flat array for searching - memoized independently
  const allRecipes = useMemo(() => {
    const recipes: RecipeCard[] = []
    Object.values(recipesByCategory).forEach(categoryRecipes => {
      categoryRecipes.forEach(recipe => {
        // Avoid duplicates (recipes that appear in multiple categories)
        if (!recipes.find(r => r.slug === recipe.slug)) {
          recipes.push(recipe)
        }
      })
    })
    return recipes.sort((a, b) => a.title.localeCompare(b.title))
  }, [recipesByCategory])

  const recipeMap = useMemo(() => {
    return new Map(allRecipes.map((recipe) => [recipe.slug, recipe]))
  }, [allRecipes])

  // Check if we should show search results
  const shouldSearch = searchQuery.trim().length >= 2

  // Cache normalized queries and narrow candidates when a query extends the
  // previous one. Results remain exhaustive: title/category matches stay first,
  // but body matches are still included so narrowing remains safe.
  const filteredRecipes = useMemo(() => {
    if (!shouldSearch) {
      previousQueryRef.current = ''
      previousResultSlugsRef.current = null
      return null
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
  }, [deferredSearchQuery, recipeMap, searchDocuments, shouldSearch])

  // Memoize the search handler with transition for non-blocking updates
  const handleSearch = useCallback((query: string) => {
    // For clearing (empty query), update immediately
    if (query === '') {
      setSearchQuery('')
    } else {
      // For typing, use transition to keep UI responsive
      startTransition(() => {
        setSearchQuery(query)
      })
    }
  }, [])

  // Determine what to render - only show search UI for 2+ characters
  const showingSearch = searchQuery.trim().length >= 2
  const showingResults = shouldSearch && filteredRecipes !== null

  return (
    <div>
      <SearchBar
        onSearch={handleSearch}
        placeholder="Search recipes..."
        initialQuery={searchQuery}
      />

      {showingSearch ? (
        <div>
          <div className="mb-8 text-center">
            <h2 
              className="font-display text-[clamp(2rem,5vw,3.25rem)] font-bold leading-none"
              style={{ 
                color: 'var(--accent)'
              }}
            >
              Search Results
            </h2>
            <p className="text-gray-600 mt-2">
              {filteredRecipes?.length || 0} recipe{(filteredRecipes?.length || 0) !== 1 ? 's' : ''} found
            </p>
          </div>

          {showingResults && filteredRecipes.length > 0 ? (
            <RecipeGrid recipes={filteredRecipes} />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-2">No recipes found</p>
              <p className="text-gray-400 text-sm">
                Try searching with different keywords or browse all categories below.
              </p>
            </div>
          )}
        </div>
      ) : (
        <RecipesByCategory recipesByCategory={recipesByCategory} />
      )}
    </div>
  )
}
