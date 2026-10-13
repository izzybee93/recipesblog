export const CATEGORY_ORDER = [
  'breakfast',
  'mains',
  'salad',
  'soup',
  'pasta',
  'grains',
  'bread',
  'snacks',
  'sauces',
  'treats',
  'cakes',
  'desserts',
] as const

const categoryRanks = new Map<string, number>(
  CATEGORY_ORDER.map((category, index) => [category, index]),
)

export function sortCategories(categories: readonly string[]): string[] {
  return [...categories].sort((left, right) => {
    const leftRank = categoryRanks.get(left) ?? CATEGORY_ORDER.length
    const rightRank = categoryRanks.get(right) ?? CATEGORY_ORDER.length
    return leftRank - rightRank || left.localeCompare(right)
  })
}
