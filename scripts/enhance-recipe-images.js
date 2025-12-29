#!/usr/bin/env node

/**
 * AI-Enhanced Recipe Images Script
 *
 * Uses OpenAI's GPT-4 Vision + DALL-E 3 to enhance recipe food photography
 * - Analyzes images with GPT-4 Vision
 * - Generates enhanced versions with DALL-E 3 (1792x1024 landscape)
 * - Interactive approval workflow with custom retry instructions
 * - Progress tracking and resumable sessions
 *
 * Usage:
 *   npm run enhance-images
 *
 * Requirements:
 *   - OPENAI_API_KEY in .env.local
 *   - openai package installed
 */

const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { getAllRecipes } = require('../lib/mdx');

// Configuration
const CONFIG = {
  openaiModel: 'gpt-4o',               // GPT-4 with vision
  dalleModel: 'dall-e-3',              // DALL-E 3 for generation
  imageSize: '1792x1024',              // Landscape format (all images)
  dalleQuality: 'hd',                  // HD quality
  maxCostLimit: 50,                    // Budget limit ($)
  estimatedCostPerImage: 0.09,         // $0.01 vision + $0.08 DALL-E HD
};

// Initialize OpenAI client
let openai;

/**
 * Analyze image with GPT-4 Vision
 */
async function analyzeWithVision(imagePath, recipe) {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');

  const prompt = `Analyze this food photo for the recipe: ${recipe.title}

Ingredients: ${recipe.ingredients.join(', ')}

Provide a detailed description of:
1. The dish and how it's plated
2. Current background elements
3. Current lighting and white balance
4. Composition and styling

IMPORTANT: The actual food/dish must be preserved EXACTLY as shown in the enhanced version. Only the background, lighting, white balance, and small decorative touches (like ingredient sprinkles) should be modified. The homemade appearance of the food itself must remain unchanged.`;

  const response = await openai.chat.completions.create({
    model: CONFIG.openaiModel,
    messages: [{
      role: "user",
      content: [
        { type: "text", text: prompt },
        {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${base64Image}`,
            detail: "high"
          }
        }
      ]
    }],
    max_tokens: 500
  });

  return response.choices[0].message.content;
}

/**
 * Generate enhanced image with DALL-E 3
 */
async function generateWithDALLE(analysisResult, recipe, customInstructions = '') {
  let enhancementPrompt = `Here is a recipe from my recipe blog, a photo of the recipe that I made and the list of ingredients for added context.

Recipe: ${recipe.title}
Ingredients: ${recipe.ingredients.join(', ')}

Provide a version of the image with the same size dimensions that corrects the white balance. Secondly, improve the background of the dish/plate/meal/food that removes any specific objects that are already there, and makes the image look like a professional food photographer took it.

Do not change the actual food that is in the image, so that it still looks homemade, but add small touches such as a sprinkle of a few ingredients around the edges, or a few items related to the recipe.

The food should look more inviting to eat than the original image, and appear as though it is homemade with excellent photography and lighting.

Image analysis from GPT-4:
${analysisResult}`;

  // Add custom instructions if provided (for retry with custom instructions)
  if (customInstructions) {
    enhancementPrompt += `\n\nADDITIONAL INSTRUCTIONS FOR THIS ATTEMPT:\n${customInstructions}`;
  }

  const response = await openai.images.generate({
    model: CONFIG.dalleModel,
    prompt: enhancementPrompt,
    n: 1,
    size: CONFIG.imageSize,
    quality: CONFIG.dalleQuality,
    response_format: 'url'
  });

  // Download generated image
  const imageUrl = response.data[0].url;
  const imageResponse = await fetch(imageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();

  return Buffer.from(imageBuffer);
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
    console.log('  3. 🔄 Retry (regenerate with same prompt)');
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

  try {
    // Check if original image exists
    if (!fs.existsSync(originalPath)) {
      console.log(`⚠️  Original image not found: ${originalPath}`);
      console.log('   Skipping...\n');
      return { status: 'skipped', cost: 0, attempts: 0 };
    }

    // Step 1: Analyze with GPT-4 Vision (do once, reuse for retries)
    console.log('🔍 Analyzing image with GPT-4 Vision...');
    const analysis = await analyzeWithVision(originalPath, recipe);
    console.log('   ✅ Analysis complete\n');
    console.log(`   ${analysis.substring(0, 200)}...\n`);
    totalCost += 0.01; // Vision cost

    // Step 2: Generation and approval loop (allows retries)
    while (true) {
      attempts++;

      // Get custom instructions if this is a retry-custom
      let customInstructions = '';

      // Step 3: Generate with DALL-E 3
      console.log(`🎨 Generating enhanced image (attempt ${attempts})...`);
      console.log(`   Size: ${CONFIG.imageSize} (landscape)`);

      const enhancedBuffer = await generateWithDALLE(analysis, recipe, customInstructions);
      console.log('   ✅ Generated successfully\n');
      totalCost += 0.08; // DALL-E cost

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
          console.log('🔄 Retrying with same prompt...\n');
          continue; // Loop back to generate again

        case 'retry-custom':
          customInstructions = await getCustomInstructions();
          if (!customInstructions) {
            console.log('Cancelled. Showing menu again...\n');
            continue; // Show approval menu again without regenerating
          }
          console.log(`\n📝 Custom instructions: "${customInstructions}"\n`);
          console.log('🔄 Regenerating with custom instructions...\n');

          // Generate with custom instructions
          const customBuffer = await generateWithDALLE(analysis, recipe, customInstructions);
          totalCost += 0.08;
          attempts++;

          fs.writeFileSync(previewPath, customBuffer);
          console.log(`📁 New preview saved\n`);
          console.log('🖼️  Compare images:');
          console.log(`   Original: ${originalPath}`);
          console.log(`   Enhanced: ${previewPath}\n`);
          // Loop back to show approval menu
          continue;

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
  const unprocessed = recipesWithImages.filter(r => !progress.processed.includes(r.slug));

  console.log(`Total recipes with images: ${recipesWithImages.length}`);
  console.log(`Already processed: ${progress.processed.length}`);
  console.log(`Remaining: ${unprocessed.length}\n`);

  if (unprocessed.length === 0) {
    console.log('🎉 All images have been processed!');
    console.log(`\n📁 Approved images: public/images/recipes-enhanced/approved/`);
    return;
  }

  // Cost estimate
  const estimatedCost = unprocessed.length * CONFIG.estimatedCostPerImage;
  console.log(`💰 Estimated cost for remaining: $${estimatedCost.toFixed(2)}`);
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
