export const recipePlaceholderBackground = 'linear-gradient(135deg, var(--surface-strong), var(--accent))'

export default function RecipePlaceholder() {
  return (
    <div
      aria-hidden="true"
      data-recipe-placeholder
      className="absolute inset-0 h-full w-full"
      style={{ backgroundImage: recipePlaceholderBackground }}
    />
  )
}
