/**
 * Vercel Blob Image Helper
 *
 * Manages recipe image URLs, serving from Vercel Blob Storage in production
 * and falling back to local files in development.
 * Includes backup URL support for GitHub Pages fallback.
 */

const BLOB_BASE_URL = process.env.NEXT_PUBLIC_BLOB_URL || '';
const BACKUP_URL = process.env.NEXT_PUBLIC_BACKUP_IMAGE_URL || '';
const USE_BLOB = process.env.NODE_ENV === 'production' || process.env.USE_BLOB === 'true';

/**
 * Get the full URL for a recipe image
 *
 * @param imagePath - Path like "/images/recipes/acai-bowl.jpeg"
 * @returns Full URL to image (Blob in production, local in development)
 */
export function getRecipeImageUrl(imagePath: string): string {
  // Extract filename from path
  const filename = imagePath.split('/').pop();

  if (!filename) {
    console.warn('Invalid image path:', imagePath);
    return imagePath; // Return original path as fallback
  }

  // In production or when USE_BLOB is enabled, use Blob Storage
  if (USE_BLOB && BLOB_BASE_URL) {
    return `${BLOB_BASE_URL}/recipes/${filename}`;
  }

  // In development, use local images
  return imagePath;
}

/**
 * Check if an image should be loaded from Blob Storage
 *
 * @param imagePath - Image path to check
 * @returns true if image is a recipe image
 */
export function isRecipeImage(imagePath: string): boolean {
  return imagePath.includes('/images/recipes/');
}

/**
 * Transform image path to Blob URL if it's a recipe image
 *
 * @param imagePath - Original image path
 * @returns Blob URL for recipe images, original path for others
 */
export function transformImagePath(imagePath: string): string {
  if (isRecipeImage(imagePath)) {
    return getRecipeImageUrl(imagePath);
  }
  return imagePath;
}

/**
 * Get backup URL for fallback (GitHub Pages)
 *
 * @param imagePath - Path like "/images/recipes/acai-bowl.jpeg"
 * @returns GitHub Pages URL for the image, or original path if backup not configured
 */
export function getBackupImageUrl(imagePath: string): string {
  const filename = imagePath.split('/').pop();

  if (!filename || !BACKUP_URL) {
    return imagePath;
  }

  return `${BACKUP_URL}/${filename}`;
}
