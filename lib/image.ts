import { getPlaiceholder } from 'plaiceholder'
import fs from 'fs/promises'
import path from 'path'

export async function getBlurDataURL(imagePath: string) {
  try {
    let file: Buffer

    // Check if it's a remote URL (blob storage)
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      const response = await fetch(imagePath)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`)
      }
      const arrayBuffer = await response.arrayBuffer()
      file = Buffer.from(arrayBuffer)
    } else {
      // Local file path
      const fullPath = path.join(process.cwd(), 'public', imagePath)
      file = await fs.readFile(fullPath)
    }

    const { base64 } = await getPlaiceholder(file)
    return base64
  } catch (error) {
    console.error(`Error generating blur data URL for ${imagePath}:`, error)
    return undefined
  }
}

export async function getImageWithBlur(imagePath: string) {
  const blurDataURL = await getBlurDataURL(imagePath)
  return {
    src: imagePath,
    blurDataURL,
  }
}