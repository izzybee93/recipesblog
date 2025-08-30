'use client'

import { useState, useEffect, useRef } from 'react'

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
}

export default function SearchBar({ onSearch, placeholder = "Search recipes..." }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const lastValueRef = useRef('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    
    // If clearing from a non-empty state, do it immediately
    if (value === '' && lastValueRef.current !== '') {
      onSearch('')
      lastValueRef.current = ''
      return
    }
    
    lastValueRef.current = value
    
    // Only debounce non-empty values
    if (value !== '') {
      timerRef.current = setTimeout(() => {
        onSearch(value)
      }, 300)
    }
  }

  const clearSearch = () => {
    // Clear any pending search
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    
    // Immediately clear everything
    setQuery('')
    lastValueRef.current = ''
    onSearch('')
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return (
    <div className="search-bar mb-8">
      <div className="relative max-w-md mx-auto">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg 
            className="h-5 w-5 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </div>
        
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:border-transparent transition-all"
          style={{}}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(140, 190, 175, 0.2)'
            e.currentTarget.style.borderColor = 'rgb(140, 190, 175)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = 'none'
            e.currentTarget.style.borderColor = '#d1d5db'
          }}
        />
        
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            <svg 
              className="h-5 w-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}