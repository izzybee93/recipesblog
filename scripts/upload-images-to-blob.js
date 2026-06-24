#!/usr/bin/env node

/**
 * Upload Recipe Images to Vercel Blob Storage (Smart Version)
 *
 * This script intelligently uploads only NEW or MODIFIED recipe images
 * using file hash comparison to detect actual changes.
 *
 * Features:
 * - Only uploads new/changed images (based on MD5 hash)
 * - Automatically deletes blobs for images that were removed locally
 * - Tracks upload history in blob-image-mapping.json
 * - Fast: skips unchanged images
 *
 * Usage:
 *   BLOB_READ_WRITE_TOKEN=your_token node scripts/upload-images-to-blob.js
 *
 * Options:
 *   --force       Upload all images regardless of changes
 *   --no-delete   Skip deletion of removed images (keep old blobs)
 *
 * Environment Variables:
 *   BLOB_READ_WRITE_TOKEN - Vercel Blob read/write token (required)
 */

const { put, del } = require('@vercel/blob');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const RECIPES_DIR = path.join(__dirname, '../public/images/recipes');
const MAPPING_FILE = path.join(__dirname, '../blob-image-mapping.json');
const PRODUCTION_MAX_BYTES = 1024 * 1024;
const PRODUCTION_QUALITY_STEPS = [88, 82, 75];
const PRODUCTION_FALLBACK_WIDTHS = [1280, 1024, 960];

// Parse command line args
const args = process.argv.slice(2);
const FORCE_UPLOAD = args.includes('--force');
const DELETE_REMOVED = !args.includes('--no-delete'); // Delete by default, unless --no-delete is specified

function requireBlobToken() {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return;
  }

  console.error('❌ Error: BLOB_READ_WRITE_TOKEN environment variable is required');
  console.error('');
  console.error('Please set it in your .env.local file or run:');
  console.error('  BLOB_READ_WRITE_TOKEN=your_token npm run upload-recipe-images');
  console.error('');
  console.error('Get your token from: https://vercel.com/dashboard → Storage → Blob');
  process.exit(1);
}

async function optimizeProductionImage(filePath) {
  const beforeBytes = fs.statSync(filePath).size;

  if (beforeBytes <= PRODUCTION_MAX_BYTES) {
    return {
      optimized: false,
      beforeBytes,
      afterBytes: beforeBytes,
      method: 'unchanged',
    };
  }

  const source = fs.readFileSync(filePath);

  for (const quality of PRODUCTION_QUALITY_STEPS) {
    const buffer = await sharp(source)
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();

    if (buffer.length <= PRODUCTION_MAX_BYTES) {
      fs.writeFileSync(filePath, buffer);
      return {
        optimized: true,
        beforeBytes,
        afterBytes: buffer.length,
        method: `q${quality}, mozjpeg`,
      };
    }
  }

  for (const width of PRODUCTION_FALLBACK_WIDTHS) {
    for (const quality of PRODUCTION_QUALITY_STEPS) {
      const buffer = await sharp(source)
        .resize({ width, withoutEnlargement: true })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();

      if (buffer.length <= PRODUCTION_MAX_BYTES) {
        fs.writeFileSync(filePath, buffer);
        return {
          optimized: true,
          beforeBytes,
          afterBytes: buffer.length,
          method: `${width}w, q${quality}, mozjpeg`,
        };
      }
    }
  }

  throw new Error(`Could not optimize ${path.basename(filePath)} below 1MB`);
}

/**
 * Calculate MD5 hash of a file
 */
function getFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(fileBuffer).digest('hex');
}

/**
 * Load existing mapping file
 */
function loadMapping() {
  if (!fs.existsSync(MAPPING_FILE)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));
  } catch (error) {
    console.warn('⚠️  Warning: Could not parse mapping file, starting fresh');
    return {};
  }
}

/**
 * Save mapping file
 */
function saveMapping(mapping) {
  fs.writeFileSync(MAPPING_FILE, JSON.stringify(mapping, null, 2));
}

async function uploadImages() {
  requireBlobToken();

  console.log('🖼️  Smart recipe image upload to Vercel Blob...\n');

  // Check if recipes directory exists
  if (!fs.existsSync(RECIPES_DIR)) {
    console.error(`❌ Error: Directory not found: ${RECIPES_DIR}`);
    process.exit(1);
  }

  // Get all image files
  const files = fs.readdirSync(RECIPES_DIR).filter(file =>
    /\.(jpg|jpeg|png|webp)$/i.test(file) && file !== '.gitkeep'
  );

  if (files.length === 0) {
    console.log('⚠️  No images found in public/images/recipes/');
    process.exit(0);
  }

  // Load existing mapping
  const mapping = loadMapping();
  const previousFiles = new Set(Object.keys(mapping));

  // Categorize files
  const newFiles = [];
  const modifiedFiles = [];
  const unchangedFiles = [];
  const currentFiles = new Set();

  console.log('🔍 Analyzing local images...\n');

  for (const filename of files) {
    currentFiles.add(filename);
    const filePath = path.join(RECIPES_DIR, filename);
    const optimization = await optimizeProductionImage(filePath);

    if (optimization.optimized) {
      const beforeKB = (optimization.beforeBytes / 1024).toFixed(0);
      const afterKB = (optimization.afterBytes / 1024).toFixed(0);
      console.log(`   📦 Optimized production image: ${filename} ${beforeKB}KB → ${afterKB}KB (${optimization.method})`);
    }

    const currentHash = getFileHash(filePath);
    const stats = fs.statSync(filePath);

    if (!mapping[filename]) {
      // New file
      newFiles.push({ filename, hash: currentHash, size: stats.size });
    } else if (!mapping[filename].hash) {
      // Migration: mapping exists but no hash (from old upload script)
      // Check if file size changed - if so, re-upload
      const sizeChanged = mapping[filename].size && mapping[filename].size !== stats.size;

      if (sizeChanged) {
        // File was modified since last upload
        modifiedFiles.push({ filename, hash: currentHash, size: stats.size });
        console.log(`   ℹ️  Size changed (migration): ${filename} - will re-upload`);
      } else {
        // Size matches or no size tracked - assume unchanged, add hash
        mapping[filename].hash = currentHash;
        unchangedFiles.push(filename);
        console.log(`   ℹ️  Adding hash to existing entry: ${filename}`);
      }
    } else if (mapping[filename].hash !== currentHash || FORCE_UPLOAD) {
      // Modified file
      modifiedFiles.push({ filename, hash: currentHash, size: stats.size });
    } else {
      // Unchanged file
      unchangedFiles.push(filename);
    }
  }

  // Detect deleted files
  const deletedFiles = Array.from(previousFiles).filter(f => !currentFiles.has(f));

  // Summary
  console.log('📊 Analysis Results:');
  console.log(`   New images:       ${newFiles.length}`);
  console.log(`   Modified images:  ${modifiedFiles.length}`);
  console.log(`   Unchanged images: ${unchangedFiles.length}`);
  console.log(`   Deleted images:   ${deletedFiles.length}`);
  console.log('');

  const toUpload = [...newFiles, ...modifiedFiles];

  if (toUpload.length === 0 && deletedFiles.length === 0) {
    console.log('✅ All images are up to date! Nothing to do.');
    process.exit(0);
  }

  // Upload new/modified images
  const errors = [];
  let uploaded = 0;

  if (toUpload.length > 0) {
    console.log(`⬆️  Uploading ${toUpload.length} image(s)...\n`);

    for (let i = 0; i < toUpload.length; i++) {
      const { filename, hash, size } = toUpload[i];
      const filePath = path.join(RECIPES_DIR, filename);
      const blobPath = `recipes/${filename}`;
      const fileSizeKB = (size / 1024).toFixed(2);
      const status = newFiles.some(f => f.filename === filename) ? 'NEW' : 'MODIFIED';

      try {
        console.log(`[${i + 1}/${toUpload.length}] ${status}: ${filename} (${fileSizeKB} KB)`);

        const fileBuffer = fs.readFileSync(filePath);
        const blob = await put(blobPath, fileBuffer, {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN,
          addRandomSuffix: false,  // Keep exact filename
          allowOverwrite: true,     // Allow overwriting existing blobs
        });

        // Update mapping
        mapping[filename] = {
          url: blob.url,
          hash: hash,
          uploadedAt: new Date().toISOString(),
          size: size,
          path: blobPath
        };

        uploaded++;
        console.log(`   ✅ ${blob.url}`);

      } catch (error) {
        errors.push({ filename, error: error.message });
        console.error(`   ❌ Failed: ${error.message}`);
      }
    }
  }

  // Handle deleted images
  let deleted = 0;
  if (deletedFiles.length > 0) {
    console.log(`\n🗑️  Found ${deletedFiles.length} deleted image(s)`);

    if (DELETE_REMOVED) {
      console.log('   Removing from Blob Storage...\n');

      for (const filename of deletedFiles) {
        try {
          const blobUrl = mapping[filename].url;
          await del(blobUrl, {
            token: process.env.BLOB_READ_WRITE_TOKEN,
          });

          delete mapping[filename];
          deleted++;
          console.log(`   ✅ Deleted: ${filename}`);
        } catch (error) {
          console.error(`   ❌ Failed to delete ${filename}: ${error.message}`);
        }
      }
    } else {
      console.log('   Keeping in Blob Storage (--no-delete flag specified)');
      deletedFiles.forEach(f => console.log(`   - ${f}`));
    }
  }

  // Save updated mapping
  saveMapping(mapping);

  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Upload Summary');
  console.log('='.repeat(60));
  console.log(`✅ Uploaded:   ${uploaded}/${toUpload.length} images`);
  console.log(`⏭️  Skipped:    ${unchangedFiles.length} unchanged images`);
  if (deleted > 0) {
    console.log(`🗑️  Deleted:    ${deleted} images from Blob`);
  }

  if (errors.length > 0) {
    console.log(`❌ Failed:     ${errors.length} images\n`);
    errors.forEach(({ filename, error }) => {
      console.log(`   - ${filename}: ${error}`);
    });
  }

  console.log(`\n📝 Mapping saved to: ${MAPPING_FILE}`);
  console.log('\n🎉 Upload complete!');

  if (uploaded > 0) {
    console.log('\nℹ️  Deploy your site to see updated images in production');
  }

  process.exit(errors.length > 0 ? 1 : 0);
}

if (require.main === module) {
  uploadImages().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  PRODUCTION_MAX_BYTES,
  optimizeProductionImage,
  uploadImages,
};
