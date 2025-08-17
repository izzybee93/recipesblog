import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getRecipeBySlug, getAllRecipes } from '@/lib/mdx'
import { getImageWithBlur } from '@/lib/image'
import RecipeLayout from '@/components/recipe/RecipeLayout'

interface RecipePageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const recipes = getAllRecipes(true)
  return recipes.map((recipe) => ({
    slug: recipe.slug,
  }))
}

export async function generateMetadata({ params }: RecipePageProps) {
  const { slug } = await params
  const recipe = getRecipeBySlug(slug)
  
  if (!recipe) {
    return {
      title: 'Recipe Not Found',
    }
  }

  const recipeDescription = recipe.meta.excerpt || `Delicious ${recipe.meta.categories.join(', ')} recipe for ${recipe.meta.title}. ${recipe.meta.servings}.`
  const recipeUrl = `https://bakerbeanie.me/recipes/${slug}`

  return {
    title: `${recipe.meta.title} | Baker Beanie`,
    description: recipeDescription,
    openGraph: {
      title: recipe.meta.title,
      description: recipeDescription,
      url: recipeUrl,
      siteName: 'Baker Beanie',
      images: [{
        url: `https://bakerbeanie.me${recipe.meta.featured_image}`,
        width: 1200,
        height: 630,
        alt: `${recipe.meta.title} - Baker Beanie Recipe`,
      }],
      locale: 'en_US',
      type: 'article',
      publishedTime: recipe.meta.date,
      authors: ['Baker Beanie'],
      section: 'Recipes',
      tags: recipe.meta.categories,
    },
    twitter: {
      card: 'summary_large_image',
      title: recipe.meta.title,
      description: recipeDescription,
      images: [`https://bakerbeanie.me${recipe.meta.featured_image}`],
      creator: '@bakerbeanie',
    },
    keywords: [
      ...recipe.meta.categories,
      'vegetarian',
      'vegan',
      'recipe',
      'cooking',
      'baking',
      recipe.meta.title.toLowerCase()
    ],
  }
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { slug } = await params
  const recipe = getRecipeBySlug(slug)
  
  if (!recipe) {
    notFound()
  }

  let imageData
  try {
    imageData = await getImageWithBlur(recipe.meta.featured_image)
  } catch (error) {
    console.error(`Failed to process image for ${slug}:`, error)
    imageData = { src: recipe.meta.featured_image, blurDataURL: undefined }
  }

  return (
    <RecipeLayout recipe={recipe.meta} blurDataURL={imageData.blurDataURL}>
      <MDXRemote source={recipe.content} />
    </RecipeLayout>
  )
}