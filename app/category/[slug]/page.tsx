import { notFound } from 'next/navigation'
import { getAllCategories, getRecipesByCategory } from '@/lib/mdx'
import { capitalize } from '@/lib/search'
import CategoryPageClient from '@/components/recipe/CategoryPageClient'

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

  const recipes = getRecipesByCategory(slug)

  return <CategoryPageClient recipes={recipes} category={slug} />
}
