/**
 * Shared search utilities used across SearchableRecipes and CategoryPageClient
 */

/**
 * Remove diacritics (accents) from a string for accent-insensitive search
 * e.g., "crème" becomes "creme"
 */
export function removeDiacritics(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * Capitalize the first letter of a string
 * e.g., "breakfast" becomes "Breakfast"
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Simple seeded random number generator (Linear Congruential Generator)
 * Returns a function that produces deterministic "random" numbers between 0 and 1
 */
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
}

/**
 * Get a numeric seed from a date string
 * Uses the date portion (YYYY-MM-DD) to ensure same seed for entire day
 */
function dateSeed(date: Date = new Date()): number {
  const dateStr = date.toISOString().split('T')[0] // "2026-02-01"
  let seed = 0
  for (let i = 0; i < dateStr.length; i++) {
    seed = ((seed << 5) - seed) + dateStr.charCodeAt(i)
    seed = seed & seed
  }
  return Math.abs(seed)
}

/**
 * Shuffle an array deterministically based on the current date
 * All users see the same "random" order on the same day
 * Selection changes at midnight (based on local time when called)
 */
export function shuffleByDate<T>(array: T[], date: Date = new Date()): T[] {
  const shuffled = [...array]
  const random = seededRandom(dateSeed(date))

  // Fisher-Yates shuffle with seeded random
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return shuffled
}
