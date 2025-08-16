import Image from 'next/image'

export default function RecipeFooter() {
  return (
    <div className="py-12 mt-16 text-center">
      <div className="w-24 h-24 mx-auto mb-3 relative">
        <Image
          src="/author.jpg"
          alt="Baker Beanie Author"
          fill
          className="rounded-full object-cover"
        />
      </div>
      <p
        className="text-lg font-medium"
        style={{
          color: 'rgb(140, 190, 175)',
          fontFamily: 'SimplySweetSerif, serif'
        }}
      >
        ■ every day is treat day ■
      </p>
    </div>
  )
}