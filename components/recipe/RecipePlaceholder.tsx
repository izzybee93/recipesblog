interface RecipePlaceholderProps {
  title: string
  className?: string
  style?: React.CSSProperties
}

export default function RecipePlaceholder({ title, className = "", style }: RecipePlaceholderProps) {
  const getAccentTint = (str: string) => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }

    const tints = [
      '#e8f5f1',
      '#dff0eb',
      '#d4eae4',
      '#eef7f4',
      '#e2f2ed',
      '#d9eee8',
    ]
    
    return tints[Math.abs(hash) % tints.length]
  }

  const backgroundColor = getAccentTint(title)

  return (
    <div
      className={`text-center ${className}`}
      style={{ 
        backgroundColor,
        minHeight: '192px',
        ...style
      }}
    />
  )
}
