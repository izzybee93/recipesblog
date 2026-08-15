import { notFound } from 'next/navigation'
import { getAllCategories, getRecipeCardsByCategory, getRecipeSearchDocumentsByCategory, getRecipesByCategory } from '@/lib/mdx'
import { capitalize } from '@/lib/search'
import { selectDailyRecipePicks } from '@/lib/category-picks'
import CategoryPageClient from '@/components/recipe/CategoryPageClient'

export const revalidate = 3600

interface CategoryPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const categories = getAllCategories()
  return categories.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params
  const categories = getAllCategories()

  if (!categories.includes(slug.toLowerCase())) {
    return {
      title: 'Category Not Found',
    }
  }

  const recipes = getRecipesByCategory(slug)
  const categoryName = capitalize(slug)
  const description = `Browse ${recipes.length} delicious ${categoryName.toLowerCase()} recipes. Find vegetarian and vegan ${categoryName.toLowerCase()} dishes at Baker Beanie.`

  return {
    title: `${categoryName} Recipes | Baker Beanie`,
    description,
    openGraph: {
      title: `${categoryName} Recipes`,
      description,
      url: `https://bakerbeanie.me/category/${slug}`,
      siteName: 'Baker Beanie',
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `${categoryName} Recipes | Baker Beanie`,
      description,
    },
    keywords: [
      slug,
      categoryName.toLowerCase(),
      'vegetarian',
      'vegan',
      'recipes',
      'cooking',
      'baking',
    ],
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const categories = getAllCategories()

  if (!categories.includes(slug.toLowerCase())) {
    notFound()
  }

  const recipes = getRecipeCardsByCategory(slug)
  const searchDocuments = getRecipeSearchDocumentsByCategory(slug)
  const categoryName = capitalize(slug)
  const day = new Date().toISOString().slice(0, 10)
  const dailyPicks = selectDailyRecipePicks(recipes, categoryName, day, 3)

  return (
    <CategoryPageClient
      recipes={recipes}
      dailyPicks={dailyPicks}
      searchDocuments={searchDocuments}
      category={slug}
    />
  )
}
