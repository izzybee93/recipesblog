'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { Recipe } from '@/types/recipe'
import { getBackupImageUrl } from '@/lib/blob-image'
import { navigateToStoredBackDestination, storeCategoryEntryNavigation } from '@/lib/navigation-actions'
import RecipeFooter from './RecipeFooter'
import RecipeMode from './RecipeMode'
import RecipePlaceholder from './RecipePlaceholder'
import styles from './RecipeLayout.module.css'

interface RecipeLayoutProps {
  recipe: Recipe
  blurDataURL?: string
}

function ingredientText(value: unknown): string {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') return Object.keys(value)[0] ?? ''
  return String(value ?? '')
}

export default function RecipeLayout({ recipe, blurDataURL }: RecipeLayoutProps) {
  const [useBackupImage, setUseBackupImage] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)
  const imageUrl = useBackupImage ? getBackupImageUrl(recipe.featured_image) : recipe.featured_image

  const handleImageError = () => {
    if (!useBackupImage && getBackupImageUrl(recipe.featured_image) !== imageUrl) setUseBackupImage(true)
    else setImageFailed(true)
  }

  return (
    <article className={styles.recipe}>
      {recipe.draft && (
        <div className="mb-8 border-l-4 border-yellow-500 bg-yellow-100 p-4 text-yellow-700">
          <p className="font-bold">Draft Mode</p>
          <p className="text-sm">This recipe is not yet published.</p>
        </div>
      )}

      <div className={styles.utilityRow}>
        <button type="button" onClick={() => navigateToStoredBackDestination(window.location.pathname)}>
          ← Recipes
        </button>
      </div>

      <header className={styles.header}>
        <div className={styles.heading}>
          <h1 className={`${styles.title} text-gray-800 dark:text-white`}>{recipe.title}</h1>
          <div className={styles.categories}>
            {recipe.categories.map(category => (
              <button
                key={category}
                type="button"
                className="inline-flex min-h-11 items-center rounded-full bg-[var(--surface)] px-4 py-2 text-sm font-medium capitalize text-gray-600 transition-colors hover:bg-[var(--accent)] hover:text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)] dark:text-gray-300"
                onClick={() => {
                  const destination = `/category/${category.toLowerCase()}`
                  storeCategoryEntryNavigation(destination, window.location.pathname)
                  window.location.href = destination
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div
            className={styles.photo}
            style={blurDataURL ? { backgroundImage: `url(${blurDataURL})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
            role={imageFailed ? 'img' : undefined}
            aria-label={imageFailed ? recipe.title : undefined}
          >
            {imageFailed ? (
              !blurDataURL && <RecipePlaceholder title={recipe.title} className="h-full w-full" />
            ) : (
              <Image
                src={imageUrl}
                alt={recipe.title}
                fill
                sizes="(max-width: 767px) calc(100vw - 32px), 760px"
                className={styles.recipeImage}
                priority
                placeholder={blurDataURL ? 'blur' : 'empty'}
                blurDataURL={blurDataURL}
                onError={handleImageError}
              />
            )}
          </div>
          {(recipe.prep_time || recipe.cook_time) && (
            <div className={`${styles.recipeMeta} text-gray-700 dark:text-gray-300`}>
              {recipe.prep_time && <span>Prep {recipe.prep_time}</span>}
              {recipe.cook_time && <span>Cook {recipe.cook_time}</span>}
            </div>
          )}
        </div>
      </header>

      <nav className={styles.jumpNav} aria-label="Recipe sections">
        <a href="#ingredients">Ingredients</a>
        <a href="#directions">Directions</a>
      </nav>

      <div className={styles.body}>
        <section id="ingredients" className={styles.ingredients} tabIndex={0} aria-labelledby="ingredients-title">
          <div className={styles.sectionHeading}>
            <h2 id="ingredients-title">Ingredients</h2>
            <span className={`${styles.servings} text-gray-700 dark:text-gray-300`}>
              <svg className={styles.servingsIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
                <path d="M8.1 13.34l2.83-2.83L3.91 3.5c-1.56 1.56-1.56 4.09 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z" />
              </svg>
              {recipe.servings}
            </span>
          </div>
          <ul className={styles.ingredientList} role="list">
            {recipe.ingredients.map((value, index) => {
              const ingredient = ingredientText(value)
              const group = ingredient.match(/^##\s+(.+)$/)
              return group ? (
                <li key={index} className={styles.ingredientGroup}><h3>{group[1]}</h3></li>
              ) : (
                <li key={index} className={styles.ingredientRow}>
                  <span className={styles.ingredientBullet} aria-hidden="true" />
                  <span>{ingredient}</span>
                </li>
              )
            })}
          </ul>
        </section>

        <section id="directions" className={styles.directions} aria-labelledby="directions-title">
          <div className={`${styles.sectionHeading} ${styles.directionsHeading}`}>
            <h2 id="directions-title">Directions</h2>
            <RecipeMode />
          </div>
          <ol className={styles.directionList} role="list">
            {recipe.directions.map((direction, index) => (
              <li key={index} className={styles.directionRow}>
                <span className={styles.stepNumber} aria-hidden="true">{index + 1}</span>
                <span>{direction}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
      <RecipeFooter />
    </article>
  )
}
