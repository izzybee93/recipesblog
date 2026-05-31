'use client'

import { useEffect, useRef } from 'react'
import { capitalize } from '@/lib/search'

interface CategoryIndexProps {
  categories: string[]
}

export default function CategoryIndex({ categories }: CategoryIndexProps) {
  const sidebarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY === 0 && sidebarRef.current) {
        sidebarRef.current.scrollTop = 0
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToCategory = (category: string) => {
    const element = document.getElementById(`category-${category}`)
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
  }

  return (
    <div className="category-index lg:sticky lg:top-8 lg:self-start">
      {/* Mobile/Tablet Layout (top) */}
      <div className="mb-12 lg:hidden">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {categories.map(category => (
            <button
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
      </div>

      {/* Desktop Sidebar Layout (left) */}
      <div
        ref={sidebarRef}
        className="hidden w-56 lg:block lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto"
      >
        <nav className="space-y-2 border-l border-[var(--border)] pl-4">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => scrollToCategory(category)}
              className="inline-flex min-h-12 w-full items-center rounded-full bg-[var(--surface)] px-4 py-2 text-left transition-colors hover:bg-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] group"
            >
              <span
                className="text-sm font-medium text-gray-600 transition-colors group-hover:text-white dark:text-gray-300"
              >
                {capitalize(category)}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
