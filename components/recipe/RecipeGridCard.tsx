'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Recipe } from '@/types/recipe'
import { useState, memo } from 'react'
import RecipePlaceholder from './RecipePlaceholder'
import { getBackupImageUrl } from '@/lib/blob-image'

interface RecipeGridCardProps {
  recipe: Recipe
}

const RecipeGridCard = memo(function RecipeGridCard({ recipe }: RecipeGridCardProps) {
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
    // Store the current path as the back destination for THIS recipe
    const currentPath = window.location.pathname
    const destinationPath = `/recipes/${recipe.slug}`
    sessionStorage.setItem(`navigationHistory-${destinationPath}`, currentPath)
    // Save current scroll position for when we return
    sessionStorage.setItem(`scroll-position-${currentPath}`, window.scrollY.toString())
  }

  // Memoize recipe slug to prevent recalculation
  const recipeUrl = `/recipes/${recipe.slug}`
  
  if (imageError) {
    return (
      <div className="recipe flex-shrink-0 basis-full sm:basis-[calc(50%-0.5rem)] md:basis-[calc(33.333%-0.67rem)] max-w-full sm:max-w-[calc(50%-0.5rem)] md:max-w-[calc(33.333%-0.67rem)] aspect-[5/2] sm:aspect-[2/1] md:aspect-[3/2] relative rounded-lg overflow-hidden group">
        <Link
          href={recipeUrl}
          className="block w-full h-full relative"
          onClick={handleClick}
        >
          <RecipePlaceholder 
            title={recipe.title} 
            className="w-full h-full rounded-lg"
            style={{ paddingBottom: '50px' }}
          />
          <div 
            className="absolute bottom-1 w-full left-0 px-4 z-10 text-center"
            style={{ textShadow: '1px 1px 1px #000' }}
          >
            <span className="block font-bold" style={{ color: '#fff', fontFamily: 'Raleway, sans-serif' }}>{recipe.title}</span>
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
    <div className="recipe flex-shrink-0 basis-full sm:basis-[calc(50%-0.5rem)] md:basis-[calc(33.333%-0.67rem)] max-w-full sm:max-w-[calc(50%-0.5rem)] md:max-w-[calc(33.333%-0.67rem)] aspect-[5/2] sm:aspect-[2/1] md:aspect-[3/2] relative rounded-lg overflow-hidden group bg-gray-200 dark:bg-gray-700">
      <Link
        href={recipeUrl}
        className="block w-full h-full relative"
        onClick={handleClick}
      >
        {/* Show placeholder while fallback is loading */}
        {showPlaceholder && (
          <RecipePlaceholder
            title={recipe.title}
            className="absolute inset-0 w-full h-full rounded-lg z-10"
          />
        )}
        <Image
          src={imageUrl}
          alt={recipe.title}
          fill
          className={`object-cover transition-opacity duration-300 ${showPlaceholder ? 'opacity-0' : 'opacity-100'}`}
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading="lazy"
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          placeholder="blur"
          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgZmlsbD0iI2VlZSIvPjwvc3ZnPg=="
        />
        <div 
          className="absolute inset-0 transition-all duration-200 ease-in-out"
          style={{ 
            background: 'rgba(0, 0, 0, 0.2)',
            color: '#fff',
            textDecoration: 'none',
            textAlign: 'center',
            fontSize: '1.1em',
            fontWeight: 700
          }}
        >
          <div 
            className="absolute bottom-1 w-full left-0 px-4"
            style={{ textShadow: '1px 1px 1px #000' }}
          >
            <span className="block" style={{ fontFamily: 'Raleway, sans-serif' }}>{recipe.title}</span>
            {recipe.draft && (
              <span className="inline-block bg-yellow-500 text-black px-2 py-1 text-xs font-semibold rounded mt-2">
                DRAFT
              </span>
            )}
          </div>
          
          {/* Hover effect to remove overlay */}
          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-0 transition-opacity duration-200" />
        </div>
      </Link>
    </div>
  )
})

export default RecipeGridCard