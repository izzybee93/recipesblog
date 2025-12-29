#!/usr/bin/env node

/**
 * Verify Recipe Images in Vercel Blob Storage
 *
 * This script verifies that all recipe images have been successfully
 * uploaded to Vercel Blob Storage and are accessible.
 *
 * Usage:
 *   node scripts/verify-blob-images.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const MAPPING_FILE = path.join(__dirname, '../blob-image-mapping.json');
const RECIPES_DIR = path.join(__dirname, '../public/images/recipes');

/**
 * Check if a URL is accessible
 */
function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, { method: 'HEAD' }, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => {
      resolve(false);
    });
  });
}

async function verifyImages() {
  console.log('🔍 Verifying recipe images in Vercel Blob...\n');

  // Check if mapping file exists
  if (!fs.existsSync(MAPPING_FILE)) {
    console.error('❌ Error: Mapping file not found');
    console.error(`   Expected at: ${MAPPING_FILE}`);
    console.error('\n   Run upload-images-to-blob.js first');
    process.exit(1);
  }

  // Load mapping
  const mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));
  const files = Object.keys(mapping);

  if (files.length === 0) {
    console.log('⚠️  No images in mapping file');
    process.exit(0);
  }

  console.log(`Checking ${files.length} images...\n`);

  const results = {
    accessible: [],
    missing: [],
    errors: []
  };

  // Check each image
  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const { url } = mapping[filename];

    process.stdout.write(`[${i + 1}/${files.length}] ${filename}...`);

    try {
      const isAccessible = await checkUrl(url);

      if (isAccessible) {
        results.accessible.push(filename);
        console.log(' ✅');
      } else {
        results.missing.push(filename);
        console.log(' ❌ Not accessible');
      }
    } catch (error) {
      results.errors.push({ filename, error: error.message });
      console.log(` ❌ Error: ${error.message}`);
    }
  }

  // Get local files for comparison
  const localFiles = fs.existsSync(RECIPES_DIR)
    ? fs.readdirSync(RECIPES_DIR).filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
    : [];

  const uploadedSet = new Set(files);
  const notUploaded = localFiles.filter(file => !uploadedSet.has(file));

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Verification Summary');
  console.log('='.repeat(60));
  console.log(`✅ Accessible: ${results.accessible.length}/${files.length} images`);
  console.log(`❌ Missing/Inaccessible: ${results.missing.length} images`);
  console.log(`⚠️  Errors: ${results.errors.length} images`);

  if (notUploaded.length > 0) {
    console.log(`\n📁 Local files not yet uploaded: ${notUploaded.length}`);
    notUploaded.forEach(file => console.log(`   - ${file}`));
  }

  if (results.missing.length > 0) {
    console.log('\n❌ Inaccessible images:');
    results.missing.forEach(file => console.log(`   - ${file}`));
  }

  if (results.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    results.errors.forEach(({ filename, error }) =>
      console.log(`   - ${filename}: ${error}`)
    );
  }

  if (results.accessible.length === files.length) {
    console.log('\n🎉 All images verified successfully!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some images need attention');
    process.exit(1);
  }
}

verifyImages().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
