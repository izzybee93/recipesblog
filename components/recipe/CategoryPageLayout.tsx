'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ReactNode, useMemo, useState } from 'react'
import { getBackupImageUrl } from '@/lib/blob-image'
import { storeRecipeEntryNavigation } from '@/lib/navigation-actions'
import { RecipeCard } from '@/types/recipe'
import RecipeGrid from './RecipeGrid'
import RecipePlaceholder from './RecipePlaceholder'

interface CategoryPageLayoutProps {
  recipes: RecipeCard[]
  dailyPicks: RecipeCard[]
  displayRecipes: RecipeCard[]
  categoryName: string
  shouldSearch: boolean
  search: ReactNode
  onBack: () => void
}

function rememberRecipe(recipe: RecipeCard) {
  storeRecipeEntryNavigation(recipe.slug, window.location.pathname, window.scrollY)
}

function RecipeFeatureImage({
  recipe,
  sizes,
  priority = false,
}: {
  recipe: RecipeCard
  sizes: string
  priority?: boolean
}) {
  const [useFallback, setUseFallback] = useState(false)
  const [imageError, setImageError] = useState(false)
  const backupUrl = getBackupImageUrl(recipe.featured_image)
  const imageUrl = useFallback ? backupUrl : recipe.featured_image

  if (!imageUrl || imageError) {
    return (
      <div data-recipe-placeholder className="absolute inset-0 h-full w-full">
        <RecipePlaceholder
          title={recipe.title}
          className="h-full w-full"
          style={{ minHeight: '100%' }}
        />
      </div>
    )
  }

  return (
    <Image
      src={imageUrl}
      alt=""
      fill
      priority={priority}
      sizes={sizes}
      className="!rounded-none object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      onError={() => {
        if (!useFallback && backupUrl !== recipe.featured_image) {
          setUseFallback(true)
        } else {
          setImageError(true)
        }
      }}
    />
  )
}

function SearchResults({ recipes }: { recipes: RecipeCard[] }) {
  return (
    <section aria-live="polite">
      <div className="mb-6 flex items-end justify-between gap-4 border-b border-[var(--border)] pb-4">
        <h2 className="font-display text-3xl text-[var(--accent)]">Search results</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {recipes.length} recipe{recipes.length === 1 ? '' : 's'} found
        </p>
      </div>
      {recipes.length > 0 ? (
        <RecipeGrid recipes={recipes} />
      ) : (
        <div className="rounded-3xl bg-[var(--surface)] px-6 py-16 text-center">
          <p className="mb-1 text-lg font-bold">No recipes found</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Try a different ingredient or dish.
          </p>
        </div>
      )}
    </section>
  )
}

export default function CategoryPageLayout({
  recipes,
  dailyPicks,
  displayRecipes,
  categoryName,
  shouldSearch,
  search,
  onBack,
}: CategoryPageLayoutProps) {
  const orderedRecipes = useMemo(
    () => [...recipes].sort((a, b) => a.title.localeCompare(b.title)),
    [recipes],
  )
  const hero = dailyPicks[0]
  const supporting = dailyPicks.slice(1, 3)

  return (
    <div className="py-6 md:py-8">
      <button
        onClick={onBack}
        className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-[var(--accent-strong)] !no-underline transition-colors hover:bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
      >
        <span aria-hidden="true">←</span> Back to Recipes
      </button>

      <header className="my-8 grid items-center gap-6 sm:grid-cols-[1fr_1.15fr]">
        <h1 className="font-display text-[clamp(2.75rem,6vw,4.25rem)] font-bold leading-none text-[var(--accent)]">
          {categoryName}
        </h1>
        <div className="[&_.search-bar]:mb-0 md:pb-1">{search}</div>
      </header>

      {shouldSearch ? (
        <SearchResults recipes={displayRecipes} />
      ) : hero ? (
        <>
          <section className="mb-14" aria-labelledby="todays-picks-heading">
            <div className="mb-6 border-b border-[var(--border)] pb-4">
              <h2
                id="todays-picks-heading"
                className="font-body text-xs font-bold uppercase tracking-[0.22em] text-[var(--accent-strong)]"
              >
                Today&apos;s picks
              </h2>
            </div>

            <div className={`grid gap-5 ${supporting.length > 0 ? 'lg:grid-cols-[1.7fr_1fr]' : ''}`}>
              <Link
                href={`/recipes/${hero.slug}`}
                onClick={() => rememberRecipe(hero)}
                className="group relative min-h-[430px] overflow-hidden rounded-3xl !no-underline sm:min-h-[520px]"
              >
                <RecipeFeatureImage
                  recipe={hero}
                  sizes={supporting.length > 0 ? '(max-width: 1024px) 100vw, 65vw' : '100vw'}
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-9">
                  <h3 className="font-display max-w-2xl text-4xl leading-none sm:text-5xl">
                    {hero.title}
                  </h3>
                </div>
              </Link>

              {supporting.length > 0 && (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
                  {supporting.map((recipe) => (
                    <Link
                      key={recipe.slug}
                      href={`/recipes/${recipe.slug}`}
                      onClick={() => rememberRecipe(recipe)}
                      className="group grid grid-cols-[1.05fr_1fr] overflow-hidden rounded-3xl bg-[var(--surface)] !no-underline lg:grid-cols-1"
                    >
                      <div className="relative min-h-44 lg:min-h-48">
                        <RecipeFeatureImage
                          recipe={recipe}
                          sizes="(max-width: 640px) 50vw, 35vw"
                        />
                      </div>
                      <div className="flex items-center p-5">
                        <h3 className="text-base font-bold leading-snug text-gray-800 transition-colors group-hover:text-[var(--accent-strong)] dark:text-white">
                          {recipe.title}
                        </h3>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section>
            <div className="mb-6 border-b border-[var(--border)] pb-4">
              <h2 className="font-body text-xs font-bold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                All {categoryName.toLowerCase()} recipes
              </h2>
            </div>
            <RecipeGrid recipes={orderedRecipes} />
          </section>
        </>
      ) : (
        <div className="rounded-3xl bg-[var(--surface)] px-6 py-16 text-center">
          <p className="text-lg font-bold">No recipes in this category yet</p>
        </div>
      )}
    </div>
  )
}
