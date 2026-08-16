'use client'

import { useState, useMemo, useCallback, useTransition, useEffect, useDeferredValue, useRef } from 'react'
import { RecipeCard, RecipeSearchDocument } from '@/types/recipe'
import SearchBar from '@/components/SearchBar'
import CategoryIndex from './CategoryIndex'
import RecipesByCategory from './RecipesByCategory'
import RecipeGrid from './RecipeGrid'
import { formatRecipeCount } from '@/lib/homepage-layout'
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
  const categories = useMemo(() => Object.keys(recipesByCategory).sort(), [recipesByCategory])
  const resultCount = filteredRecipes?.length || 0

  return (
    <div className={showingSearch
      ? 'mx-auto max-w-[960px]'
      : 'lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:items-start lg:gap-12'}
    >
      {!showingSearch && <CategoryIndex categories={categories} layout="desktop" />}

      <main className="min-w-0">
        <div className={`${showingSearch ? 'mb-2 [&_.search-bar]:mb-6' : 'mb-8 [&_.search-bar]:mb-0'} [&_.search-bar>div]:max-w-none`}>
          <p className="mb-3 hidden px-1 text-xs font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 lg:block">
            Search
          </p>
          <SearchBar
            onSearch={handleSearch}
            placeholder="Find a recipe..."
            initialQuery={searchQuery}
          />
        </div>

        {!showingSearch && <CategoryIndex categories={categories} layout="mobile" />}

        {showingSearch ? (
          <section aria-labelledby="homepage-search-results" className="pt-2 [&_.recipes]:lg:grid-cols-2">
            <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 border-b border-[var(--border)] pb-4">
              <h2
                id="homepage-search-results"
                className="font-display text-[clamp(1.9rem,4vw,2.65rem)] font-bold leading-none text-[var(--accent)]"
              >
                Search results
              </h2>
              <p className="shrink-0 whitespace-nowrap text-right text-sm text-gray-600 dark:text-gray-400">
                {formatRecipeCount(resultCount)}
              </p>
            </div>

            {showingResults && filteredRecipes.length > 0 ? (
              <RecipeGrid recipes={filteredRecipes} />
            ) : (
              <div className="py-12 text-center">
                <p className="mb-2 text-lg text-gray-500">No recipes found</p>
                <p className="text-sm text-gray-400">
                  Try searching with different keywords or browse the categories.
                </p>
              </div>
            )}
          </section>
        ) : (
          <RecipesByCategory recipesByCategory={recipesByCategory} />
        )}
      </main>
    </div>
  )
}
