#!/usr/bin/env node

/**
 * Cleanup unused Vercel Blob images
 *
 * Compares blob storage with local recipe images and deletes orphaned blobs.
 *
 * Usage:
 *   node scripts/cleanup-blob-images.js
 *
 * Options:
 *   --dry-run    Show what would be deleted without actually deleting
 */

require('dotenv').config({ path: '.env.local' });
const { list, del } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

const RECIPES_DIR = path.join(__dirname, '../public/images/recipes');
const DRY_RUN = process.argv.includes('--dry-run');

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('❌ Error: BLOB_READ_WRITE_TOKEN environment variable is required');
  process.exit(1);
}

async function cleanup() {
  console.log('🧹 Cleaning up unused Vercel Blob images...\n');

  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - no files will be deleted\n');
  }

  // Get local image filenames
  const localFiles = new Set(
    fs.readdirSync(RECIPES_DIR)
      .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
  );

  console.log(`📁 Found ${localFiles.size} local images\n`);

  // List all blobs
  let cursor;
  const allBlobs = [];

  console.log('📡 Fetching blobs from Vercel...');

  do {
    const response = await list({
      token: process.env.BLOB_READ_WRITE_TOKEN,
      prefix: 'recipes/',
      cursor,
    });

    allBlobs.push(...response.blobs);
    cursor = response.cursor;
  } while (cursor);

  console.log(`☁️  Found ${allBlobs.length} blobs in storage\n`);

  // Find orphaned blobs (in blob storage but not in local)
  const orphanedBlobs = allBlobs.filter(blob => {
    const filename = blob.pathname.replace('recipes/', '');
    return !localFiles.has(filename);
  });

  if (orphanedBlobs.length === 0) {
    console.log('✅ No orphaned blobs found. Storage is clean!');
    return;
  }

  console.log(`🗑️  Found ${orphanedBlobs.length} orphaned blob(s):\n`);

  orphanedBlobs.forEach(blob => {
    const filename = blob.pathname.replace('recipes/', '');
    const sizeKB = (blob.size / 1024).toFixed(2);
    console.log(`   - ${filename} (${sizeKB} KB)`);
  });

  if (DRY_RUN) {
    console.log('\n🔍 DRY RUN - no files were deleted');
    console.log('   Run without --dry-run to delete these files');
    return;
  }

  console.log('\n🗑️  Deleting orphaned blobs...\n');

  let deleted = 0;
  let errors = 0;

  for (const blob of orphanedBlobs) {
    try {
      await del(blob.url, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      deleted++;
      console.log(`   ✅ Deleted: ${blob.pathname.replace('recipes/', '')}`);
    } catch (error) {
      errors++;
      console.error(`   ❌ Failed to delete ${blob.pathname}: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Cleanup Summary');
  console.log('='.repeat(50));
  console.log(`✅ Deleted: ${deleted} blobs`);
  if (errors > 0) {
    console.log(`❌ Errors: ${errors}`);
  }
  console.log('\n🎉 Cleanup complete!');
}

cleanup().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
