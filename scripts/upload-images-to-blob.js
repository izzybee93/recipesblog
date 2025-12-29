#!/usr/bin/env node

/**
 * Upload Recipe Images to Vercel Blob Storage
 *
 * This script uploads all recipe images from public/images/recipes/
 * to Vercel Blob Storage, preserving the filename structure.
 *
 * Usage:
 *   BLOB_READ_WRITE_TOKEN=your_token node scripts/upload-images-to-blob.js
 *
 * Environment Variables:
 *   BLOB_READ_WRITE_TOKEN - Vercel Blob read/write token (required)
 */

const { put, list } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

const RECIPES_DIR = path.join(__dirname, '../public/images/recipes');
const MAPPING_FILE = path.join(__dirname, '../blob-image-mapping.json');

// Check for Blob token
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('❌ Error: BLOB_READ_WRITE_TOKEN environment variable is required');
  console.error('');
  console.error('Please set it in your .env.local file or run:');
  console.error('  BLOB_READ_WRITE_TOKEN=your_token npm run upload-recipe-images');
  console.error('');
  console.error('Get your token from: https://vercel.com/dashboard → Storage → Blob');
  process.exit(1);
}

async function uploadImages() {
  console.log('🖼️  Starting recipe image upload to Vercel Blob...\n');

  // Check if recipes directory exists
  if (!fs.existsSync(RECIPES_DIR)) {
    console.error(`❌ Error: Directory not found: ${RECIPES_DIR}`);
    process.exit(1);
  }

  // Get all image files
  const files = fs.readdirSync(RECIPES_DIR).filter(file =>
    /\.(jpg|jpeg|png|webp)$/i.test(file)
  );

  if (files.length === 0) {
    console.log('⚠️  No images found in public/images/recipes/');
    process.exit(0);
  }

  console.log(`Found ${files.length} images to upload\n`);

  const mapping = {};
  const errors = [];
  let uploaded = 0;

  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const filePath = path.join(RECIPES_DIR, filename);
    const blobPath = `recipes/${filename}`;

    try {
      // Read file
      const fileBuffer = fs.readFileSync(filePath);
      const stats = fs.statSync(filePath);
      const fileSizeKB = (stats.size / 1024).toFixed(2);

      // Upload to Blob
      console.log(`[${i + 1}/${files.length}] Uploading ${filename} (${fileSizeKB} KB)...`);

      const blob = await put(blobPath, fileBuffer, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      // Save mapping
      mapping[filename] = {
        url: blob.url,
        uploadedAt: new Date().toISOString(),
        size: stats.size,
        path: blobPath
      };

      uploaded++;
      console.log(`   ✅ ${blob.url}`);

    } catch (error) {
      errors.push({ filename, error: error.message });
      console.error(`   ❌ Failed: ${error.message}`);
    }
  }

  // Save mapping file
  fs.writeFileSync(MAPPING_FILE, JSON.stringify(mapping, null, 2));

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Upload Summary');
  console.log('='.repeat(60));
  console.log(`✅ Successfully uploaded: ${uploaded}/${files.length} images`);

  if (errors.length > 0) {
    console.log(`❌ Failed: ${errors.length} images\n`);
    errors.forEach(({ filename, error }) => {
      console.log(`   - ${filename}: ${error}`);
    });
  }

  console.log(`\n📝 Mapping saved to: ${MAPPING_FILE}`);
  console.log('\n🎉 Upload complete!');

  if (uploaded > 0) {
    console.log('\nNext steps:');
    console.log('1. Set NEXT_PUBLIC_BLOB_URL in your Vercel project settings');
    console.log('2. Deploy your site to use Blob images');
    console.log('3. Run verify-blob-images.js to check all uploads');
  }

  process.exit(errors.length > 0 ? 1 : 0);
}

uploadImages().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
