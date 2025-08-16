import { getPlaiceholder } from 'plaiceholder'
import fs from 'fs/promises'
import path from 'path'

export async function getBlurDataURL(imagePath: string) {
  try {
    const fullPath = path.join(process.cwd(), 'public', imagePath)
    const file = await fs.readFile(fullPath)
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