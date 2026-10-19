type CookingWakeLock = EventTarget & Pick<WakeLockSentinel, 'released' | 'release'>

interface CookingModeSessionOptions {
  document: EventTarget & { readonly visibilityState: string }
  window: EventTarget
  requestWakeLock?: () => Promise<CookingWakeLock>
  onReset: () => void
}

export function startCookingModeSession({
  document, window, requestWakeLock, onReset,
}: CookingModeSessionOptions): () => void {
  let stopped = false
  let lock: CookingWakeLock | null = null
  const windowEvents = ['blur', 'focus', 'pagehide', 'pageshow']

  const reset = () => {
    if (stopped) return
    stop()
    onReset()
  }

  const stop = () => {
    if (stopped) return
    stopped = true
    document.removeEventListener('visibilitychange', reset)
    windowEvents.forEach(event => window.removeEventListener(event, reset))
    if (lock) {
      lock.removeEventListener('release', reset)
      if (!lock.released) void lock.release().catch(() => {})
    }
  }

  document.addEventListener('visibilitychange', reset)
  windowEvents.forEach(event => window.addEventListener(event, reset))

  const acquire = async () => {
    if (!requestWakeLock || document.visibilityState !== 'visible') {
      reset()
      return
    }
    try {
      const next = await requestWakeLock()
      if (stopped || document.visibilityState !== 'visible' || next.released) {
        if (!next.released) await next.release()
        reset()
        return
      }
      lock = next
      lock.addEventListener('release', reset)
    } catch {
      reset()
    }
  }

  void acquire()
  return stop
}
