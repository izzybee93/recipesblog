'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { markBackNavigation } from '@/lib/navigation-state'
import { isRecipeDetailPath } from '@/lib/recipe-reload'
import {
  clearSavedScrollPosition,
  getSavedScrollPosition,
  saveScrollPosition as persistScrollPosition,
} from '@/lib/scroll-state'

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

  // Flag back/forward navigation so search state can be restored
  useEffect(() => {
    const handlePopState = () => {
      markBackNavigation()
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Handle scroll restoration
  useEffect(() => {
    // The browser restores recipe scroll positions. Do not overwrite them with
    // a stale application-saved offset; saved positions are for listing pages.
    if (isRecipeDetailPath(pathname)) {
      clearSavedScrollPosition(pathname)
      return
    }

    let restoreTimer: ReturnType<typeof setTimeout> | undefined

    // Restore scroll position after page load or navigation
    const restoreScrollPosition = () => {
      const savedPosition = getSavedScrollPosition(pathname)

      if (savedPosition !== null) {
        const targetPosition = savedPosition

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
            clearSavedScrollPosition(pathname)
          } else {
            // Content not ready, try again
            restoreTimer = setTimeout(scrollToPosition, 100)
          }
        }

        // Start attempting to scroll after a short delay
        restoreTimer = setTimeout(scrollToPosition, 100)
      }
    }

    // Restore scroll position when navigating to this page
    restoreScrollPosition()

    // Save scroll position before unload (for page refresh)
    const handleBeforeUnload = () => {
      persistScrollPosition(pathname, window.scrollY)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      clearTimeout(restoreTimer)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [pathname])

  return <>{children}</>
}
