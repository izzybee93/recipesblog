export default function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="text-center py-8 text-gray-500 text-sm border-t border-gray-200 mt-16">
      <div className="container mx-auto px-4">
        <p>
          &copy; Baker Beanie {currentYear}. All rights reserved.
        </p>
      </div>
    </footer>
  )
}