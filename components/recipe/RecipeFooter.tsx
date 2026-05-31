import Image from 'next/image'

export default function RecipeFooter() {
  return (
    <div className="mt-16 py-6 text-center">
      <div className="relative mx-auto mb-2 h-24 w-24">
        <Image
          src="/author.jpg"
          alt="Baker Beanie Author"
          fill
          className="rounded-full object-cover"
        />
      </div>
      <p
        className="font-display text-lg font-medium"
        style={{
          color: 'var(--accent)'
        }}
      >
        ■ every day is treat day ■
      </p>
    </div>
  )
}
