import { memo, useState, useEffect, startTransition } from 'react'
import Link from 'next/link'
import { RecipeCard } from '@/types/recipe'
import RecipeGrid from './RecipeGrid'
import CategoryIndex from './CategoryIndex'
import { capitalize, shuffleByDate } from '@/lib/search'
import { storeCategoryEntryNavigation } from '@/lib/navigation-actions'
import {
  clearSavedScrollPosition,
  consumeRestoreScroll,
  getSavedScrollPosition,
} from '@/lib/scroll-state'

interface RecipesByCategoryProps {
  recipesByCategory: Record<string, RecipeCard[]>
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

  // Restore scroll position when returning to homepage - only on back navigation
  useEffect(() => {
    const shouldRestore = consumeRestoreScroll('/')

    if (shouldRestore) {
      const savedPosition = getSavedScrollPosition('/')
      if (savedPosition !== null) {
        // Wait for content to render before scrolling
        setTimeout(() => {
          window.scrollTo(0, savedPosition)
          clearSavedScrollPosition('/')
        }, 100)
      }
    }
  }, [visibleCategories])

  // Save scroll position and navigation history when clicking "View all"
  const handleViewAllClick = (category: string) => {
    storeCategoryEntryNavigation(`/category/${category}`, '/', window.scrollY)
  }

  // Maximum recipes to show per category on homepage
  const RECIPES_PER_CATEGORY = 5

  return (
    <div className="lg:flex lg:items-start lg:gap-12">
      <CategoryIndex categories={categories} />

      <div className="lg:flex-1 lg:min-w-0">
        <div className="space-y-16 md:space-y-24">
          {categories.slice(0, visibleCategories).map(category => {
            const categoryRecipes = recipesByCategory[category]
            const shuffledRecipes = shuffleByDate(categoryRecipes)
            const displayedRecipes = shuffledRecipes.slice(0, RECIPES_PER_CATEGORY)
            const hasMore = categoryRecipes.length > RECIPES_PER_CATEGORY

            return (
              <section
                key={category}
                id={`category-${category}`}
                className="category-section mx-auto scroll-mt-8"
              >
                <div className="mb-6 flex items-end justify-between gap-6 border-b border-[var(--border)] pb-4">
                  <h2
                    className="font-display text-left font-bold text-[clamp(2.1rem,5vw,3.4rem)] leading-none"
                    style={{
                      color: 'var(--accent)'
                    }}
                  >
                    {capitalize(category)}
                  </h2>
                  {hasMore && (
                    <Link
                      href={`/category/${category}`}
                      className="shrink-0 rounded-full px-3 py-2 text-sm font-semibold !no-underline transition-colors hover:bg-[var(--surface)] hover:!no-underline focus:!no-underline active:!no-underline focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      style={{ color: 'var(--accent)' }}
                      onClick={() => handleViewAllClick(category)}
                    >
                      View all
                    </Link>
                  )}
                </div>
                <RecipeGrid recipes={displayedRecipes} featuredFirst />
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
})

export default RecipesByCategory
