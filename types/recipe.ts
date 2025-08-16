export interface Recipe {
  title: string
  slug: string
  date: string
  categories: string[]
  featured_image: string
  servings: string
  ingredients: string[]
  directions: string[]
  draft?: boolean
  excerpt?: string
  prep_time?: string
  cook_time?: string
  total_time?: string
}

export interface RecipeFrontmatter {
  title: string
  date: string
  categories: string[]
  featured_image: string
  servings: string
  ingredients: string[] | string
  directions: string[] | string
  draft?: boolean
  excerpt?: string
  prep_time?: string
  cook_time?: string
  total_time?: string
}