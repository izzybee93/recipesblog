import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getRecipeBySlug, getAllRecipes } from '@/lib/mdx'
import { getImageWithBlur } from '@/lib/image'
import RecipeLayout from '@/components/recipe/RecipeLayout'

interface RecipePageProps {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  const recipes = getAllRecipes(true)
  return recipes.map((recipe) => ({
    slug: recipe.slug,
  }))
}

export async function generateMetadata({ params }: RecipePageProps) {
  const recipe = getRecipeBySlug(params.slug)
  
  if (!recipe) {
    return {
      title: 'Recipe Not Found',
    }
  }

  return {
    title: `${recipe.meta.title} | Baker Beanie`,
    description: recipe.meta.excerpt || `Recipe for ${recipe.meta.title}`,
    openGraph: {
      title: recipe.meta.title,
      description: recipe.meta.excerpt || `Recipe for ${recipe.meta.title}`,
      images: [recipe.meta.featured_image],
    },
  }
}

export default async function RecipePage({ params }: RecipePageProps) {
  const recipe = getRecipeBySlug(params.slug)
  
  if (!recipe) {
    notFound()
  }

  const imageData = await getImageWithBlur(recipe.meta.featured_image)

  return (
    <RecipeLayout recipe={recipe.meta} blurDataURL={imageData.blurDataURL}>
      <MDXRemote source={recipe.content} />
    </RecipeLayout>
  )
}