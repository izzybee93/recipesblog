'use client'

interface CategoryIndexProps {
  categories: string[]
}

export default function CategoryIndex({ categories }: CategoryIndexProps) {
  // Category display names mapping
  const categoryDisplayNames: Record<string, string> = {
    'breakfast': 'Breakfast',
    'mains': 'Mains',
    'treats': 'Treats',
    'salad': 'Salads',
    'snacks': 'Snacks',
    'sauces': 'Sauces',
    'grains': 'Grains',
    'bread': 'Bread'
  }

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
      <div className="lg:hidden mb-12 p-6 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => scrollToCategory(category)}
              className="category-link py-3 px-4 bg-white rounded-lg border border-gray-200 hover:border-accent hover:bg-gray-100 transition-all duration-200 text-center group"
              style={{
                borderColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgb(140, 190, 175)'
                e.currentTarget.style.backgroundColor = '#f9fafb'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb'
                e.currentTarget.style.backgroundColor = 'white'
              }}
            >
              <span
                className="font-medium text-gray-700 group-hover:text-gray-900 transition-colors"
                style={{ fontSize: '0.95rem' }}
              >
                {categoryDisplayNames[category] || category}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Sidebar Layout (left) */}
      <div className="hidden lg:block w-64 p-6 bg-gray-50 rounded-lg">
        <nav className="space-y-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => scrollToCategory(category)}
              className="w-full text-left py-3 px-4 bg-white rounded-lg border border-gray-200 hover:border-accent hover:bg-gray-100 transition-all duration-200 group"
              style={{
                borderColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgb(140, 190, 175)'
                e.currentTarget.style.backgroundColor = '#f9fafb'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb'
                e.currentTarget.style.backgroundColor = 'white'
              }}
            >
              <span
                className="font-medium text-gray-700 group-hover:text-gray-900 transition-colors"
                style={{ fontSize: '0.95rem' }}
              >
                {categoryDisplayNames[category] || category}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}