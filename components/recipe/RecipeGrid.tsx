import { memo } from 'react'
import { Recipe } from '@/types/recipe'
import RecipeGridCard from './RecipeGridCard'

interface RecipeGridProps {
  recipes: Recipe[]
}

const RecipeGrid = memo(function RecipeGrid({ recipes }: RecipeGridProps) {
  return (
    <div className="recipes flex flex-wrap gap-2 max-w-6xl mx-auto">
      {recipes.map((recipe) => (
        <RecipeGridCard key={recipe.slug} recipe={recipe} />
      ))}
    </div>
  )
})

export default RecipeGrid