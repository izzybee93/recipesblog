'use client'

import Image from "next/image"
import { navigateHomeFromLogo } from '@/lib/navigation-actions'

export default function Header() {
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault()
    navigateHomeFromLogo()
  }

  return (
    <header className="border-b border-[var(--border)]">
      <div className="page-shell py-6 md:py-7">
        <div className="font-display mx-auto flex max-w-[760px] flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center md:gap-x-4">
          <h1
            className="font-normal leading-none text-gray-800 text-[clamp(2.25rem,7vw,4rem)] dark:text-white"
          >
            Baker
          </h1>

          <a href="/" onClick={handleLogoClick} className="block min-h-12 min-w-12 rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-4 focus:ring-offset-[var(--background)]">
            <Image
              src="/bee.png"
              alt="Baker Beanie Logo"
              width={104}
              height={104}
              className="h-16 w-16 transition-transform duration-150 hover:scale-[1.03] md:h-24 md:w-24"
              priority
            />
          </a>

          <h1
            className="font-normal leading-none text-gray-800 text-[clamp(2.25rem,7vw,4rem)] dark:text-white"
          >
            Beanie
          </h1>
        </div>
      </div>
    </header>
  )
}
