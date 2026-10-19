type Geometry = {
  sectionTop: number
  sectionBottom: number
  scrollY: number
  viewportHeight: number
  viewportOffset: number
  navHeight: number
  documentHeight: number
}
export function recipeSectionTarget(section: 'ingredients' | 'directions', geometry: Geometry) {
  const { sectionTop, sectionBottom, scrollY, viewportHeight, viewportOffset, navHeight, documentHeight } = geometry
  const topInset = viewportOffset + navHeight + 12
  const bottomInset = viewportOffset + viewportHeight - 16
  const usableHeight = bottomInset - topInset
  let target = sectionTop - topInset
  if (section === 'directions' && sectionBottom > sectionTop && sectionBottom - sectionTop <= usableHeight) {
    const alreadyVisible = sectionTop >= scrollY + topInset && sectionBottom <= scrollY + bottomInset
    target = alreadyVisible ? scrollY : sectionBottom - bottomInset
  }
  return Math.max(0, Math.min(target, Math.max(0, documentHeight - viewportHeight - viewportOffset)))
}
type Animation = {
  start: number
  target: number
  reducedMotion: boolean
  now: () => number
  request: (callback: (time: number) => void) => number
  cancel: (id: number) => void
  scroll: (y: number) => void
}
export function animateRecipeScroll(options: Animation): () => void {
  if (options.reducedMotion || Math.abs(options.start - options.target) < 1) {
    options.scroll(options.target)
    return () => {}
  }
  const startTime = options.now()
  let stopped = false
  let frame = 0
  const tick = (time: number) => {
    if (stopped) return
    const progress = Math.min(1, Math.max(0, (time - startTime) / 240))
    const eased = 1 - Math.pow(1 - progress, 3)
    options.scroll(options.start + (options.target - options.start) * eased)
    if (progress < 1) frame = options.request(tick)
  }
  frame = options.request(tick)
  return () => { stopped = true; options.cancel(frame) }
}
