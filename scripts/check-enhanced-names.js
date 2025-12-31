#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ENHANCED_DIR = path.join(__dirname, '../public/images/recipes-enhanced/approved');
const ORIGINAL_DIR = path.join(__dirname, '../public/images/recipes');
const BACKUP_FILE = path.join(__dirname, '../name-standardization-backup.json');

const enhanced = fs.readdirSync(ENHANCED_DIR).filter(f => f !== '.DS_Store');
const originals = fs.readdirSync(ORIGINAL_DIR);

// Load the name mapping from standardization
const backup = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
const nameMapping = {};

backup.changes.forEach(change => {
  // Map old image name to new name
  const oldImageName = path.basename(change.imagePath);
  const newImageName = path.basename(change.newName + path.extname(oldImageName));
  if (oldImageName !== newImageName) {
    nameMapping[oldImageName] = newImageName;
  }

  // Also map old slug-based names
  const oldSlugImage = change.oldSlug + path.extname(oldImageName);
  if (oldSlugImage !== newImageName && oldSlugImage !== oldImageName) {
    nameMapping[oldSlugImage] = newImageName;
  }
});

console.log('Checking enhanced images against standardized names...\n');

const needRename = [];
const matched = [];

enhanced.forEach(enhancedFile => {
  if (originals.includes(enhancedFile)) {
    matched.push(enhancedFile);
  } else {
    // Check if this enhanced image has an old name
    const enhancedBase = enhancedFile.replace(/\.(jpeg|jpg|png|webp)$/i, '');
    const enhancedExt = path.extname(enhancedFile);

    // Try to find the new name from mapping
    let newName = nameMapping[enhancedFile];

    if (!newName) {
      // Try with different extension
      const withJpeg = enhancedBase + '.jpeg';
      const withJpg = enhancedBase + '.jpg';
      const withPng = enhancedBase + '.png';

      newName = nameMapping[withJpeg] || nameMapping[withJpg] || nameMapping[withPng];
    }

    if (!newName) {
      // Check if there's a matching original with different extension
      const matchWithDiffExt = originals.find(orig => {
        const origBase = orig.replace(/\.(jpeg|jpg|png|webp)$/i, '');
        return origBase === enhancedBase;
      });

      if (matchWithDiffExt) {
        newName = matchWithDiffExt;
      }
    }

    if (newName && originals.includes(newName)) {
      needRename.push({
        current: enhancedFile,
        target: newName,
        currentPath: path.join(ENHANCED_DIR, enhancedFile),
        targetPath: path.join(ENHANCED_DIR, newName)
      });
    } else {
      needRename.push({
        current: enhancedFile,
        target: null,
        reason: 'No matching original found (might be deleted/missing)'
      });
    }
  }
});

console.log(`✅ Enhanced images with matching names: ${matched.length}`);
console.log(`⚠️  Enhanced images needing rename: ${needRename.length}\n`);

if (needRename.length > 0) {
  console.log('Enhanced images to rename:\n');
  needRename.forEach((item, i) => {
    if (item.target) {
      console.log(`${i + 1}. ${item.current}`);
      console.log(`   → ${item.target}`);
    } else {
      console.log(`${i + 1}. ${item.current}`);
      console.log(`   → ${item.reason}`);
    }
  });

  // Export for renaming script
  const renameList = needRename.filter(item => item.target).map(item => ({
    current: item.current,
    target: item.target,
    currentPath: item.currentPath,
    targetPath: item.targetPath
  }));

  fs.writeFileSync(
    path.join(__dirname, '../enhanced-rename-list.json'),
    JSON.stringify(renameList, null, 2)
  );

  console.log(`\n💾 Rename list saved to: enhanced-rename-list.json`);
  console.log(`   ${renameList.length} files ready to rename`);
}
