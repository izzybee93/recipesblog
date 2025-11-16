'use client'

import { useState, useMemo, useCallback, useTransition } from 'react'
import { Recipe } from '@/types/recipe'
import SearchBar from '@/components/SearchBar'
import RecipesByCategory from './RecipesByCategory'
import RecipeGrid from './RecipeGrid'

interface SearchableRecipesProps {
  recipesByCategory: Record<string, Recipe[]>
}

// Helper function to remove diacritics from a string
function removeDiacritics(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export default function SearchableRecipes({ recipesByCategory }: SearchableRecipesProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isPending, startTransition] = useTransition()

  // Get all recipes in a flat array for searching - memoized independently
  const allRecipes = useMemo(() => {
    const recipes: Recipe[] = []
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

  // Check if we should show search results
  const shouldSearch = searchQuery.trim().length >= 2

  // Filter recipes based on search query
  const filteredRecipes = useMemo(() => {
    if (!shouldSearch) {
      return null
    }

    const query = removeDiacritics(searchQuery.trim().toLowerCase())
    return allRecipes.filter(recipe => {
      // Search title first (most common search)
      if (removeDiacritics(recipe.title.toLowerCase()).includes(query)) return true

      // Then check categories
      if (recipe.categories.some(cat => removeDiacritics(cat.toLowerCase()).includes(query))) return true

      // Only search ingredients/directions if needed (more expensive)
      if (recipe.ingredients.some(ingredient => removeDiacritics(ingredient.toLowerCase()).includes(query))) return true
      if (recipe.directions.some(direction => removeDiacritics(direction.toLowerCase()).includes(query))) return true

      return false
    })
  }, [allRecipes, searchQuery, shouldSearch])

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
      />

      {showingSearch ? (
        <div>
          <div className="mb-6 text-center">
            <h2 
              className="text-2xl font-bold"
              style={{ 
                fontFamily: 'SimplySweetSerif, serif',
                color: 'rgb(140, 190, 175)'
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