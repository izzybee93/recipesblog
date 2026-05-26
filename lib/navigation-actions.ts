import {
  getNavigationHistoryKey,
  getRestoreScrollKey,
  getSearchQueryKey,
} from '@/lib/navigation-state'
import { clearSavedScrollPosition, saveScrollPosition } from '@/lib/scroll-state'

function storeNavigationHistory(destinationPath: string, currentPath: string): void {
  sessionStorage.setItem(getNavigationHistoryKey(destinationPath), currentPath)
}

export function navigateHomeFromLogo(): void {
  sessionStorage.removeItem(getSearchQueryKey('/'))
  sessionStorage.removeItem(getRestoreScrollKey('/'))
  clearSavedScrollPosition('/')
  window.location.href = '/'
}

export function storeRecipeEntryNavigation(
  destinationSlug: string,
  currentPath: string,
  scrollY: number
): void {
  const destinationPath = `/recipes/${destinationSlug}`
  storeNavigationHistory(destinationPath, currentPath)
  saveScrollPosition(currentPath, scrollY)
}

export function storeRecipeLinkNavigation(destinationSlug: string, currentPath: string): void {
  storeNavigationHistory(`/recipes/${destinationSlug}`, currentPath)
}

export function storeCategoryEntryNavigation(
  categoryPath: string,
  currentPath: string,
  scrollY?: number
): void {
  storeNavigationHistory(categoryPath, currentPath)

  if (typeof scrollY === 'number') {
    saveScrollPosition(currentPath, scrollY)
  }
}

export function storeRestoreScrollForPath(path: string): void {
  sessionStorage.setItem(getRestoreScrollKey(path), 'true')
}

export function resolveBackDestination(currentPath: string): string {
  const navHistory = sessionStorage.getItem(getNavigationHistoryKey(currentPath))

  if (navHistory && navHistory.startsWith('/')) {
    return navHistory
  }

  return '/'
}

export function markRestoreScroll(path: string): void {
  storeRestoreScrollForPath(path)
}

export function navigateToStoredBackDestination(
  currentPath: string,
  fallbackPath = '/'
): void {
  const resolvedDestination = resolveBackDestination(currentPath)
  const destination = resolvedDestination === '/' ? fallbackPath : resolvedDestination

  markRestoreScroll(destination)
  window.location.href = destination
}
