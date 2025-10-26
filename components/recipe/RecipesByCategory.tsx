import { memo, useState, useEffect, startTransition } from 'react'
import { Recipe } from '@/types/recipe'
import RecipeGrid from './RecipeGrid'
import CategoryIndex from './CategoryIndex'

interface RecipesByCategoryProps {
  recipesByCategory: Record<string, Recipe[]>
}

const RecipesByCategory = memo(function RecipesByCategory({ recipesByCategory }: RecipesByCategoryProps) {
  const categories = Object.keys(recipesByCategory).sort()

  // Always start with 3 categories for immediate render
  const [visibleCategories, setVisibleCategories] = useState(3)

  // Progressive loading of remaining categories
  useEffect(() => {
    if (visibleCategories >= categories.length) return

    // Load remaining categories aggressively in background
    const loadRemainingCategories = () => {
      startTransition(() => {
        setVisibleCategories(categories.length)
      })
    }

    // Start loading immediately but as a background task
    const timer = setTimeout(loadRemainingCategories, 0)

    return () => clearTimeout(timer)
  }, [categories.length, visibleCategories])

  // Category display names mapping
  const categoryDisplayNames: Record<string, string> = {
    'breakfast': 'Breakfast',
    'mains': 'Mains',
    'treats': 'Treats',
    'salad': 'Salads',
    'snacks': 'Snacks',
    'sauces': 'Sauces',
    'grains': 'Grains',
    'bread': 'Bread'
  }

  return (
    <div className="lg:flex lg:gap-8 lg:items-start">
      <CategoryIndex categories={categories} />

      <div className="lg:flex-1 lg:min-w-0">
        <div className="space-y-16">
          {categories.slice(0, visibleCategories).map(category => (
            <section
              key={category}
              id={`category-${category}`}
              className="category-section scroll-mt-8"
            >
              <h2
                className="font-bold text-left mb-8 capitalize"
                style={{
                  fontFamily: 'SimplySweetSerif, serif',
                  color: 'rgb(140, 190, 175)',
                  fontSize: '4rem'
                }}
              >
                {categoryDisplayNames[category] || category}
              </h2>
              <RecipeGrid recipes={recipesByCategory[category]} />
            </section>
          ))}
        </div>
      </div>
    </div>
  )
})

export default RecipesByCategory