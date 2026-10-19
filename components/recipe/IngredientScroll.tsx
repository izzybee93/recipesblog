'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { watchIngredientOverflow } from '@/lib/ingredient-scroll'
import styles from './RecipeLayout.module.css'

export default function IngredientScroll({ children }: { children: ReactNode }) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [hasMoreBelow, setHasMoreBelow] = useState(false)

  useEffect(() => {
    const scroller = scrollerRef.current
    const content = contentRef.current
    if (!scroller || !content) return

    return watchIngredientOverflow(scroller, setHasMoreBelow, update => {
      const observer = new ResizeObserver(update)
      observer.observe(scroller)
      observer.observe(content)
      return () => observer.disconnect()
    })
  }, [])

  return (
    <div className={styles.ingredientViewport}>
      <div
        ref={scrollerRef}
        className={styles.ingredientScroller}
        tabIndex={0}
        role="region"
        aria-label="Ingredient list"
        data-testid="ingredients-scroller"
      >
        <div ref={contentRef}>{children}</div>
      </div>
      {hasMoreBelow && (
        <div className={styles.ingredientScrollCue} aria-hidden="true" data-testid="ingredients-scroll-cue">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      )}
    </div>
  )
}
