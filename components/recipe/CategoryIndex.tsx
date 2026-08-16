'use client'

import { useEffect, useRef } from 'react'
import { capitalize } from '@/lib/search'

interface CategoryIndexProps {
  categories: string[]
  layout: 'mobile' | 'desktop'
}

export default function CategoryIndex({ categories, layout }: CategoryIndexProps) {
  const sidebarRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (layout !== 'desktop') return

    const handleScroll = () => {
      if (window.scrollY === 0 && sidebarRef.current) {
        sidebarRef.current.scrollTop = 0
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [layout])

  const scrollToCategory = (category: string) => {
    const element = document.getElementById(`category-${category}`)
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
  }

  if (layout === 'mobile') {
    return (
      <nav className="category-index mb-10 lg:hidden" aria-label="Recipe categories">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {categories.map(category => (
            <button
              type="button"
              key={category}
              onClick={() => scrollToCategory(category)}
              className="category-link inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[var(--surface)] px-4 py-2 text-center transition-colors hover:bg-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] group"
            >
              <span
                className="text-sm font-medium text-gray-600 transition-colors group-hover:text-white dark:text-gray-300"
              >
                {capitalize(category)}
              </span>
            </button>
          ))}
        </div>
      </nav>
    )
  }

  return (
    <aside
      ref={sidebarRef}
      className="category-index hidden w-[230px] lg:sticky lg:top-6 lg:block lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto"
    >
      <nav aria-label="Recipe categories">
        <p className="mb-3 px-1 text-xs font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
          Browse
        </p>
        <div className="grid grid-cols-1 gap-2">
          {categories.map(category => (
            <button
              type="button"
              key={category}
              onClick={() => scrollToCategory(category)}
              className="group inline-flex min-h-11 w-full items-center rounded-full bg-[var(--surface)] px-4 py-2 text-left transition-colors hover:bg-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              <span
                className="text-sm font-medium text-gray-600 transition-colors group-hover:text-white dark:text-gray-300"
              >
                {capitalize(category)}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </aside>
  )
}
