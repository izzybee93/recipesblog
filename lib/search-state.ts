import {
  consumeBackNavigationFlag,
  getRestoreScrollKey,
  getSearchQueryKey,
} from '@/lib/navigation-state'

export function getInitialSearchQuery(path: string): string {
  if (typeof window === 'undefined') {
    return ''
  }

  const isBackNavigation = consumeBackNavigationFlag()
  const shouldRestoreSearch = Boolean(sessionStorage.getItem(getRestoreScrollKey(path)))

  if (isBackNavigation || shouldRestoreSearch) {
    return sessionStorage.getItem(getSearchQueryKey(path)) || ''
  }

  sessionStorage.removeItem(getSearchQueryKey(path))
  return ''
}

export function persistSearchQuery(path: string, query: string): void {
  if (query) {
    sessionStorage.setItem(getSearchQueryKey(path), query)
  } else {
    sessionStorage.removeItem(getSearchQueryKey(path))
  }
}
