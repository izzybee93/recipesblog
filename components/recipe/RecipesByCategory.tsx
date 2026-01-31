import { memo, useState, useEffect, startTransition } from 'react'
import Link from 'next/link'
import { Recipe } from '@/types/recipe'
import RecipeGrid from './RecipeGrid'
import CategoryIndex from './CategoryIndex'
import { capitalize } from '@/lib/search'

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

  // Restore scroll position when returning to homepage
  useEffect(() => {
    const savedPosition = sessionStorage.getItem('scroll-position-/')
    if (savedPosition) {
      // Wait for content to render before scrolling
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedPosition))
        sessionStorage.removeItem('scroll-position-/')
      }, 100)
      return
    }

    // Handle scroll to category from recipe page
    const targetCategory = sessionStorage.getItem('scroll-to-category')
    if (targetCategory) {
      const scrollToTarget = () => {
        const element = document.getElementById(`category-${targetCategory}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          sessionStorage.removeItem('scroll-to-category')
        } else {
          // Element not ready yet, retry
          setTimeout(scrollToTarget, 100)
        }
      }
      // Wait for content to load
      setTimeout(scrollToTarget, 150)
    }
  }, [visibleCategories])

  // Save scroll position and navigation history when clicking "View all"
  const handleViewAllClick = (category: string) => {
    sessionStorage.setItem('scroll-position-/', window.scrollY.toString())
    sessionStorage.setItem(`navigationHistory-/category/${category}`, '/')
  }

  // Maximum recipes to show per category on homepage
  const RECIPES_PER_CATEGORY = 6

  return (
    <div className="lg:flex lg:gap-8 lg:items-start">
      <CategoryIndex categories={categories} />

      <div className="lg:flex-1 lg:min-w-0">
        <div className="space-y-16">
          {categories.slice(0, visibleCategories).map(category => {
            const categoryRecipes = recipesByCategory[category]
            const displayedRecipes = categoryRecipes.slice(0, RECIPES_PER_CATEGORY)
            const hasMore = categoryRecipes.length > RECIPES_PER_CATEGORY

            return (
              <section
                key={category}
                id={`category-${category}`}
                className="category-section scroll-mt-8 max-w-6xl mx-auto"
              >
                <div className="flex items-baseline justify-between mb-8">
                  <h2
                    className="font-bold text-left"
                    style={{
                      fontFamily: 'SimplySweetSerif, serif',
                      color: 'rgb(140, 190, 175)',
                      fontSize: '4rem'
                    }}
                  >
                    {capitalize(category)}
                  </h2>
                  {hasMore && (
                    <Link
                      href={`/category/${category}`}
                      className="font-medium hover:underline"
                      style={{ color: 'rgb(140, 190, 175)' }}
                      onClick={() => handleViewAllClick(category)}
                    >
                      View all
                    </Link>
                  )}
                </div>
                <RecipeGrid recipes={displayedRecipes} />
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
})

export default RecipesByCategory