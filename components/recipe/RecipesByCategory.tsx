import { memo, useState, useEffect, startTransition } from 'react'
import Link from 'next/link'
import { RecipeCard } from '@/types/recipe'
import RecipeGrid from './RecipeGrid'
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
    <div className="space-y-14 md:space-y-18">
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
            <div className="mb-5 flex items-end justify-between gap-4 border-b border-[var(--border)] pb-3">
              <h2
                className="font-display text-left font-bold text-[clamp(2rem,4.5vw,3rem)] leading-none"
                style={{
                  color: 'var(--accent)'
                }}
              >
                {capitalize(category)}
              </h2>
              {hasMore && (
                <Link
                  href={`/category/${category}`}
                  className="shrink-0 rounded-full px-3 py-2 text-sm font-semibold !text-[var(--accent)] !no-underline transition-colors hover:bg-[var(--surface)] hover:!text-[var(--accent-strong)] hover:!no-underline focus:!no-underline active:!no-underline focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
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
  )
})

export default RecipesByCategory
