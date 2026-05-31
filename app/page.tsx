import { getRecipeCardsByCategories, getRecipeSearchDocuments } from '@/lib/mdx'
import SearchableRecipes from '@/components/recipe/SearchableRecipes'
import AboutFooter from '@/components/AboutFooter'

export default async function HomePage() {
  const recipesByCategory = getRecipeCardsByCategories()
  const searchDocuments = getRecipeSearchDocuments()
  const totalRecipes = Object.values(recipesByCategory).reduce((total, recipes) => total + recipes.length, 0)

  return (
    <div>
      <div className="pt-6 pb-12 md:pt-8 md:pb-16">
        {totalRecipes === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No recipes yet. Add your first recipe in the content/recipes folder!</p>
          </div>
        ) : (
          <SearchableRecipes recipesByCategory={recipesByCategory} searchDocuments={searchDocuments} />
        )}
      </div>
      <AboutFooter />
    </div>
  )
}
