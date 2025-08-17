'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Recipe } from '@/types/recipe'
import { useState } from 'react'
import RecipePlaceholder from './RecipePlaceholder'

interface RecipeCardProps {
  recipe: Recipe
  blurDataURL?: string
}

export default function RecipeCard({ recipe, blurDataURL }: RecipeCardProps) {
  const [imageError, setImageError] = useState(false)
  
  return (
    <Link href={`/recipes/${recipe.slug}`} className="group">
      <article className="overflow-hidden rounded-lg shadow-lg transition-transform group-hover:scale-105">
        <div className="relative h-48 w-full">
          {imageError ? (
            <RecipePlaceholder 
              title={recipe.title} 
              className="w-full h-full"
            />
          ) : (
            <Image
              src={recipe.featured_image}
              alt={recipe.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              placeholder={blurDataURL ? 'blur' : 'empty'}
              blurDataURL={blurDataURL}
              onError={() => setImageError(true)}
            />
          )}
          {recipe.draft && (
            <span className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 text-xs font-semibold rounded">
              DRAFT
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2 line-clamp-2">{recipe.title}</h3>
          <div className="flex flex-wrap gap-2 mb-2">
            {recipe.categories.map((category) => (
              <span
                key={category}
                className="text-xs bg-gray-200 px-2 py-1 rounded"
              >
                {category}
              </span>
            ))}
          </div>
          <p className="text-sm text-gray-600">{recipe.servings}</p>
        </div>
      </article>
    </Link>
  )
}