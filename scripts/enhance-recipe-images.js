#!/usr/bin/env node

/**
 * AI-Enhanced Recipe Images Script
 *
 * Uses OpenAI's gpt-image-1.5 to edit and enhance recipe food photography
 * - Edits existing images directly with gpt-image-1.5 (preserves food appearance)
 * - Interactive approval workflow with custom retry instructions
 * - Progress tracking and resumable sessions
 * - Faster and cheaper than generation (no vision analysis needed)
 *
 * Usage:
 *   npm run enhance-images
 *
 * Requirements:
 *   - OPENAI_API_KEY in .env.local
 *   - openai package installed
 *   - Verified OpenAI organization (for gpt-image-1.5 access)
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const matter = require('gray-matter');

// Configuration
const CONFIG = {
  model: 'gpt-image-1.5',              // Image editing model
  imageSize: '1536x1024',              // Image size (1024x1024, 1536x1024, 1024x1536)
  imageQuality: 'medium',              // Quality tier: low ($0.013), medium ($0.05), high ($0.20)
  maxCostLimit: 50,                    // Maximum budget limit ($)
  estimatedCostPerImage: 0.05,         // Cost per image (medium quality editing)
  maxRetriesPerImage: 5,               // Max retries per image to prevent runaway costs
  testMode: true,                      // Test mode: process only first 10 images
};

// Initialize OpenAI client
let openai;

/**
 * Load all recipes from content/recipes directory
 */
function getAllRecipes(includeDrafts = true) {
  const recipesDir = path.join(process.cwd(), 'content/recipes');

  if (!fs.existsSync(recipesDir)) {
    return [];
  }

  const files = fs.readdirSync(recipesDir).filter(file => file.endsWith('.mdx'));

  const recipes = files
    .map(file => {
      const slug = file.replace(/\.mdx$/, '');
      const fullPath = path.join(recipesDir, file);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data } = matter(fileContents);

      return {
        slug,
        title: data.title || slug,
        featured_image: data.featured_image,
        ingredients: Array.isArray(data.ingredients)
          ? data.ingredients
          : (data.ingredients?.split('\n').filter(Boolean) || []),
        draft: data.draft || false
      };
    })
    .filter(recipe => {
      if (!includeDrafts && recipe.draft) return false;
      return true;
    });

  return recipes;
}

/**
 * Edit and enhance image with gpt-image-1.5
 */
async function editEnhancedImage(originalImagePath, recipe, customInstructions = '') {
  let enhancementPrompt = `Edit this ${recipe.title} photo to enhance it for a professional recipe blog.

Recipe: ${recipe.title}
Ingredients: ${recipe.ingredients.join(', ')}

EDITING INSTRUCTIONS:
1. Correct white balance and improve lighting to make the food look appetizing
2. Enhance the background - remove clutter and make it clean and professional
3. Keep the actual food EXACTLY as it appears (preserve its homemade appearance without any additional ingredients on the plate or serving dish).
4. Add subtle touches like a light sprinkle or slice of relevant ingredients around the edges with random placement
5. Make it look like professional food photography while maintaining authenticity

CRITICAL: The result should look inviting and professional, but still clearly homemade. Make MINIMAL edits to the food itself - only light polish and enhancement. The food must remain authentic and recognizably from the original photo.`;

  // Add custom instructions if provided (for retry with custom instructions)
  if (customInstructions) {
    enhancementPrompt += `\n\nADDITIONAL INSTRUCTIONS:\n${customInstructions}`;
  }

  // Determine MIME type from file extension
  const ext = path.extname(originalImagePath).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp'
  };
  const mimeType = mimeTypes[ext] || 'image/jpeg';

  // Read file and create a proper File object with MIME type
  const fileBuffer = fs.readFileSync(originalImagePath);
  const fileName = path.basename(originalImagePath);
  const file = new File([fileBuffer], fileName, { type: mimeType });

  const response = await openai.images.edit({
    model: CONFIG.model,
    image: file,
    prompt: enhancementPrompt,
    size: CONFIG.imageSize,
    quality: CONFIG.imageQuality,
    n: 1
  });

  // Handle response - API returns base64 data, not URL
  const imageData = response.data?.[0];
  if (!imageData) {
    throw new Error('No image data in response');
  }

  // Convert base64 to buffer
  if (imageData.b64_json) {
    return Buffer.from(imageData.b64_json, 'base64');
  } else if (imageData.url) {
    // Fallback to URL if provided
    const imageResponse = await fetch(imageData.url);
    const imageBuffer = await imageResponse.arrayBuffer();
    return Buffer.from(imageBuffer);
  } else {
    throw new Error('No b64_json or url in response data');
  }
}

/**
 * Get custom instructions for retry
 */
async function getCustomInstructions() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log('\n✏️  What should be different in the new version?');
    console.log('Examples:');
    console.log('  - Make the background less busy');
    console.log('  - Improve lighting on the left side');
    console.log('  - Add warmer tones');
    console.log('  - Remove distracting objects');
    console.log('');

    rl.question('Enter additional instructions (or press Enter to cancel): ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Get user approval decision
 */
async function getUserApproval() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log('\nWhat would you like to do?');
    console.log('  1. ✅ Approve (save to approved/)');
    console.log('  2. ❌ Reject (save to rejected/, move to next)');
    console.log('  3. 🔄 Retry (re-edit with same prompt)');
    console.log('  4. ✏️  Retry with custom instructions (add specific guidance)');
    console.log('  5. ⏭️  Skip (keep original, move to next)');
    console.log('');

    rl.question('Your choice [1-5]: ', (answer) => {
      rl.close();
      const choice = answer.trim();

      switch (choice) {
        case '1': resolve('approve'); break;
        case '2': resolve('reject'); break;
        case '3': resolve('retry'); break;
        case '4': resolve('retry-custom'); break;
        case '5': resolve('skip'); break;
        default:
          console.log('Invalid choice, please try again.\n');
          resolve(getUserApproval());
      }
    });
  });
}

/**
 * Process a single recipe
 */
async function processRecipe(recipe, index, total) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📸 Processing: ${recipe.title} [${index + 1}/${total}]`);
  console.log(`${'='.repeat(70)}\n`);

  const originalPath = path.join(process.cwd(), 'public', recipe.featured_image);
  const previewPath = path.join(
    process.cwd(),
    'public/images/recipes-enhanced/previews',
    `${recipe.slug}.jpeg`
  );
  const approvedPath = path.join(
    process.cwd(),
    'public/images/recipes-enhanced/approved',
    `${recipe.slug}.jpeg`
  );
  const rejectedPath = path.join(
    process.cwd(),
    'public/images/recipes-enhanced/rejected',
    `${recipe.slug}.jpeg`
  );

  let attempts = 0;
  let totalCost = 0;
  let customInstructions = ''; // Preserve across loop iterations

  try {
    // Check if original image exists
    if (!fs.existsSync(originalPath)) {
      console.log(`⚠️  Original image not found: ${originalPath}`);
      console.log('   Skipping...\n');
      return { status: 'skipped', cost: 0, attempts: 0 };
    }

    // Editing and approval loop (allows retries)
    while (true) {
      // Check retry limit
      if (attempts >= CONFIG.maxRetriesPerImage) {
        console.log(`⚠️  Maximum retries (${CONFIG.maxRetriesPerImage}) reached for this image`);
        console.log('   Moving to next image...\n');
        return { status: 'skipped', cost: totalCost, attempts };
      }

      attempts++;

      // Step 1: Edit image with gpt-image-1.5
      console.log(`🎨 Editing image with gpt-image-1.5 (attempt ${attempts}/${CONFIG.maxRetriesPerImage})...`);
      console.log(`   Size: ${CONFIG.imageSize} (landscape)`);

      const enhancedBuffer = await editEnhancedImage(originalPath, recipe, customInstructions);
      console.log('   ✅ Edited successfully\n');
      // gpt-image-1.5 pricing for 1536x1024: low=$0.013, medium=$0.05, high=$0.20
      const imageCost = CONFIG.imageQuality === 'low' ? 0.013 :
        CONFIG.imageQuality === 'medium' ? 0.05 : 0.20;
      totalCost += imageCost;

      // Step 4: Save preview
      fs.writeFileSync(previewPath, enhancedBuffer);
      console.log(`📁 Preview saved: ${previewPath}\n`);

      // Step 5: Show comparison paths
      console.log('🖼️  Compare images:');
      console.log(`   Original: ${originalPath}`);
      console.log(`   Enhanced: ${previewPath}\n`);

      // Step 6: Get user decision
      const decision = await getUserApproval();

      // Step 7: Handle decision
      switch (decision) {
        case 'approve':
          fs.copyFileSync(previewPath, approvedPath);
          console.log('✅ Approved and saved!\n');
          return { status: 'approved', cost: totalCost, attempts };

        case 'reject':
          fs.copyFileSync(previewPath, rejectedPath);
          console.log('❌ Rejected and saved to rejected folder\n');
          return { status: 'rejected', cost: totalCost, attempts };

        case 'retry':
          customInstructions = ''; // Clear any custom instructions
          console.log('🔄 Retrying with original prompt...\n');
          continue; // Loop back to edit again

        case 'retry-custom':
          const newInstructions = await getCustomInstructions();
          if (!newInstructions) {
            console.log('Cancelled. Retrying with current settings...\n');
          } else {
            customInstructions = newInstructions;
            console.log(`\n📝 Custom instructions: "${customInstructions}"\n`);
            console.log('🔄 Re-editing with custom instructions...\n');
          }
          continue; // Loop back to edit with (possibly updated) instructions

        case 'skip':
          console.log('⏭️  Skipped (no changes made)\n');
          return { status: 'skipped', cost: totalCost, attempts };
      }
    }

  } catch (error) {
    console.error(`❌ Error processing ${recipe.title}:`, error.message);
    return { status: 'error', cost: totalCost, error: error.message, attempts };
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🎨 Recipe Image Enhancement Tool\n');

  // Check for OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY not found in environment variables');
    console.error('');
    console.error('Please add your OpenAI API key to .env.local:');
    console.error('  OPENAI_API_KEY=sk-your-key-here');
    console.error('');
    console.error('Get your API key from: https://platform.openai.com/api-keys');
    process.exit(1);
  }

  // Initialize OpenAI client
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  // Create output directories
  const dirs = [
    'public/images/recipes-enhanced',
    'public/images/recipes-enhanced/approved',
    'public/images/recipes-enhanced/previews',
    'public/images/recipes-enhanced/rejected'
  ];

  dirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  });
  console.log('');

  // Load or initialize progress
  const progressFile = path.join(process.cwd(), 'enhancement-progress.json');
  let progress = {
    processed: [],
    stats: { approved: 0, rejected: 0, skipped: 0, errors: 0 },
    totalCost: 0,
    totalAttempts: 0,
    lastUpdated: null
  };

  if (fs.existsSync(progressFile)) {
    progress = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
    console.log(`📊 Resuming from previous session\n`);
  }

  // Load all recipes with images
  const recipes = getAllRecipes(true); // Include drafts
  const recipesWithImages = recipes.filter(r => r.featured_image);
  let unprocessed = recipesWithImages.filter(r => !progress.processed.includes(r.slug));

  // Test mode: only process first 10 images
  if (CONFIG.testMode && unprocessed.length > 10) {
    console.log('⚠️  TEST MODE: Processing only first 10 images\n');
    unprocessed = unprocessed.slice(0, 10);
  }

  console.log(`Total recipes with images: ${recipesWithImages.length}`);
  console.log(`Already processed: ${progress.processed.length}`);
  console.log(`Remaining: ${unprocessed.length}\n`);

  if (unprocessed.length === 0) {
    console.log('🎉 All images have been processed!');
    console.log(`\n📁 Approved images: public/images/recipes-enhanced/approved/`);
    return;
  }

  // Cost estimate (gpt-image-1.5 editing: low=$0.013, medium=$0.05, high=$0.20)
  const costPerImage = CONFIG.imageQuality === 'low' ? 0.013 :
    CONFIG.imageQuality === 'medium' ? 0.05 : 0.20;
  const estimatedCost = unprocessed.length * costPerImage;
  console.log(`💰 Estimated cost for remaining: $${estimatedCost.toFixed(2)} (${unprocessed.length} images × $${costPerImage.toFixed(3)})`);
  console.log(`💰 Model: ${CONFIG.model}, Quality: ${CONFIG.imageQuality} ($${costPerImage.toFixed(3)}/image)`);
  console.log(`💰 Spent so far: $${progress.totalCost.toFixed(2)}`);
  console.log(`💰 Total estimated: $${(progress.totalCost + estimatedCost).toFixed(2)}`);
  console.log(`💰 Cost limit: $${CONFIG.maxCostLimit.toFixed(2)}\n`);

  if (progress.totalCost + estimatedCost > CONFIG.maxCostLimit) {
    console.log('⚠️  Warning: Estimated total cost may exceed limit!');
    console.log('   You can increase the limit in scripts/enhance-recipe-images.js\n');
  }

  // Process each recipe
  for (let i = 0; i < unprocessed.length; i++) {
    const recipe = unprocessed[i];

    // Show progress stats before each image (except first)
    if (i > 0) {
      console.log('\n📊 Progress Summary:');
      console.log(`   ✅ Approved: ${progress.stats.approved}`);
      console.log(`   ❌ Rejected: ${progress.stats.rejected}`);
      console.log(`   ⏭️  Skipped:  ${progress.stats.skipped}`);
      console.log(`   ❗ Errors:   ${progress.stats.errors}`);
      console.log(`   💰 Cost:     $${progress.totalCost.toFixed(2)}\n`);
    }

    // Process recipe
    const result = await processRecipe(recipe, i, unprocessed.length);

    // Update progress
    progress.processed.push(recipe.slug);
    progress.stats[result.status]++;
    progress.totalCost += result.cost;
    progress.totalAttempts += result.attempts || 0;
    progress.lastUpdated = new Date().toISOString();

    // Save progress after each image
    fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2));

    // Check cost limit
    if (progress.totalCost >= CONFIG.maxCostLimit) {
      console.log(`\n💰 Cost limit reached ($${CONFIG.maxCostLimit}). Stopping.`);
      console.log(`   Edit CONFIG.maxCostLimit in the script to continue.\n`);
      break;
    }
  }

  // Final summary
  console.log('\n' + '='.repeat(70));
  console.log('🎉 Enhancement Session Complete!');
  console.log('='.repeat(70));
  console.log(`✅ Approved:       ${progress.stats.approved}`);
  console.log(`❌ Rejected:       ${progress.stats.rejected}`);
  console.log(`⏭️  Skipped:        ${progress.stats.skipped}`);
  console.log(`❗ Errors:         ${progress.stats.errors}`);
  console.log(`🔄 Total attempts:  ${progress.totalAttempts}`);
  console.log(`💰 Total cost:     $${progress.totalCost.toFixed(2)}`);
  console.log(`\n📁 Approved images: public/images/recipes-enhanced/approved/`);

  const remaining = recipesWithImages.length - progress.processed.length;
  if (remaining > 0) {
    console.log(`\n⏸️  ${remaining} images remaining. Run again to continue.`);
  }
}

// Run the script
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
