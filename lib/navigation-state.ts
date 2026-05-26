export const BACK_NAVIGATION_KEY = 'isBackNavigation'

export function getNavigationHistoryKey(path: string): string {
  return `navigationHistory-${path}`
}

export function getScrollPositionKey(path: string): string {
  return `scroll-position-${path}`
}

export function getRestoreScrollKey(path: string): string {
  return `restoreScroll-${path}`
}

export function getSearchQueryKey(path: string): string {
  return `search-query-${path}`
}

export function markBackNavigation(): void {
  sessionStorage.setItem(BACK_NAVIGATION_KEY, 'true')
}

export function consumeBackNavigationFlag(): boolean {
  const isBackNavigation = Boolean(sessionStorage.getItem(BACK_NAVIGATION_KEY))

  if (isBackNavigation) {
    sessionStorage.removeItem(BACK_NAVIGATION_KEY)
  }

  return isBackNavigation
}
