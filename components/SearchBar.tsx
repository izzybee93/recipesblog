'use client'

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
  query?: string
}

export default function SearchBar({ onSearch, placeholder = "Search recipes...", query = '' }: SearchBarProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value)
  }

  const clearSearch = () => {
    onSearch('')
  }

  return (
    <div className="search-bar mb-12">
      <div className="relative mx-auto w-full max-w-[760px]">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <svg 
            className="h-5 w-5 text-gray-400 transition-colors focus-within:text-[var(--accent)] dark:text-gray-500" 
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
          placeholder={query ? undefined : placeholder}
          aria-label={placeholder}
          autoComplete="off"
          className="block h-12 w-full rounded-full bg-[var(--surface)] px-11 text-base text-gray-900 transition-colors duration-150 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent)_28%,transparent)] dark:text-white dark:placeholder:text-gray-400"
        />
        
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 flex min-h-12 min-w-12 items-center justify-center text-gray-400 transition-colors hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--accent)] dark:text-gray-500 dark:hover:text-gray-300"
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
