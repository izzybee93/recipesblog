import Image from 'next/image'

export default function AboutFooter() {
  return (
    <section className="about-footer relative left-1/2 mt-16 w-screen -translate-x-1/2 bg-[var(--surface)] py-14 md:py-20">
      <div className="mx-auto max-w-[760px] px-4 md:px-8">
        <div className="max-w-3xl mx-auto text-center">
          {/* Author Image */}
          <div className="mb-6">
            <div className="relative mx-auto h-32 w-32">
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
              className="font-display text-[clamp(1.75rem,4vw,2.5rem)] font-bold mb-6"
              style={{
                color: 'var(--accent)'
              }}
            >
              About Baker Beanie
            </h2>
            <p className="font-body mx-auto max-w-2xl text-base leading-relaxed text-gray-700 dark:text-gray-300">
              Welcome to baker beanie! A blog full of tasty, mostly plant-based recipes.
            </p>
          </div>

          {/* Every day is treat day section */}
          <div className="pt-2">
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
        </div>
      </div>
    </section>
  )
}
