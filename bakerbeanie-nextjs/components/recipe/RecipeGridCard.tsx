'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Recipe } from '@/types/recipe'
import { useState } from 'react'
import RecipePlaceholder from './RecipePlaceholder'

interface RecipeGridCardProps {
  recipe: Recipe
}

export default function RecipeGridCard({ recipe }: RecipeGridCardProps) {
  const [imageError, setImageError] = useState(false)
  const isPngImage = recipe.featured_image.toLowerCase().endsWith('.png')
  
  if (imageError || isPngImage) {
    return (
      <div className="recipe flex-1 min-w-[300px] h-[200px] relative m-1 rounded-lg overflow-hidden group">
        <Link 
          href={`/recipes/${recipe.slug}`}
          className="block w-full h-full relative"
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
            <span className="block font-bold" style={{ color: '#fff' }}>{recipe.title}</span>
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
    <div className="recipe flex-1 min-w-[300px] h-[200px] relative m-1 rounded-lg overflow-hidden group">
      <Link 
        href={`/recipes/${recipe.slug}`}
        className="block w-full h-full relative transition-all duration-200 ease-in-out"
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
            <span className="block">{recipe.title}</span>
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
}