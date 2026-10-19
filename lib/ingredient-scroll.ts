type ScrollRegion = EventTarget & Pick<HTMLElement, 'scrollHeight' | 'clientHeight' | 'scrollTop'>

export function watchIngredientOverflow(
  scroller: ScrollRegion,
  onChange: (hasMoreBelow: boolean) => void,
  observeResize: (update: () => void) => () => void,
): () => void {
  let stopped = false
  const update = () => {
    if (!stopped) {
      onChange(scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop > 1)
    }
  }
  const stopResize = observeResize(update)
  scroller.addEventListener('scroll', update, { passive: true })
  update()
  return () => {
    stopped = true
    stopResize()
    scroller.removeEventListener('scroll', update)
  }
}
