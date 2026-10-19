export interface KnownRecipe { title: string; slug: string }
export interface RecipeTextPart { text: string; slug?: string }
export interface RecipeLinkMatcher {
  titleToSlug: Map<string, string>
  directionPattern: RegExp | null
}

export function buildRecipeLinkMatcher(recipes: KnownRecipe[]): RecipeLinkMatcher {
  const titleToSlug = new Map<string, string>()
  const titles = recipes.map(recipe => {
    const title = recipe.title.trim()
    if (title) titleToSlug.set(title.toLowerCase(), recipe.slug)
    return title
  }).filter(Boolean).sort((left, right) => right.length - left.length)
  const escapedTitles = titles.map(title => title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  return {
    titleToSlug,
    directionPattern: titles.length
      ? new RegExp(`(${escapedTitles.join('|')})(\\s*)\\((see recipe)\\)`, 'gi')
      : null,
  }
}

function ingredientRecipeName(text: string): string {
  const measurement = /^([\d½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]+[\d\/\-–]*\s*(?:heaped|level|large|small|medium)?\s*(?:tbsp|tsp|tablespoons?|tsps?|cups?|g(?![a-z])|kg|ml|l(?![a-z])|oz|lb|pounds?|bunch|bunches|cloves?|slices?|pieces?|sprigs?|handfuls?|pinch(?:es)?|dash(?:es)?|drops?|sheets?|sticks?|strips?|wedges?|portions?|servings?|tins?|cans?|jars?|heads?|stalks?|leaves|florets?|ears?)?\s*(?:of\s+)?)/i
  return text.replace(measurement, '').trim()
}

export function ingredientRecipeParts(text: string, matcher: RecipeLinkMatcher): RecipeTextPart[] {
  const match = text.match(/^(.+?)\s*\((optional,?\s*)?(see recipe)\)$/i)
  if (!match) return [{ text }]
  const name = ingredientRecipeName(match[1].trim()).toLowerCase()
  const aliases: Record<string, string> = {
    'strawberry jam filling': 'strawberry-jam-filling',
    'whipped cream filling': 'whipped-cream-filling',
    'sesame, ginger and lime stir fry sauce': 'sesame-ginger-and-lime-stir-fry-sauce',
    'sesame dressing': 'sesame-dressing',
    'meringue drops': 'meringue-drops',
    'miso dressing': 'miso-dressing',
  }
  const slug = matcher.titleToSlug.get(name) ?? aliases[name] ?? name
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
  const linkStart = text.length - match[3].length - 1
  return [
    { text: text.slice(0, linkStart) },
    { text: match[3], slug },
    { text: ')' },
  ]
}

export function directionRecipeParts(text: string, matcher: RecipeLinkMatcher): RecipeTextPart[] {
  if (!matcher.directionPattern) return [{ text }]
  const pattern = new RegExp(matcher.directionPattern.source, matcher.directionPattern.flags)
  const parts: RecipeTextPart[] = []
  let cursor = 0
  let match: RegExpExecArray | null
  while ((match = pattern.exec(text)) !== null) {
    const slug = matcher.titleToSlug.get(match[1].toLowerCase())
    if (!slug) continue
    const linkStart = match.index + match[1].length + match[2].length + 1
    parts.push({ text: text.slice(cursor, linkStart) }, { text: match[3], slug })
    cursor = linkStart + match[3].length
  }
  if (cursor < text.length || parts.length === 0) parts.push({ text: text.slice(cursor) })
  return parts
}
