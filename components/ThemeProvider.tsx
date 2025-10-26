'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    // Function to update theme
    const updateTheme = () => {
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

      if (darkModeMediaQuery.matches) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      console.log('Theme updated, dark mode:', darkModeMediaQuery.matches)
    }

    // Set initial theme
    updateTheme()

    // Listen for changes in system preference
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    darkModeMediaQuery.addEventListener('change', updateTheme)

    return () => {
      darkModeMediaQuery.removeEventListener('change', updateTheme)
    }
  }, [])

  // Handle scroll restoration
  useEffect(() => {
    const scrollKey = `scroll-position-${pathname}`

    // Restore scroll position after page load or navigation
    const restoreScrollPosition = () => {
      const savedPosition = sessionStorage.getItem(scrollKey)

      if (savedPosition) {
        const targetPosition = parseInt(savedPosition, 10)

        // Wait for content to fully load before scrolling
        const scrollToPosition = () => {
          // Check if document height is sufficient
          const maxScroll = document.documentElement.scrollHeight - window.innerHeight

          if (maxScroll >= targetPosition * 0.9 || maxScroll === 0) {
            // Content is loaded enough or we're at the top
            window.scrollTo({
              top: targetPosition,
              behavior: 'instant'
            })
            sessionStorage.removeItem(scrollKey)
          } else {
            // Content not ready, try again
            setTimeout(scrollToPosition, 100)
          }
        }

        // Start attempting to scroll after a short delay
        setTimeout(scrollToPosition, 100)
      }
    }

    // Restore scroll position when navigating to this page
    restoreScrollPosition()

    // Save scroll position before unload (for page refresh)
    const saveScrollPosition = () => {
      sessionStorage.setItem(scrollKey, window.scrollY.toString())
    }

    window.addEventListener('beforeunload', saveScrollPosition)

    return () => {
      window.removeEventListener('beforeunload', saveScrollPosition)
    }
  }, [pathname])

  return <>{children}</>
}