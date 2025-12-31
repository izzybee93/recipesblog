#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ENHANCED_DIR = path.join(__dirname, '../public/images/recipes-enhanced/approved');
const PREVIEWS_DIR = path.join(__dirname, '../public/images/recipes-enhanced/previews');

// Manual mapping for the 9 files that need renaming
const renames = [
  { from: 'artisan-bread.jpeg', to: 'artisan-bread.jpg' },
  { from: 'baked-falafel.jpeg', to: 'baked-falafel.jpg' },
  { from: 'best-chocolate-cake.jpeg', to: 'chocolate-cake.jpeg' },
  { from: 'best-creamy-broccoli-pasta.jpeg', to: 'creamy-broccoli-pasta.jpeg' },
  { from: 'best-creamy-mushroom-pasta.jpeg', to: 'creamy-mushroom-pasta.jpeg' },
  { from: 'buttermilk-scones.jpeg', to: 'buttermilk-scones.jpg' },
  { from: 'carrot-couscous-salad.jpeg', to: 'carrot-couscous-salad.png' },
  { from: 'cauliflower-steak.jpeg', to: 'cauliflower-steak.jpg' },
  { from: 'chickpea-roasted-veg-salad.jpeg', to: 'chickpea-and-roasted-vegetable-salad.jpeg' }
];

console.log('🔄 Renaming enhanced images to match standardized names...\n');

let renamed = 0;
let errors = [];

for (const rename of renames) {
  const fromPath = path.join(ENHANCED_DIR, rename.from);
  const toPath = path.join(ENHANCED_DIR, rename.to);

  try {
    if (fs.existsSync(fromPath)) {
      // Check if target already exists
      if (fs.existsSync(toPath)) {
        console.log(`⚠️  Skipped (target exists): ${rename.from}`);
        continue;
      }

      fs.renameSync(fromPath, toPath);
      renamed++;
      console.log(`✅ Renamed: ${rename.from}`);
      console.log(`   → ${rename.to}`);

      // Also rename the preview if it exists
      const previewFrom = path.join(PREVIEWS_DIR, rename.from);
      const previewTo = path.join(PREVIEWS_DIR, rename.to);

      if (fs.existsSync(previewFrom)) {
        fs.renameSync(previewFrom, previewTo);
        console.log(`   (preview also renamed)`);
      }
    } else {
      console.log(`⚠️  Not found: ${rename.from}`);
    }
  } catch (error) {
    errors.push({ file: rename.from, error: error.message });
    console.error(`❌ Error renaming ${rename.from}: ${error.message}`);
  }
}

console.log('\n' + '='.repeat(60));
console.log('📊 SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Successfully renamed: ${renamed}`);
console.log(`❌ Errors: ${errors.length}`);

if (errors.length > 0) {
  console.log('\nErrors:');
  errors.forEach(e => console.log(`  ${e.file}: ${e.error}`));
}

console.log('\n✨ Enhanced images now match standardized names!');
