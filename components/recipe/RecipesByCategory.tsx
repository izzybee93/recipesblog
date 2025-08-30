import { memo, useState, useEffect } from 'react'
import { Recipe } from '@/types/recipe'
import RecipeGrid from './RecipeGrid'
import CategoryIndex from './CategoryIndex'

interface RecipesByCategoryProps {
  recipesByCategory: Record<string, Recipe[]>
}

const RecipesByCategory = memo(function RecipesByCategory({ recipesByCategory }: RecipesByCategoryProps) {
  const categories = Object.keys(recipesByCategory).sort()
  const [visibleCategories, setVisibleCategories] = useState(2) // Start with only 2 categories
  
  // Load more categories after initial render
  useEffect(() => {
    // Use requestIdleCallback if available, otherwise setTimeout
    const loadMore = () => {
      setVisibleCategories(categories.length)
    }
    
    if ('requestIdleCallback' in window) {
      const id = (window as any).requestIdleCallback(loadMore)
      return () => (window as any).cancelIdleCallback(id)
    } else {
      const timer = setTimeout(loadMore, 100)
      return () => clearTimeout(timer)
    }
  }, [categories.length])

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