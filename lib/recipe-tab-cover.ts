type Bounds = { top: number; bottom: number; width: number }
type Options = {
  window: EventTarget
  visualViewport: EventTarget | null
  getBounds: () => Bounds
  onChange: (pinned: boolean) => void
  observeResize: (update: () => void) => () => void
}
export function watchRecipeTabPosition(options: Options): () => void {
  let stopped = false
  let pinned: boolean | undefined
  const update = () => {
    if (stopped) return
    const bounds = options.getBounds()
    const next = bounds.width > 0 && bounds.top <= 0 && bounds.bottom > 0
    if (next !== pinned) {
      pinned = next
      options.onChange(next)
    }
  }
  const windowEvents = ['scroll', 'resize', 'pageshow']
  const viewportEvents = ['scroll', 'resize']
  windowEvents.forEach(event => options.window.addEventListener(event, update, { passive: true }))
  viewportEvents.forEach(event => options.visualViewport?.addEventListener(event, update, { passive: true }))
  const stopResize = options.observeResize(update)
  update()
  return () => {
    stopped = true
    stopResize()
    windowEvents.forEach(event => options.window.removeEventListener(event, update))
    viewportEvents.forEach(event => options.visualViewport?.removeEventListener(event, update))
  }
}
