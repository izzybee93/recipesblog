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
