import { getRecipesByCategories } from '@/lib/mdx'
import SearchableRecipes from '@/components/recipe/SearchableRecipes'
import AboutFooter from '@/components/AboutFooter'

export default async function HomePage() {
  const recipesByCategory = getRecipesByCategories()
  const totalRecipes = Object.values(recipesByCategory).reduce((total, recipes) => total + recipes.length, 0)

  return (
    <div>
      <div className="px-4 pt-4 pb-8">
        {totalRecipes === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No recipes yet. Add your first recipe in the content/recipes folder!</p>
          </div>
        ) : (
          <SearchableRecipes recipesByCategory={recipesByCategory} />
        )}
      </div>
      <AboutFooter />
    </div>
  )
}
