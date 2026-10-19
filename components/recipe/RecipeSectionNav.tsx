'use client'

import { useEffect, useRef } from 'react'
import type { MouseEvent } from 'react'
import { animateRecipeScroll, recipeSectionTarget } from '@/lib/recipe-section-navigation'
import styles from './RecipeLayout.module.css'

export default function RecipeSectionNav() {
  const navRef = useRef<HTMLElement>(null)
  const stopAnimation = useRef<() => void>(() => {})

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
    <span className={styles.mobileTopCover} aria-hidden="true" data-testid="recipe-top-cover" />
    <nav ref={navRef} className={styles.jumpNav} aria-label="Recipe sections">
      <div className={styles.jumpNavLinks}>
        <a href="#ingredients" onClick={event => navigate(event, 'ingredients')}>Ingredients</a>
        <a href="#directions" onClick={event => navigate(event, 'directions')}>Directions</a>
      </div>
    </nav>
  </>
}
