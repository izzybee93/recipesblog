'use client'

import Image from 'next/image'
import Link from 'next/link'
import { RecipeCard } from '@/types/recipe'
import { useState, memo } from 'react'
import RecipePlaceholder from './RecipePlaceholder'
import { getBackupImageUrl } from '@/lib/blob-image'
import { storeRecipeEntryNavigation } from '@/lib/navigation-actions'

interface RecipeGridCardProps {
  recipe: RecipeCard
  featured?: boolean
}

const RecipeGridCard = memo(function RecipeGridCard({ recipe, featured = false }: RecipeGridCardProps) {
  const [useFallback, setUseFallback] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Use backup URL if primary fails
  const imageUrl = useFallback
    ? getBackupImageUrl(recipe.featured_image)
    : recipe.featured_image

  // Show placeholder while fallback is loading
  const showPlaceholder = useFallback && !imageLoaded && !imageError

  const handleImageError = () => {
    if (!useFallback) {
      // Try backup URL first
      setUseFallback(true)
      setImageLoaded(false)
    } else {
      // Backup also failed, show placeholder
      setImageError(true)
    }
  }

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  const handleClick = () => {
    storeRecipeEntryNavigation(recipe.slug, window.location.pathname, window.scrollY)
  }

  // Memoize recipe slug to prevent recalculation
  const recipeUrl = `/recipes/${recipe.slug}`
  const cardClassName = `recipe overflow-hidden rounded-xl bg-white dark:bg-gray-900 ${featured ? 'sm:col-span-2' : ''}`
  const frameClassName = `relative block w-full overflow-hidden rounded-t-xl rounded-b-none aspect-[16/9] sm:aspect-[4/3] ${featured ? 'sm:aspect-[8/3]' : ''}`
  const titleClassName = "flex min-h-16 items-center justify-center bg-[var(--surface)] px-4 py-3 text-center"
  const titleTextClassName = "line-clamp-2 font-body text-sm font-bold leading-snug text-gray-800 no-underline transition-colors duration-150 group-hover:text-[var(--accent)] md:text-base dark:text-white"
  
  if (imageError) {
    return (
      <div className={`${cardClassName} group`}>
        <Link
          href={recipeUrl}
          className="block h-full !no-underline hover:!no-underline focus:!no-underline active:!no-underline"
          onClick={handleClick}
        >
          <div className={frameClassName}>
            <RecipePlaceholder
              title={recipe.title}
              className="h-full w-full"
            />
          </div>
          <div className={titleClassName}>
            <span className={titleTextClassName}>{recipe.title}</span>
            {recipe.draft && (
              <span className="inline-block bg-yellow-500 text-black px-2 py-1 text-xs font-semibold rounded mt-2">
                DRAFT
              </span>
            )}
          </div>
        </Link>
      </div>
    )
  }

  return (
    <div className={`${cardClassName} group`}>
      <Link
        href={recipeUrl}
        className="block h-full !no-underline hover:!no-underline focus:!no-underline active:!no-underline"
        onClick={handleClick}
      >
        <div className={frameClassName}>
          {/* Show placeholder while fallback is loading */}
          {showPlaceholder && (
            <RecipePlaceholder
              title={recipe.title}
              className="absolute inset-0 z-10 h-full w-full"
            />
          )}
          <Image
            src={imageUrl}
            alt={recipe.title}
            fill
            className={`!rounded-none object-cover transition duration-300 group-hover:scale-[1.02] ${showPlaceholder ? 'opacity-0' : 'opacity-100'}`}
            onError={handleImageError}
            onLoad={handleImageLoad}
            loading="lazy"
            sizes={featured ? "(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 66vw" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgZmlsbD0iI2VlZSIvPjwvc3ZnPg=="
          />
        </div>
        <div className={titleClassName}>
          <div>
            <span className={titleTextClassName}>{recipe.title}</span>
            {recipe.draft && (
              <span className="inline-block bg-yellow-500 text-black px-2 py-1 text-xs font-semibold rounded mt-2">
                DRAFT
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
})

export default RecipeGridCard
