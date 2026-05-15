'use client'

import { useState, useMemo, useCallback, useTransition, useEffect } from 'react'
import { RecipeCard, RecipeSearchDocument } from '@/types/recipe'
import SearchBar from '@/components/SearchBar'
import RecipesByCategory from './RecipesByCategory'
import RecipeGrid from './RecipeGrid'
import { normalizeSearchText } from '@/lib/search'

interface SearchableRecipesProps {
  recipesByCategory: Record<string, RecipeCard[]>
  searchDocuments: RecipeSearchDocument[]
}

export default function SearchableRecipes({ recipesByCategory, searchDocuments }: SearchableRecipesProps) {
  // Only restore search query on back/forward navigation, not explicit clicks
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window === 'undefined') return ''
    const isBack = sessionStorage.getItem('isBackNavigation') || sessionStorage.getItem('restoreScroll-/')
    sessionStorage.removeItem('isBackNavigation')
    if (isBack) {
      return sessionStorage.getItem('search-query-/') || ''
    }
    sessionStorage.removeItem('search-query-/')
    return ''
  })
  const [isPending, startTransition] = useTransition()

  // Save search query to sessionStorage whenever it changes
  useEffect(() => {
    if (searchQuery) {
      sessionStorage.setItem('search-query-/', searchQuery)
    } else {
      sessionStorage.removeItem('search-query-/')
    }
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

  // Filter recipes based on search query
  const filteredRecipes = useMemo(() => {
    if (!shouldSearch) {
      return null
    }

    const query = normalizeSearchText(searchQuery)
    return searchDocuments
      .filter((document) => {
        if (document.titleText.includes(query)) return true
        if (document.categoryText.includes(query)) return true
        return document.bodyText.includes(query)
      })
      .map((document) => recipeMap.get(document.slug))
      .filter((recipe): recipe is RecipeCard => Boolean(recipe))
  }, [recipeMap, searchDocuments, searchQuery, shouldSearch])

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
          <div className="mb-6 text-center">
            <h2 
              className="font-display text-2xl font-bold"
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
