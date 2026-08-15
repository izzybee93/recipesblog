export function selectDailyRecipePicks<T extends { slug: string }>(
  recipes: readonly T[],
  categoryName: string,
  day: string,
  count: number,
): T[] {
  const score = (slug: string) => {
    let hash = 0

    for (const character of `${day}-${categoryName}-${slug}`) {
      hash = (hash * 31 + character.charCodeAt(0)) | 0
    }

    return hash >>> 0
  }

  return [...recipes]
    .sort((a, b) => score(a.slug) - score(b.slug) || a.slug.localeCompare(b.slug))
    .slice(0, Math.max(0, count))
}
