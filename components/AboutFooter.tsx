import Image from 'next/image'

export default function AboutFooter() {
  return (
    <section className="about-footer bg-gray-50 dark:bg-gray-800 py-12 mt-16 rounded-lg">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Author Image */}
          <div className="mb-8">
            <div className="w-32 h-32 mx-auto relative">
              <Image
                src="/izzy-illustration.svg"
                alt="Izzy Illustration"
                fill
                className="object-contain"
              />
            </div>
          </div>

          {/* About Content */}
          <div className="mb-8">
            <h2
              className="text-3xl font-bold mb-6"
              style={{
                fontFamily: 'SimplySweetSerif, serif',
                color: 'rgb(140, 190, 175)'
              }}
            >
              About Baker Beanie
            </h2>
            <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed max-w-2xl mx-auto" style={{ fontFamily: 'Raleway, sans-serif' }}>
              Welcome to baker beanie! A blog full of tasty, mostly plant-based recipes.
            </p>
          </div>

          {/* Every day is treat day section */}
          <div>
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
        </div>
      </div>
    </section>
  )
}