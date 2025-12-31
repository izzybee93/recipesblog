#!/usr/bin/env node

/**
 * Smart Recipe Name Standardization
 *
 * Uses intelligent heuristics to determine the most descriptive name
 * and standardizes both MDX files and images accordingly.
 *
 * Usage:
 *   node scripts/standardize-names-smart.js          # Analysis + preview
 *   node scripts/standardize-names-smart.js --execute # Execute changes
 *
 * Features:
 * - Smart name comparison (word count, abbreviations, length)
 * - Renames MDX files AND images to match best name
 * - Updates enhancement-progress.json
 * - Generates detailed change report
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Parse command line args
const args = process.argv.slice(2);
const EXECUTE = args.includes('--execute');

const RECIPES_DIR = path.join(__dirname, '../content/recipes');
const IMAGES_DIR = path.join(__dirname, '../public/images/recipes');
const PROGRESS_FILE = path.join(__dirname, '../enhancement-progress.json');
const BACKUP_FILE = path.join(__dirname, '../name-standardization-backup.json');
const CHANGES_FILE = path.join(__dirname, '../name-changes-report.json');

/**
 * Common abbreviations to detect
 */
const ABBREVIATIONS = {
  'veg': 'vegetable',
  'veggies': 'vegetables',
  'choc': 'chocolate',
  'pb': 'peanut-butter',
  'cinn': 'cinnamon',
  'cauli': 'cauliflower',
  'broc': 'broccoli',
  'trad': 'traditional',
  'ital': 'italian'
};

/**
 * Parse a filename into words (handles both hyphenated and concatenated)
 */
function parseWords(name) {
  // Remove extension
  const baseName = name.replace(/\.(mdx|jpeg|jpg|png|webp)$/i, '');

  // If has hyphens, split by hyphen
  if (baseName.includes('-')) {
    return baseName.split('-').filter(w => w.length > 0);
  }

  // Otherwise, it's concatenated - try to split by detecting word boundaries
  // This is a simple heuristic - won't be perfect but catches common patterns
  return [baseName]; // Keep as single "word" for comparison
}

/**
 * Detect if name has abbreviations
 */
function hasAbbreviations(words) {
  return words.some(word => ABBREVIATIONS[word.toLowerCase()]);
}

/**
 * Expand abbreviations in words
 */
function expandAbbreviations(words) {
  return words.map(word => {
    const lower = word.toLowerCase();
    return ABBREVIATIONS[lower] || word;
  });
}

/**
 * Calculate similarity between two name arrays
 */
function calculateSimilarity(words1, words2) {
  const set1 = new Set(words1.map(w => w.toLowerCase()));
  const set2 = new Set(words2.map(w => w.toLowerCase()));

  const intersection = new Set([...set1].filter(w => set2.has(w)));
  const union = new Set([...set1, ...set2]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Remove "best" from name (handles both hyphenated and concatenated)
 */
function removeBestWord(name) {
  // Handle hyphenated names
  let cleaned = name.replace(/^best-/i, ''); // Remove "best-" prefix
  cleaned = cleaned.replace(/-best-/gi, '-'); // Remove "-best-" in middle
  cleaned = cleaned.replace(/-best$/i, ''); // Remove "-best" suffix

  // Handle concatenated names (no hyphens)
  cleaned = cleaned.replace(/^best/i, ''); // Remove "best" prefix from concatenated

  // Clean up any double hyphens
  cleaned = cleaned.replace(/--+/g, '-');

  return cleaned;
}

/**
 * Normalize name for comparison (remove hyphens and special chars)
 */
function normalizeName(name) {
  return name.toLowerCase().replace(/[-_]/g, '');
}

/**
 * Normalize name for deep comparison (also remove connector words)
 */
function normalizeDeep(name) {
  return name
    .toLowerCase()
    .replace(/[-_]/g, '')
    .replace(/and/g, '')
    .replace(/with/g, '')
    .replace(/the/g, '')
    .replace(/on/g, '');
}

/**
 * Determine the best name using smart heuristics
 */
function determineBestName(slug, imageName) {
  const slugWords = parseWords(slug);
  const imageWords = parseWords(imageName);

  // Extract base names without extensions
  const slugBase = slug.replace('.mdx', '');
  const imageBase = imageName.replace(/\.(jpeg|jpg|png|webp)$/i, '');

  // Check if they're the same name (concatenated vs hyphenated)
  const slugNormalized = normalizeName(slugBase);
  const imageNormalized = normalizeName(imageBase);
  const areEquivalent = slugNormalized === imageNormalized;

  // Check if they're equivalent after removing connector words
  const slugDeepNormalized = normalizeDeep(slugBase);
  const imageDeepNormalized = normalizeDeep(imageBase);
  const areDeepEquivalent = slugDeepNormalized === imageDeepNormalized;

  // Score each name
  let slugScore = 0;
  let imageScore = 0;

  // 1. Word count (more words = more descriptive)
  slugScore += slugWords.length * 10;
  imageScore += imageWords.length * 10;

  // 2. Penalize abbreviations
  if (hasAbbreviations(slugWords)) slugScore -= 15;
  if (hasAbbreviations(imageWords)) imageScore -= 15;

  // 3. Reward hyphenated names (easier to read)
  if (slugBase.includes('-')) slugScore += 20;
  if (imageBase.includes('-')) imageScore += 20;

  // 4. Character length (longer = more descriptive, but diminishing returns)
  slugScore += Math.min(slugBase.length, 50);
  imageScore += Math.min(imageBase.length, 50);

  // 5. Similarity check - if very different, flag it
  const similarity = calculateSimilarity(
    expandAbbreviations(slugWords),
    expandAbbreviations(imageWords)
  );

  const decision = {
    slug: slugBase,
    imageName: imageBase,
    slugWords,
    imageWords,
    slugScore,
    imageScore,
    similarity,
    winner: slugScore > imageScore ? 'slug' : 'image',
    reason: '',
    needsReview: false
  };

  // Determine reason
  // If they're equivalent (concatenated vs hyphenated), treat specially
  if (areEquivalent) {
    // Same name, different format - choose hyphenated version
    if (slugBase.includes('-') && !imageBase.includes('-')) {
      decision.winner = 'slug';
      decision.reason = 'Slug is hyphenated, image is concatenated';
    } else if (imageBase.includes('-') && !slugBase.includes('-')) {
      decision.winner = 'image';
      decision.reason = 'Image is hyphenated, slug is concatenated';
    } else {
      decision.reason = 'Already identical';
    }
  } else if (areDeepEquivalent) {
    // Same name but one omits connector words like "and", "with"
    // Choose the longer, more descriptive one
    if (slugBase.length > imageBase.length) {
      decision.winner = 'slug';
      decision.reason = 'Slug is more descriptive (includes connector words)';
    } else {
      decision.winner = 'image';
      decision.reason = 'Image is more descriptive (includes connector words)';
    }
  } else if (similarity < 0.3) {
    // Names are quite different - use slug as canonical source
    // unless image is significantly longer (more descriptive)
    if (imageBase.length > slugBase.length * 1.2) {
      decision.winner = 'image';
      decision.reason = 'Image significantly more descriptive despite differences';
    } else {
      decision.winner = 'slug';
      decision.reason = 'Using slug as canonical name (image has typos/abbreviations/differences)';
    }
  } else if (!slugBase.includes('-') && !imageBase.includes('-')) {
    decision.winner = 'slug'; // Default to slug if both concatenated
    decision.reason = 'Both concatenated - using slug';
  } else if (!slugBase.includes('-')) {
    decision.winner = 'image';
    decision.reason = 'Image has hyphens, slug concatenated';
  } else if (!imageBase.includes('-')) {
    decision.winner = 'slug';
    decision.reason = 'Slug has hyphens, image concatenated';
  } else if (hasAbbreviations(slugWords) && !hasAbbreviations(imageWords)) {
    decision.winner = 'image';
    decision.reason = 'Slug has abbreviations, image full words';
  } else if (hasAbbreviations(imageWords) && !hasAbbreviations(slugWords)) {
    decision.winner = 'slug';
    decision.reason = 'Image has abbreviations, slug full words';
  } else if (imageWords.length > slugWords.length) {
    decision.winner = 'image';
    decision.reason = 'Image has more words (more descriptive)';
  } else if (slugWords.length > imageWords.length) {
    decision.winner = 'slug';
    decision.reason = 'Slug has more words (more descriptive)';
  } else {
    decision.reason = 'Similar quality - using ' + decision.winner;
  }

  return decision;
}

/**
 * Get all recipes
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
      const imageName = path.basename(data.featured_image);

      recipes.push({
        slug,
        slugFile: file,
        mdxPath: filePath,
        imageName,
        imagePath: path.join(IMAGES_DIR, imageName),
        featuredImagePath: data.featured_image,
        frontmatter: data,
        content
      });
    }
  }

  return recipes;
}

/**
 * Build comprehensive change plan
 */
function buildChangePlan(recipes) {
  const changes = [];
  const noChanges = [];
  const needsReview = [];

  for (const recipe of recipes) {
    // Determine best name
    const decision = determineBestName(recipe.slugFile, recipe.imageName);
    let bestName = decision.winner === 'slug' ? decision.slug : decision.imageName;

    // Remove "best" from name if present
    bestName = removeBestWord(bestName);

    // Check what needs to change
    const slugNeedsRename = decision.slug !== bestName;
    const imageNeedsRename = decision.imageName !== bestName;

    if (!slugNeedsRename && !imageNeedsRename) {
      noChanges.push({
        current: decision.slug,
        decision
      });
      continue;
    }

    const ext = path.extname(recipe.imageName);
    const change = {
      // Decision info
      decision,

      // Current state
      currentSlug: decision.slug,
      currentSlugFile: recipe.slugFile,
      currentImageName: decision.imageName,

      // Target state
      targetName: bestName,
      targetSlugFile: `${bestName}.mdx`,
      targetImageName: `${bestName}${ext}`,

      // Paths
      currentMdxPath: recipe.mdxPath,
      targetMdxPath: path.join(RECIPES_DIR, `${bestName}.mdx`),
      currentImagePath: recipe.imagePath,
      targetImagePath: path.join(IMAGES_DIR, `${bestName}${ext}`),

      // Flags
      needsSlugRename: slugNeedsRename,
      needsImageRename: imageNeedsRename,
      needsReview: decision.needsReview,

      // Image paths for MDX update
      newFeaturedImagePath: `/images/recipes/${bestName}${ext}`
    };

    if (change.needsReview) {
      needsReview.push(change);
    } else {
      changes.push(change);
    }
  }

  return { changes, noChanges, needsReview };
}

/**
 * Display analysis
 */
function displayAnalysis(changes, noChanges, needsReview) {
  console.log('\n' + '='.repeat(80));
  console.log('🧠 SMART NAME STANDARDIZATION ANALYSIS');
  console.log('='.repeat(80) + '\n');

  console.log(`✅ Already perfect:  ${noChanges.length}`);
  console.log(`🔄 Need changes:     ${changes.length}`);
  console.log(`⚠️  Need review:      ${needsReview.length}`);
  console.log('');

  if (needsReview.length > 0) {
    console.log('⚠️  ITEMS NEEDING MANUAL REVIEW:\n');
    needsReview.forEach(c => {
      console.log(`   Slug: ${c.currentSlug}`);
      console.log(`   Image: ${c.currentImageName}`);
      console.log(`   Reason: ${c.decision.reason}`);
      console.log(`   Similarity: ${(c.decision.similarity * 100).toFixed(0)}%\n`);
    });
  }

  if (changes.length > 0) {
    console.log('🔄 PLANNED CHANGES:\n');

    const examples = changes.slice(0, 15);
    examples.forEach(c => {
      console.log(`   Current: ${c.currentSlug} / ${c.currentImageName}`);
      console.log(`   Target:  ${c.targetName}`);
      console.log(`   Reason:  ${c.decision.reason}`);
      console.log(`   Changes: ${c.needsSlugRename ? 'MDX' : ''}${c.needsSlugRename && c.needsImageRename ? ' + ' : ''}${c.needsImageRename ? 'Image' : ''}\n`);
    });

    if (changes.length > 15) {
      console.log(`   ... and ${changes.length - 15} more\n`);
    }
  }
}

/**
 * Save detailed change report
 */
function saveChangeReport(changes, noChanges, needsReview) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      alreadyPerfect: noChanges.length,
      needChanges: changes.length,
      needReview: needsReview.length,
      total: noChanges.length + changes.length + needsReview.length
    },
    changes: changes.map(c => ({
      currentSlug: c.currentSlug,
      currentImage: c.currentImageName,
      targetName: c.targetName,
      reason: c.decision.reason,
      winner: c.decision.winner,
      similarity: c.decision.similarity,
      renameSlug: c.needsSlugRename,
      renameImage: c.needsImageRename
    })),
    needsReview: needsReview.map(c => ({
      currentSlug: c.currentSlug,
      currentImage: c.currentImageName,
      reason: c.decision.reason,
      similarity: c.decision.similarity
    })),
    alreadyPerfect: noChanges.map(c => c.current)
  };

  fs.writeFileSync(CHANGES_FILE, JSON.stringify(report, null, 2));
  console.log(`\n📄 Detailed report saved to: ${CHANGES_FILE}\n`);
}

/**
 * Execute changes
 */
function executeChanges(changes) {
  console.log('\n' + '='.repeat(80));
  console.log('🔄 EXECUTING CHANGES');
  console.log('='.repeat(80) + '\n');

  let mdxRenamed = 0;
  let imagesRenamed = 0;
  let mdxUpdated = 0;
  const errors = [];

  // Save backup first
  const backup = {
    timestamp: new Date().toISOString(),
    changes: changes.map(c => ({
      oldSlug: c.currentSlug,
      oldImage: c.currentImageName,
      newName: c.targetName,
      mdxPath: c.currentMdxPath,
      imagePath: c.currentImagePath
    }))
  };
  fs.writeFileSync(BACKUP_FILE, JSON.stringify(backup, null, 2));
  console.log(`💾 Backup saved to: ${BACKUP_FILE}\n`);

  for (let i = 0; i < changes.length; i++) {
    const c = changes[i];
    const progress = `[${i + 1}/${changes.length}]`;

    try {
      // 1. Rename MDX file if needed
      if (c.needsSlugRename) {
        if (fs.existsSync(c.currentMdxPath)) {
          fs.renameSync(c.currentMdxPath, c.targetMdxPath);
          mdxRenamed++;
          console.log(`${progress} ✅ MDX: ${c.currentSlugFile} → ${c.targetSlugFile}`);
        }
      }

      // 2. Rename image file if needed
      if (c.needsImageRename) {
        if (fs.existsSync(c.currentImagePath)) {
          fs.renameSync(c.currentImagePath, c.targetImagePath);
          imagesRenamed++;
          console.log(`${progress} ✅ IMG: ${c.currentImageName} → ${c.targetImageName}`);
        }
      }

      // 3. Update MDX frontmatter
      const mdxPath = c.needsSlugRename ? c.targetMdxPath : c.currentMdxPath;
      const fileContents = fs.readFileSync(mdxPath, 'utf8');
      const { data, content } = matter(fileContents);

      data.featured_image = c.newFeaturedImagePath;

      // Remove "best" from title if present
      if (data.title && /\bbest\b/i.test(data.title)) {
        data.title = data.title
          .replace(/^best\s+/i, '') // Remove "best " prefix
          .replace(/\s+best\s+/gi, ' ') // Remove " best " in middle
          .replace(/\s+best$/i, '') // Remove " best" suffix
          .replace(/\s+/g, ' ') // Clean up double spaces
          .trim();
        // Capitalize first letter
        data.title = data.title.charAt(0).toUpperCase() + data.title.slice(1);
      }

      const newContents = matter.stringify(content, data);
      fs.writeFileSync(mdxPath, newContents);
      mdxUpdated++;

    } catch (error) {
      errors.push({
        slug: c.currentSlug,
        error: error.message
      });
      console.error(`${progress} ❌ Error: ${c.currentSlug} - ${error.message}`);
    }
  }

  // 4. Update enhancement-progress.json if it exists
  if (fs.existsSync(PROGRESS_FILE)) {
    console.log('\n🔄 Updating enhancement progress file...');
    const progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));

    // Build slug mapping
    const slugMapping = {};
    changes.forEach(c => {
      if (c.needsSlugRename) {
        slugMapping[c.currentSlug] = c.targetName;
      }
    });

    // Update processed array
    progress.processed = progress.processed.map(slug => slugMapping[slug] || slug);

    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
    console.log('   ✅ Enhancement progress updated');
  }

  return { mdxRenamed, imagesRenamed, mdxUpdated, errors };
}

/**
 * Main execution
 */
async function main() {
  console.log('\n🧠 Smart Recipe Name Standardization\n');

  if (EXECUTE) {
    console.log('⚠️  EXECUTE MODE: Changes will be made!\n');
  } else {
    console.log('👁️  ANALYSIS MODE: No changes will be made\n');
    console.log('   Run with --execute to apply changes\n');
  }

  // Get all recipes
  console.log('📖 Reading recipes...');
  const recipes = getAllRecipes();
  console.log(`   Found ${recipes.length} recipes\n`);

  // Build change plan
  console.log('🔍 Analyzing with smart detection...');
  const { changes, noChanges, needsReview } = buildChangePlan(recipes);

  // Display analysis
  displayAnalysis(changes, noChanges, needsReview);

  // Save detailed report
  saveChangeReport(changes, noChanges, needsReview);

  if (needsReview.length > 0) {
    console.log(`⚠️  ${needsReview.length} items need manual review (see report file)\n`);
  }

  if (changes.length === 0) {
    console.log('✅ All names are already standardized!\n');
    process.exit(0);
  }

  // Execute if requested
  if (EXECUTE) {
    const { mdxRenamed, imagesRenamed, mdxUpdated, errors } = executeChanges(changes);

    console.log('\n' + '='.repeat(80));
    console.log('📊 EXECUTION SUMMARY');
    console.log('='.repeat(80) + '\n');
    console.log(`✅ MDX files renamed:   ${mdxRenamed}`);
    console.log(`✅ Images renamed:      ${imagesRenamed}`);
    console.log(`✅ MDX files updated:   ${mdxUpdated}`);
    console.log(`❌ Errors:              ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n❌ Errors:\n');
      errors.forEach(e => console.log(`   ${e.slug}: ${e.error}`));
    }

    console.log('\n🎉 Standardization complete!\n');

  } else {
    console.log('\n' + '='.repeat(80));
    console.log('To execute changes, run:');
    console.log('  node scripts/standardize-names-smart.js --execute\n');
  }
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
