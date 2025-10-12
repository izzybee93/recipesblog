'use client'

import { useEffect } from 'react'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
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

  return <>{children}</>
}