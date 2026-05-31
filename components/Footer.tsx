export default function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="mt-16 border-t border-[var(--border)] py-8 text-center text-sm text-gray-500 dark:text-gray-400">
      <div className="page-shell">
        <p>
          &copy; Baker Beanie {currentYear}. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
