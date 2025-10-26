'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Recipe } from '@/types/recipe'
import { useState, memo } from 'react'
import RecipePlaceholder from './RecipePlaceholder'

interface RecipeGridCardProps {
  recipe: Recipe
}

const RecipeGridCard = memo(function RecipeGridCard({ recipe }: RecipeGridCardProps) {
  const [imageError, setImageError] = useState(false)
  
  const handleClick = () => {
    // Mark that we're navigating from the home page
    sessionStorage.setItem('navigationHistory', 'from-home')
  }
  
  if (imageError) {
    return (
      <div className="recipe flex-shrink-0 basis-[calc(50%-0.5rem)] md:basis-[calc(33.333%-1.25rem)] max-w-[calc(50%-0.5rem)] md:max-w-[calc(33.333%-1.25rem)] aspect-[2/1] md:aspect-[3/2] relative rounded-lg overflow-hidden group">
        <Link 
          href={`/recipes/${recipe.slug}`}
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
    <div className="recipe flex-shrink-0 basis-[calc(50%-0.5rem)] md:basis-[calc(33.333%-1.25rem)] max-w-[calc(50%-0.5rem)] md:max-w-[calc(33.333%-1.25rem)] aspect-[2/1] md:aspect-[3/2] relative rounded-lg overflow-hidden group">
      <Link 
        href={`/recipes/${recipe.slug}`}
        className="block w-full h-full relative transition-all duration-200 ease-in-out"
        onClick={handleClick}
      >
        <Image
          src={recipe.featured_image}
          alt={recipe.title}
          fill
          className="object-cover"
          onError={() => setImageError(true)}
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