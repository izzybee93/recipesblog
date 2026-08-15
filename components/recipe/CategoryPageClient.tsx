'use client'

import { useState, useMemo, useCallback, useTransition, useEffect, useDeferredValue, useRef } from 'react'
import { RecipeCard, RecipeSearchDocument } from '@/types/recipe'
import SearchBar from '@/components/SearchBar'
import CategoryPageLayout from './CategoryPageLayout'
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
  dailyPicks: RecipeCard[]
  searchDocuments: RecipeSearchDocument[]
  category: string
}

export default function CategoryPageClient({ recipes, dailyPicks, searchDocuments, category }: CategoryPageClientProps) {
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
    <CategoryPageLayout
      recipes={recipes}
      dailyPicks={dailyPicks}
      displayRecipes={displayRecipes}
      categoryName={categoryName}
      shouldSearch={shouldSearch}
      onBack={handleBack}
      search={(
        <SearchBar
          placeholder={`Search ${categoryName.toLowerCase()} recipes...`}
          onSearch={handleSearch}
          initialQuery={searchQuery}
        />
      )}
    />
  )
}
