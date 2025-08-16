import Image from "next/image"
import Link from "next/link"

export default function Header() {
  return (
    <header className="text-center pt-8 pb-4">
      <div className="flex justify-center items-center flex-wrap gap-4 mb-4" style={{ fontFamily: 'SimplySweetSerif, serif' }}>
        <h1 
          className="font-normal text-gray-800"
          style={{ fontSize: '5rem' }}
        >
          Baker
        </h1>
        
        <Link href="/" className="block">
          <Image
            src="/bee.png"
            alt="Baker Beanie Logo"
            width={180}
            height={180}
            className="hover:scale-105 transition-transform"
          />
        </Link>
        
        <h1 
          className="font-normal text-gray-800"
          style={{ fontSize: '5rem' }}
        >
          Beanie
        </h1>
      </div>
    </header>
  )
}