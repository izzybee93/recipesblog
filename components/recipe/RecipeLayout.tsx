'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Recipe } from '@/types/recipe'
import { useState } from 'react'
import RecipePlaceholder from './RecipePlaceholder'
import RecipeFooter from './RecipeFooter'

interface RecipeLayoutProps {
  recipe: Recipe
  blurDataURL?: string
  children: React.ReactNode
}

// Helper function to convert recipe names to slugs
function recipeNameToSlug(recipeName: string): string {
  // Manual mappings for known recipe names that don't match exactly
  const recipeNameMappings: Record<string, string> = {
    'strawberry jam filling': 'strawberry-jam-filling',
    'whipped cream filling': 'whipped-cream-filling', 
    'beschamel sauce': 'bechamel-sauce',
    'sesame, ginger and lime stir fry sauce': 'sesame-ginger-and-lime-stir-fry-sauce',
    'sesame salad dressing': 'sesame-salad-dressing',
    'meringue drops': 'meringue-drops',
    'miso salad dressing': 'miso-salad-dressing'
  }
  
  const normalizedName = recipeName.toLowerCase().trim()
  
  // Check if we have a manual mapping first
  if (recipeNameMappings[normalizedName]) {
    return recipeNameMappings[normalizedName]
  }
  
  // Fallback to automatic slug generation
  return recipeName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
}

// Helper function to render ingredient with recipe links
function renderIngredientWithLinks(ingredient: string): React.ReactNode {
  const seeRecipePattern = /^(.+?)\s*\(see recipe\)$/i
  const match = ingredient.match(seeRecipePattern)
  
  if (match) {
    const fullText = match[1].trim()
    
    // Extract just the recipe name from ingredient text like "6 tbsp strawberry jam filling"
    // Look for known recipe names at the end of the ingredient text
    const knownRecipeNames = [
      'strawberry jam filling',
      'whipped cream filling', 
      'bechamel sauce',
      'beschamel sauce',
      'sesame, ginger and lime stir fry sauce',
      'sesame salad dressing',
      'meringue drops',
      'miso salad dressing'
    ]
    
    let recipeName = fullText
    let ingredientPart = ''
    
    // Find the recipe name in the text
    for (const knownName of knownRecipeNames) {
      if (fullText.toLowerCase().includes(knownName.toLowerCase())) {
        const index = fullText.toLowerCase().indexOf(knownName.toLowerCase())
        ingredientPart = fullText.substring(0, index).trim()
        recipeName = knownName
        break
      }
    }
    
    const slug = recipeNameToSlug(recipeName)
    
    return (
      <React.Fragment>
        {ingredientPart} {recipeName} (
        <Link 
          href={`/recipes/${slug}`}
          className="hover:underline"
          style={{ color: 'rgb(140, 190, 175)' }}
        >
          see recipe
        </Link>
        )
      </React.Fragment>
    )
  }
  
  return ingredient
}

export default function RecipeLayout({ recipe, blurDataURL, children }: RecipeLayoutProps) {
  const router = useRouter()
  const [imageError, setImageError] = useState(false)

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  return (
    <article className="post max-w-4xl mx-auto px-4 py-8">
      {recipe.draft && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
          <p className="font-bold">Draft Mode</p>
          <p className="text-sm">This recipe is not yet published.</p>
        </div>
      )}
      
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 hover:text-gray-800 transition-colors"
          style={{
            borderColor: 'rgb(140, 190, 175)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgb(140, 190, 175)'
            e.currentTarget.style.color = 'white'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6'
            e.currentTarget.style.color = '#4b5563'
          }}
        >
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M15 19l-7-7 7-7" 
            />
          </svg>
          Back to Recipes
        </button>
      </div>
      
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800" style={{ marginBottom: '24px', fontFamily: 'Raleway, sans-serif' }}>{recipe.title}</h1>
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {recipe.categories.map((category) => (
            <span
              key={category}
              className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm capitalize"
            >
              {category}
            </span>
          ))}
        </div>
      </header>

      <div className="image mb-8">
        {imageError ? (
          <RecipePlaceholder 
            title={recipe.title} 
            className="w-full rounded-lg"
            style={{ height: '400px' }}
          />
        ) : (
          <Image
            src={recipe.featured_image}
            alt={recipe.title}
            width={1200}
            height={800}
            className="w-full h-auto rounded-lg"
            priority
            placeholder={blurDataURL ? 'blur' : 'empty'}
            blurDataURL={blurDataURL}
            onError={() => setImageError(true)}
          />
        )}
      </div>

      {children && (
        <div className="recipe-body prose prose-lg max-w-none mb-8">
          {children}
        </div>
      )}

      <div className="recipe-contents grid md:grid-cols-2 gap-8">
        <div className="ingredients">
          <h2 className="text-2xl font-semibold" style={{ marginBottom: '16px' }}>Ingredients</h2>
          
          <div className="recipe-overview mb-4 flex items-center gap-2">
            <svg 
              className="w-4 h-4" 
              style={{ color: 'rgb(140, 190, 175)' }}
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M8.1 13.34l2.83-2.83L3.91 3.5c-1.56 1.56-1.56 4.09 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z"/>
            </svg>
            <span className="text-gray-700">{recipe.servings}</span>
          </div>

          <ul className="space-y-2">
            {recipe.ingredients.map((ingredient, index) => {
              // List of known section headers
              const sectionHeaders = ['Marinade', 'Sauce', 'Dressing', 'Topping', 'Garnish', 'Base', 
                                    'Icing', 'Frosting', 'Filling', 'Glaze', 'Pesto', 'Cake', 
                                    'Muffins', 'Cupcakes', 'Drizzle']
              
              // Check if this is a section header
              const isSection = sectionHeaders.includes(ingredient.trim())
              
              if (isSection) {
                return (
                  <li key={index} className="mt-4 mb-2">
                    <h3 className="font-semibold text-lg" style={{ color: 'rgb(140, 190, 175)' }}>
                      {ingredient}
                    </h3>
                  </li>
                )
              }
              
              return (
                <li key={index} className="flex items-start">
                  <span className="mr-2" style={{ color: 'rgb(140, 190, 175)' }}>•</span>
                  <span>{renderIngredientWithLinks(ingredient)}</span>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="directions">
          <h2 className="text-2xl font-semibold" style={{ marginBottom: '16px' }}>Directions</h2>
          <ol className="space-y-4">
            {recipe.directions.map((direction, index) => (
              <li key={index} className="flex gap-3">
                <span className="font-bold flex-shrink-0" style={{ color: 'rgb(140, 190, 175)' }}>
                  {index + 1}.
                </span>
                <span>&nbsp;{direction}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
      
      <RecipeFooter />
    </article>
  )
}