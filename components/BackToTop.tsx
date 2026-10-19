'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import styles from './BackToTop.module.css'

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false)
  const pathname = usePathname()
  const useAccentBackground = pathname === '/' || pathname.startsWith('/category/')
  const colourClasses = useAccentBackground
    ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)]'
    : 'bg-[var(--surface)] text-gray-600 hover:bg-[var(--accent)] hover:text-white dark:text-gray-300 dark:hover:text-white'

  useEffect(() => {
    const updateVisibility = () => {
      setIsVisible(window.pageYOffset > 500)
    }

    updateVisibility()
    window.addEventListener('scroll', updateVisibility, { passive: true })
    return () => window.removeEventListener('scroll', updateVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className={styles.track}>
      <button
        onClick={scrollToTop}
        className={`${styles.button} ${colourClasses} z-50 flex cursor-pointer items-center justify-center rounded-full transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]`}
        aria-label="Back to top"
      >
        <svg
          className="w-[18px] h-[18px]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      </button>
    </div>
  )
}
