'use client'

import { useState, useMemo, useCallback, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Recipe } from '@/types/recipe'
import SearchBar from '@/components/SearchBar'
import RecipeGrid from './RecipeGrid'
import { removeDiacritics, capitalize } from '@/lib/search'

interface CategoryPageClientProps {
  recipes: Recipe[]
  category: string
}

export default function CategoryPageClient({ recipes, category }: CategoryPageClientProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [, startTransition] = useTransition()

  // Scroll restoration on mount - only when navigating back
  useEffect(() => {
    const path = `/category/${category}`
    const shouldRestore = sessionStorage.getItem(`restoreScroll-${path}`)

    if (shouldRestore) {
      // Navigating back - restore scroll position if available
      const savedPosition = sessionStorage.getItem(`scroll-position-${path}`)
      if (savedPosition) {
        window.scrollTo(0, parseInt(savedPosition))
        sessionStorage.removeItem(`scroll-position-${path}`)
      }
      sessionStorage.removeItem(`restoreScroll-${path}`)
    } else {
      // Navigating forward - start at top
      window.scrollTo(0, 0)
    }
  }, [category])

  // Check if we should show search results (2+ characters)
  const shouldSearch = searchQuery.trim().length >= 2

  // Filter recipes based on search query
  const filteredRecipes = useMemo(() => {
    if (!shouldSearch) return recipes

    const query = removeDiacritics(searchQuery.trim().toLowerCase())
    return recipes.filter(recipe => {
      // Search title first
      if (removeDiacritics(recipe.title.toLowerCase()).includes(query)) return true
      // Search ingredients
      if (recipe.ingredients.some(i => removeDiacritics(i.toLowerCase()).includes(query))) return true
      // Search directions
      if (recipe.directions.some(d => removeDiacritics(d.toLowerCase()).includes(query))) return true
      return false
    })
  }, [recipes, searchQuery, shouldSearch])

  // Memoize the search handler with transition for non-blocking updates
  const handleSearch = useCallback((query: string) => {
    if (query === '') {
      setSearchQuery('')
    } else {
      startTransition(() => setSearchQuery(query))
    }
  }, [])

  const handleBack = () => {
    // Get stored navigation history for THIS page
    const currentPath = `/category/${category}`
    const navHistory = sessionStorage.getItem(`navigationHistory-${currentPath}`)

    // If we have a valid stored path, use it; otherwise go to homepage
    if (navHistory && navHistory.startsWith('/')) {
      // Set flag to restore scroll position on the destination page
      sessionStorage.setItem(`restoreScroll-${navHistory}`, 'true')
      window.location.href = navHistory
    } else {
      sessionStorage.setItem('restoreScroll-/', 'true')
      window.location.href = '/'
    }
  }

  const displayRecipes = shouldSearch ? filteredRecipes : recipes
  const categoryName = capitalize(category)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Back button */}
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

      {/* Category header */}
      <header className="text-center mb-8">
        <h1
          className="font-bold mb-4"
          style={{
            fontFamily: 'SimplySweetSerif, serif',
            color: 'rgb(140, 190, 175)',
            fontSize: '4rem'
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
