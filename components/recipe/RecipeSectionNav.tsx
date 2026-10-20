'use client'

import { useEffect, useRef } from 'react'
import type { MouseEvent } from 'react'
import { animateRecipeScroll, recipeSectionTarget } from '@/lib/recipe-section-navigation'
import { watchRecipeTabPosition } from '@/lib/recipe-tab-cover'
import styles from './RecipeLayout.module.css'

export default function RecipeSectionNav() {
  const navRef = useRef<HTMLElement>(null)
  const coverRef = useRef<HTMLSpanElement>(null)
  const stopAnimation = useRef<() => void>(() => {})

  useEffect(() => {
    // Safari 26+ and other supporting browsers keep this entirely in CSS.
    if (CSS.supports('animation-timeline', '--recipe-pinned')
      && CSS.supports('view-timeline-name', '--recipe-pinned')
      && CSS.supports('animation-range', 'exit')) return
    const nav = navRef.current
    const cover = coverRef.current
    if (!nav || !cover) return
    return watchRecipeTabPosition({
      window,
      visualViewport: window.visualViewport,
      getBounds: () => nav.getBoundingClientRect(),
      onChange: pinned => { cover.toggleAttribute('data-pinned', pinned) },
      observeResize: update => {
        const observer = new ResizeObserver(update)
        observer.observe(nav)
        const article = nav.closest('article')
        if (article) observer.observe(article)
        return () => observer.disconnect()
      },
    })
  }, [])

  useEffect(() => {
    const cancel = () => stopAnimation.current()
    const cancelKey = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Tab', 'Escape'].includes(event.key)) cancel()
    }
    window.addEventListener('wheel', cancel, { passive: true })
    window.addEventListener('touchstart', cancel, { passive: true })
    window.addEventListener('keydown', cancelKey)
    window.addEventListener('resize', cancel)
    window.visualViewport?.addEventListener('resize', cancel)
    return () => {
      cancel()
      window.removeEventListener('wheel', cancel)
      window.removeEventListener('touchstart', cancel)
      window.removeEventListener('keydown', cancelKey)
      window.removeEventListener('resize', cancel)
      window.visualViewport?.removeEventListener('resize', cancel)
    }
  }, [])

  const navigate = (event: MouseEvent<HTMLAnchorElement>, section: 'ingredients' | 'directions') => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const nav = navRef.current
    const destination = nav?.closest('article')?.querySelector<HTMLElement>(`#${section}`)
    if (!nav || !destination) return
    event.preventDefault()
    stopAnimation.current()
    // Keep keyboard navigation at the chosen section without triggering a
    // second native scroll or adding a focus stop to the static lists.
    if (event.detail === 0) destination.focus({ preventScroll: true })
    const rect = destination.getBoundingClientRect()
    const viewport = window.visualViewport
    const target = recipeSectionTarget(section, {
      sectionTop: rect.top + window.scrollY,
      sectionBottom: rect.bottom + window.scrollY,
      scrollY: window.scrollY,
      viewportHeight: viewport?.height ?? window.innerHeight,
      viewportOffset: viewport?.offsetTop ?? 0,
      navHeight: nav.getBoundingClientRect().height,
      documentHeight: document.documentElement.scrollHeight,
    })
    stopAnimation.current = animateRecipeScroll({
      start: window.scrollY, target,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      now: () => performance.now(),
      request: callback => window.requestAnimationFrame(callback),
      cancel: id => window.cancelAnimationFrame(id),
      scroll: top => window.scrollTo({ top, behavior: 'instant' }),
    })
  }

  return <>
    <div className={styles.jumpMarker} aria-hidden="true" data-testid="recipe-pin-marker">
      <span ref={coverRef} className={styles.mobileTopCover} data-testid="recipe-top-cover" />
    </div>
    <nav ref={navRef} className={styles.jumpNav} aria-label="Recipe sections">
      <div className={styles.jumpNavLinks}>
        <a href="#ingredients" onClick={event => navigate(event, 'ingredients')}>Ingredients</a>
        <a href="#directions" onClick={event => navigate(event, 'directions')}>Directions</a>
      </div>
    </nav>
  </>
}
