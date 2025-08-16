interface RecipePlaceholderProps {
  title: string
  className?: string
  style?: React.CSSProperties
}

export default function RecipePlaceholder({ title, className = "", style }: RecipePlaceholderProps) {
  // Use Baker Beanie accent color theme with subtle gradients
  const generateAccentGradient = (str: string) => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    
    // Create beautiful lighter gradients using the accent color
    const gradients = [
      'linear-gradient(135deg, #a8d0c3 0%, #e8f5f1 100%)',
      'linear-gradient(135deg, #9cc8bb 0%, #d4f0e7 100%)', 
      'linear-gradient(135deg, #8cbeaf 0%, #d9f3ea 100%)',
      'linear-gradient(135deg, #b0d6c8 0%, #f0f9f6 100%)',
      'linear-gradient(135deg, #9dc9bc 0%, #e5f4ef 100%)',
      'linear-gradient(135deg, #a5d1c4 0%, #f2faf7 100%)',
    ]
    
    return gradients[Math.abs(hash) % gradients.length]
  }

  const backgroundGradient = generateAccentGradient(title)

  return (
    <div 
      className={`flex items-center justify-center text-white text-center ${className}`}
      style={{ 
        background: backgroundGradient,
        minHeight: '192px', // h-48 equivalent
        ...style
      }}
    >
      <div className="text-center">
        {/* Clean gradient background only */}
      </div>
    </div>
  )
}