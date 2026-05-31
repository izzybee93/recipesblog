import { memo } from 'react'
import { RecipeCard } from '@/types/recipe'
import RecipeGridCard from './RecipeGridCard'

interface RecipeGridProps {
  recipes: RecipeCard[]
  featuredFirst?: boolean
}

const RecipeGrid = memo(function RecipeGrid({ recipes, featuredFirst = false }: RecipeGridProps) {
  return (
    <div className="recipes grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" style={{ contain: 'layout' }}>
      {recipes.map((recipe, index) => (
        <RecipeGridCard key={recipe.slug} recipe={recipe} featured={featuredFirst && index === 0} />
      ))}
    </div>
  )
})

export default RecipeGrid
