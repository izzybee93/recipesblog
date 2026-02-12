#!/usr/bin/env node

/**
 * Generate blur placeholder data for all recipe images.
 *
 * Reads images from public/images/recipes/ (local files, no network),
 * creates tiny base64 blur strings via plaiceholder, and writes them
 * to blur-data.json at the project root.
 *
 * Run this whenever you add or change recipe images:
 *   npm run generate-blur
 *
 * The JSON file should be committed to the repo so that Vercel builds
 * never need to fetch full images just for blur placeholders.
 */

const fs = require('fs')
const path = require('path')

async function main() {
  // Dynamic import for ESM-only plaiceholder
  const { getPlaiceholder } = await import('plaiceholder')

  const imagesDir = path.join(__dirname, '..', 'public', 'images', 'recipes')
  const outputPath = path.join(__dirname, '..', 'blur-data.json')

  if (!fs.existsSync(imagesDir)) {
    console.error('Images directory not found:', imagesDir)
    process.exit(1)
  }

  const files = fs.readdirSync(imagesDir).filter(f =>
    /\.(jpe?g|png|webp|avif)$/i.test(f)
  )

  console.log(`Found ${files.length} images. Generating blur data...`)

  // Load existing data to support incremental updates
  let existing = {}
  if (fs.existsSync(outputPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(outputPath, 'utf8'))
    } catch {
      // Start fresh if file is corrupted
    }
  }

  const blurData = {}
  let generated = 0
  let skipped = 0
  let errors = 0

  for (const file of files) {
    const imagePath = `/images/recipes/${file}`

    // Skip if we already have blur data for this file (unless --force)
    if (existing[imagePath] && !process.argv.includes('--force')) {
      blurData[imagePath] = existing[imagePath]
      skipped++
      continue
    }

    try {
      const buffer = fs.readFileSync(path.join(imagesDir, file))
      const { base64 } = await getPlaiceholder(buffer)
      blurData[imagePath] = base64
      generated++

      if (generated % 50 === 0) {
        console.log(`  Processed ${generated + skipped}/${files.length}...`)
      }
    } catch (err) {
      console.warn(`  Warning: Failed to generate blur for ${file}:`, err.message)
      errors++
    }
  }

  // Sort keys for stable diffs
  const sorted = {}
  for (const key of Object.keys(blurData).sort()) {
    sorted[key] = blurData[key]
  }

  fs.writeFileSync(outputPath, JSON.stringify(sorted, null, 2) + '\n')

  console.log(`\nDone! ${generated} generated, ${skipped} cached, ${errors} errors.`)
  console.log(`Wrote ${Object.keys(sorted).length} entries to blur-data.json`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
