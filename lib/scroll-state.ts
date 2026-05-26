import { getRestoreScrollKey, getScrollPositionKey } from '@/lib/navigation-state'

export function saveScrollPosition(path: string, y: number): void {
  sessionStorage.setItem(getScrollPositionKey(path), y.toString())
}

export function getSavedScrollPosition(path: string): number | null {
  const savedPosition = sessionStorage.getItem(getScrollPositionKey(path))

  if (!savedPosition) {
    return null
  }

  return parseInt(savedPosition, 10)
}

export function clearSavedScrollPosition(path: string): void {
  sessionStorage.removeItem(getScrollPositionKey(path))
}

export function shouldRestoreScroll(path: string): boolean {
  return Boolean(sessionStorage.getItem(getRestoreScrollKey(path)))
}

export function consumeRestoreScroll(path: string): boolean {
  const shouldRestore = shouldRestoreScroll(path)

  if (shouldRestore) {
    sessionStorage.removeItem(getRestoreScrollKey(path))
  }

  return shouldRestore
}
