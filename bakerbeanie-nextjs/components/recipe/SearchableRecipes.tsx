'use client'

import { useState, useMemo } from 'react'
import { Recipe } from '@/types/recipe'
import SearchBar from '@/components/SearchBar'
import RecipesByCategory from './RecipesByCategory'
import RecipeGrid from './RecipeGrid'

interface SearchableRecipesProps {
  recipesByCategory: Record<string, Recipe[]>
}

export default function SearchableRecipes({ recipesByCategory }: SearchableRecipesProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Get all recipes in a flat array for searching
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

  // Filter recipes based on search query
  const filteredRecipes = useMemo(() => {
    if (!searchQuery.trim()) {
      return null // Return null to show categorized view
    }

    const query = searchQuery.toLowerCase()
    return allRecipes.filter(recipe => {
      return (
        recipe.title.toLowerCase().includes(query) ||
        recipe.categories.some(cat => cat.toLowerCase().includes(query)) ||
        recipe.ingredients.some(ingredient => ingredient.toLowerCase().includes(query)) ||
        recipe.directions.some(direction => direction.toLowerCase().includes(query))
      )
    })
  }, [allRecipes, searchQuery])

  // Filter categories based on search query
  const filteredRecipesByCategory = useMemo(() => {
    if (!searchQuery.trim()) {
      return recipesByCategory
    }

    const filtered: Record<string, Recipe[]> = {}
    Object.entries(recipesByCategory).forEach(([category, recipes]) => {
      const matchingRecipes = recipes.filter(recipe => {
        const query = searchQuery.toLowerCase()
        return (
          recipe.title.toLowerCase().includes(query) ||
          recipe.categories.some(cat => cat.toLowerCase().includes(query)) ||
          recipe.ingredients.some(ingredient => ingredient.toLowerCase().includes(query)) ||
          recipe.directions.some(direction => direction.toLowerCase().includes(query))
        )
      })
      if (matchingRecipes.length > 0) {
        filtered[category] = matchingRecipes
      }
    })
    return filtered
  }, [recipesByCategory, searchQuery])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  return (
    <div>
      <SearchBar 
        onSearch={handleSearch}
        placeholder="Search recipes..."
      />

      {searchQuery.trim() ? (
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

          {filteredRecipes && filteredRecipes.length > 0 ? (
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