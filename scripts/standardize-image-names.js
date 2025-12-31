#!/usr/bin/env node

/**
 * Standardize Recipe Image Names
 *
 * Renames all recipe images to use dash-separated format (matching recipe slugs)
 * and updates all MDX files to reference the new names.
 *
 * Usage:
 *   node scripts/standardize-image-names.js          # Dry-run (preview only)
 *   node scripts/standardize-image-names.js --execute # Execute rename
 *
 * Safety features:
 * - Dry-run mode by default
 * - Conflict detection
 * - Backup mapping creation
 * - Validation before and after
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Parse command line args
const args = process.argv.slice(2);
const EXECUTE = args.includes('--execute');

const RECIPES_DIR = path.join(__dirname, '../content/recipes');
const IMAGES_DIR = path.join(__dirname, '../public/images/recipes');
const BACKUP_FILE = path.join(__dirname, '../image-rename-backup.json');

/**
 * Get all recipe MDX files
 */
function getAllRecipes() {
  const files = fs.readdirSync(RECIPES_DIR).filter(f => f.endsWith('.mdx'));
  const recipes = [];

  for (const file of files) {
    const filePath = path.join(RECIPES_DIR, file);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);

    const slug = file.replace('.mdx', '');

    if (data.featured_image) {
      recipes.push({
        slug,
        mdxPath: filePath,
        featuredImage: data.featured_image,
        frontmatter: data,
        content
      });
    }
  }

  return recipes;
}

/**
 * Extract filename from image path
 */
function getImageFilename(imagePath) {
  return path.basename(imagePath);
}

/**
 * Build rename mapping
 */
function buildRenameMapping(recipes) {
  const mapping = [];
  const conflicts = [];
  const alreadyCorrect = [];

  for (const recipe of recipes) {
    const currentFilename = getImageFilename(recipe.featuredImage);
    const currentPath = path.join(IMAGES_DIR, currentFilename);

    // Target filename should be slug + extension
    const ext = path.extname(currentFilename);
    const targetFilename = `${recipe.slug}${ext}`;
    const targetPath = path.join(IMAGES_DIR, targetFilename);

    // Check if file exists
    if (!fs.existsSync(currentPath)) {
      console.warn(`⚠️  Warning: Image not found: ${currentPath}`);
      continue;
    }

    // Skip if already correct
    if (currentFilename === targetFilename) {
      alreadyCorrect.push({
        recipe: recipe.slug,
        filename: currentFilename
      });
      continue;
    }

    // Check for conflicts (target already exists)
    if (fs.existsSync(targetPath) && currentPath !== targetPath) {
      conflicts.push({
        recipe: recipe.slug,
        currentFilename,
        targetFilename,
        issue: 'Target file already exists'
      });
      continue;
    }

    mapping.push({
      recipe: recipe.slug,
      mdxPath: recipe.mdxPath,
      currentFilename,
      targetFilename,
      currentPath,
      targetPath,
      currentImagePath: recipe.featuredImage,
      newImagePath: `/images/recipes/${targetFilename}`
    });
  }

  return { mapping, conflicts, alreadyCorrect };
}

/**
 * Display rename plan
 */
function displayPlan(mapping, conflicts, alreadyCorrect) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 IMAGE RENAME ANALYSIS');
  console.log('='.repeat(80) + '\n');

  console.log(`✅ Already correct: ${alreadyCorrect.length}`);
  console.log(`🔄 Need renaming:   ${mapping.length}`);
  console.log(`❌ Conflicts:       ${conflicts.length}`);
  console.log('');

  if (conflicts.length > 0) {
    console.log('❌ CONFLICTS DETECTED:\n');
    conflicts.forEach(c => {
      console.log(`   Recipe: ${c.recipe}`);
      console.log(`   Current: ${c.currentFilename}`);
      console.log(`   Target:  ${c.targetFilename}`);
      console.log(`   Issue:   ${c.issue}\n`);
    });
  }

  if (mapping.length > 0) {
    console.log('🔄 PLANNED RENAMES:\n');

    // Show first 10 examples
    const examples = mapping.slice(0, 10);
    examples.forEach(m => {
      console.log(`   ${m.currentFilename}`);
      console.log(`   → ${m.targetFilename}\n`);
    });

    if (mapping.length > 10) {
      console.log(`   ... and ${mapping.length - 10} more\n`);
    }
  }

  if (alreadyCorrect.length > 0) {
    console.log(`✅ ${alreadyCorrect.length} images already have correct names\n`);
  }
}

/**
 * Save backup mapping
 */
function saveBackup(mapping) {
  const backup = {
    timestamp: new Date().toISOString(),
    renames: mapping.map(m => ({
      recipe: m.recipe,
      oldFilename: m.currentFilename,
      newFilename: m.targetFilename,
      oldImagePath: m.currentImagePath,
      newImagePath: m.newImagePath,
      mdxPath: m.mdxPath
    }))
  };

  fs.writeFileSync(BACKUP_FILE, JSON.stringify(backup, null, 2));
  console.log(`💾 Backup saved to: ${BACKUP_FILE}\n`);
}

/**
 * Execute renames
 */
function executeRenames(mapping) {
  let filesRenamed = 0;
  let mdxUpdated = 0;
  const errors = [];

  console.log('🔄 Executing renames...\n');

  for (let i = 0; i < mapping.length; i++) {
    const m = mapping[i];
    const progress = `[${i + 1}/${mapping.length}]`;

    try {
      // 1. Rename the image file
      if (fs.existsSync(m.currentPath)) {
        fs.renameSync(m.currentPath, m.targetPath);
        filesRenamed++;
        console.log(`${progress} ✅ Renamed: ${m.currentFilename} → ${m.targetFilename}`);
      } else {
        console.log(`${progress} ⚠️  Skipped (not found): ${m.currentFilename}`);
      }

      // 2. Update the MDX file
      const fileContents = fs.readFileSync(m.mdxPath, 'utf8');
      const { data, content } = matter(fileContents);

      // Update featured_image path
      data.featured_image = m.newImagePath;

      // Reconstruct the MDX file
      const newContents = matter.stringify(content, data);
      fs.writeFileSync(m.mdxPath, newContents);
      mdxUpdated++;

    } catch (error) {
      errors.push({
        recipe: m.recipe,
        error: error.message
      });
      console.error(`${progress} ❌ Error: ${m.recipe} - ${error.message}`);
    }
  }

  return { filesRenamed, mdxUpdated, errors };
}

/**
 * Verify results
 */
function verifyResults(mapping) {
  console.log('\n🔍 Verifying results...\n');

  let verified = 0;
  let missing = [];

  for (const m of mapping) {
    if (fs.existsSync(m.targetPath)) {
      verified++;
    } else {
      missing.push(m.targetFilename);
    }
  }

  if (missing.length === 0) {
    console.log(`✅ All ${verified} images verified successfully!\n`);
  } else {
    console.log(`⚠️  ${verified} verified, ${missing.length} missing:\n`);
    missing.forEach(f => console.log(`   - ${f}`));
  }

  return { verified, missing };
}

/**
 * Main execution
 */
async function main() {
  console.log('\n🖼️  Recipe Image Name Standardization\n');

  if (EXECUTE) {
    console.log('⚠️  EXECUTE MODE: Changes will be made!\n');
  } else {
    console.log('👁️  DRY-RUN MODE: No changes will be made\n');
    console.log('   Run with --execute to apply changes\n');
  }

  // Get all recipes
  console.log('📖 Reading recipes...');
  const recipes = getAllRecipes();
  console.log(`   Found ${recipes.length} recipes with images\n`);

  // Build rename mapping
  console.log('🔍 Analyzing image names...');
  const { mapping, conflicts, alreadyCorrect } = buildRenameMapping(recipes);

  // Display plan
  displayPlan(mapping, conflicts, alreadyCorrect);

  // Check for conflicts
  if (conflicts.length > 0) {
    console.log('\n❌ Cannot proceed: Conflicts must be resolved first\n');
    process.exit(1);
  }

  if (mapping.length === 0) {
    console.log('\n✅ All image names are already standardized!\n');
    process.exit(0);
  }

  // Execute if requested
  if (EXECUTE) {
    console.log('='.repeat(80));

    // Save backup first
    saveBackup(mapping);

    // Execute renames
    const { filesRenamed, mdxUpdated, errors } = executeRenames(mapping);

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 EXECUTION SUMMARY');
    console.log('='.repeat(80) + '\n');
    console.log(`✅ Files renamed:  ${filesRenamed}`);
    console.log(`✅ MDX files updated: ${mdxUpdated}`);
    console.log(`❌ Errors:         ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:\n');
      errors.forEach(e => {
        console.log(`   ${e.recipe}: ${e.error}`);
      });
    }

    // Verify
    verifyResults(mapping);

    console.log('🎉 Image standardization complete!\n');
    console.log(`💾 Backup saved to: ${BACKUP_FILE}`);
    console.log('   Use this to rollback if needed\n');

  } else {
    console.log('\n' + '='.repeat(80));
    console.log('To execute these changes, run:');
    console.log('  node scripts/standardize-image-names.js --execute\n');
  }
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
